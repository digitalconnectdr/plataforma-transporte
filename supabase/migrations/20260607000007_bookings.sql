-- F1.1 Migration 07: Bookings
-- Core booking engine with 10-state machine

CREATE TABLE public.bookings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  booking_number      TEXT NOT NULL,   -- human-readable: LXR-2026-00001
  status              booking_status NOT NULL DEFAULT 'pending',
  type                booking_type NOT NULL DEFAULT 'one_way',

  -- People
  customer_id         UUID REFERENCES public.user_profiles(id),
  driver_id           UUID REFERENCES public.user_profiles(id),
  vehicle_id          UUID REFERENCES public.vehicles(id),
  vehicle_type_id     UUID REFERENCES public.vehicle_types(id),
  corporate_account_id UUID,          -- FK added after corporate table

  -- Passengers
  passenger_count     INTEGER NOT NULL DEFAULT 1,
  passenger_name      TEXT,           -- for non-registered customers
  passenger_phone     TEXT,
  passenger_email     TEXT,

  -- Locations (JSONB for flexibility: {address, lat, lng, place_id, notes})
  pickup_location     JSONB NOT NULL,
  dropoff_location    JSONB NOT NULL,
  waypoints           JSONB[] DEFAULT '{}',

  -- Schedule
  scheduled_at        TIMESTAMPTZ NOT NULL,
  flight_number       TEXT,           -- for airport pickups
  flight_arrival_at   TIMESTAMPTZ,
  meet_and_greet      BOOLEAN DEFAULT FALSE,
  sign_name           TEXT,           -- name to display on sign

  -- Trip data (filled during trip)
  dispatched_at       TIMESTAMPTZ,
  en_route_at         TIMESTAMPTZ,
  arrived_at          TIMESTAMPTZ,
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  no_show_at          TIMESTAMPTZ,

  -- Distance & Duration (server-calculated)
  distance_miles      NUMERIC(8,2),
  duration_minutes    INTEGER,
  actual_distance_miles NUMERIC(8,2),
  actual_duration_minutes INTEGER,

  -- Pricing (ALL server-calculated — frontend NEVER sends amounts)
  price_quote_id      UUID REFERENCES public.price_quotes(id),
  base_amount         NUMERIC(10,2),
  total_amount        NUMERIC(10,2),
  currency            TEXT DEFAULT 'USD',
  gratuity_amount     NUMERIC(10,2) DEFAULT 0,
  gratuity_pct        NUMERIC(5,2) DEFAULT 0,

  -- Misc
  special_instructions TEXT,
  internal_notes      TEXT,
  cancellation_reason TEXT,
  cancelled_by        UUID REFERENCES public.user_profiles(id),
  rating              INTEGER CHECK (rating >= 1 AND rating <= 5),
  rating_comment      TEXT,
  rated_at            TIMESTAMPTZ,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Generate booking number (LXR-YYYY-NNNNN)
CREATE SEQUENCE IF NOT EXISTS booking_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_booking_number(p_company_id UUID)
RETURNS TEXT AS $$
DECLARE
  seq_val BIGINT;
  year_part TEXT;
BEGIN
  seq_val := nextval('booking_number_seq');
  year_part := TO_CHAR(NOW(), 'YYYY');
  RETURN 'LXR-' || year_part || '-' || LPAD(seq_val::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.set_booking_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_number IS NULL OR NEW.booking_number = '' THEN
    NEW.booking_number := public.generate_booking_number(NEW.company_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bookings_set_number
  BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_booking_number();

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_bookings_company ON public.bookings(company_id);
CREATE INDEX idx_bookings_status ON public.bookings(company_id, status);
CREATE INDEX idx_bookings_customer ON public.bookings(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX idx_bookings_driver ON public.bookings(driver_id) WHERE driver_id IS NOT NULL;
CREATE INDEX idx_bookings_scheduled ON public.bookings(company_id, scheduled_at);
CREATE INDEX idx_bookings_number ON public.bookings(booking_number);

-- RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Dispatchers, admins: all company bookings
CREATE POLICY "staff_select_bookings"
  ON public.bookings FOR SELECT
  USING (
    company_id = public.auth_company_id() AND
    public.auth_has_role('company_owner', 'company_admin', 'dispatcher', 'accounting')
  );

-- Customers: only their own bookings
CREATE POLICY "customers_select_own_bookings"
  ON public.bookings FOR SELECT
  USING (
    company_id = public.auth_company_id() AND
    public.auth_has_role('customer') AND
    customer_id = auth.uid()
  );

-- Drivers: only their assigned bookings
CREATE POLICY "drivers_select_assigned_bookings"
  ON public.bookings FOR SELECT
  USING (
    company_id = public.auth_company_id() AND
    public.auth_has_role('driver') AND
    driver_id = auth.uid()
  );

-- Corporate managers: bookings from their account (FK to be added)
CREATE POLICY "corporate_managers_select_bookings"
  ON public.bookings FOR SELECT
  USING (
    company_id = public.auth_company_id() AND
    public.auth_has_role('corporate_manager', 'corporate_user') AND
    customer_id = auth.uid()  -- simplified; full corp logic in app layer
  );

-- Booking INSERT: customers and staff can create
CREATE POLICY "users_insert_bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (company_id = public.auth_company_id());

-- Booking UPDATE: staff can update, drivers can update status fields
CREATE POLICY "staff_update_bookings"
  ON public.bookings FOR UPDATE
  USING (
    company_id = public.auth_company_id() AND
    public.auth_has_role('company_owner', 'company_admin', 'dispatcher')
  );

-- ─────────────────────────────────────────────

CREATE TABLE public.booking_fees (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,    -- 'base', 'surge', 'airport', 'toll', 'tax', 'gratuity', 'extra'
  description TEXT,
  amount      NUMERIC(10,2) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_booking_fees_booking ON public.booking_fees(booking_id);
CREATE INDEX idx_booking_fees_company ON public.booking_fees(company_id);

ALTER TABLE public.booking_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "booking_fees_select"
  ON public.booking_fees FOR SELECT
  USING (company_id = public.auth_company_id());

-- ─────────────────────────────────────────────

CREATE TABLE public.booking_extras (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,     -- "Child Seat", "Extra Stop", "Meet & Greet"
  quantity    INTEGER DEFAULT 1,
  unit_price  NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_booking_extras_booking ON public.booking_extras(booking_id);

ALTER TABLE public.booking_extras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "booking_extras_select"
  ON public.booking_extras FOR SELECT
  USING (company_id = public.auth_company_id());
