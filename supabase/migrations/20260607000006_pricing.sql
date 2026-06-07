-- F1.1 Migration 06: Pricing Engine
-- Supports 5 pricing models: flat_rate, per_mile, per_km, hourly, zone_based

CREATE TABLE public.pricing_rules (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  vehicle_type_id   UUID REFERENCES public.vehicle_types(id),  -- NULL = applies to all types
  name              TEXT NOT NULL,
  model             pricing_model NOT NULL,

  -- Rates (only relevant fields used per model)
  base_price        NUMERIC(10,2) NOT NULL DEFAULT 0,
  per_mile_rate     NUMERIC(8,4) DEFAULT 0,
  per_km_rate       NUMERIC(8,4) DEFAULT 0,
  hourly_rate       NUMERIC(10,2) DEFAULT 0,
  minimum_fare      NUMERIC(10,2) DEFAULT 0,

  -- Zone-based fields
  origin_zone_id    UUID REFERENCES public.service_zones(id),
  destination_zone_id UUID REFERENCES public.service_zones(id),

  -- Surcharges
  airport_pickup_fee  NUMERIC(10,2) DEFAULT 0,
  airport_dropoff_fee NUMERIC(10,2) DEFAULT 0,
  night_surcharge_pct NUMERIC(5,2) DEFAULT 0,    -- % added 10pm-6am
  weekend_surcharge_pct NUMERIC(5,2) DEFAULT 0,
  holiday_surcharge_pct NUMERIC(5,2) DEFAULT 0,

  -- Surge pricing
  surge_enabled     BOOLEAN DEFAULT FALSE,
  surge_multiplier  NUMERIC(4,2) DEFAULT 1.0,

  -- Validity
  valid_from        DATE,
  valid_until       DATE,
  days_of_week      INTEGER[] DEFAULT '{0,1,2,3,4,5,6}',  -- 0=Sun, 6=Sat

  priority          INTEGER DEFAULT 0,    -- higher = evaluated first
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pricing_rules_company ON public.pricing_rules(company_id);
CREATE INDEX idx_pricing_rules_active ON public.pricing_rules(company_id, is_active);
CREATE INDEX idx_pricing_rules_vehicle_type ON public.pricing_rules(vehicle_type_id) WHERE vehicle_type_id IS NOT NULL;

CREATE TRIGGER pricing_rules_updated_at
  BEFORE UPDATE ON public.pricing_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_members_select_pricing"
  ON public.pricing_rules FOR SELECT
  USING (company_id = public.auth_company_id());

CREATE POLICY "admins_manage_pricing"
  ON public.pricing_rules FOR ALL
  USING (
    company_id = public.auth_company_id() AND
    public.auth_has_role('company_owner', 'company_admin')
  );

-- ─────────────────────────────────────────────
-- Price Quote cache (stores server-calculated quotes before booking)
CREATE TABLE public.price_quotes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  pricing_rule_id   UUID REFERENCES public.pricing_rules(id),
  vehicle_type_id   UUID REFERENCES public.vehicle_types(id),

  -- Route
  pickup_lat        NUMERIC(10,7),
  pickup_lng        NUMERIC(10,7),
  pickup_address    TEXT,
  dropoff_lat       NUMERIC(10,7),
  dropoff_lng       NUMERIC(10,7),
  dropoff_address   TEXT,
  distance_miles    NUMERIC(8,2),
  duration_minutes  INTEGER,

  -- Calculated server-side (NEVER from frontend)
  base_amount       NUMERIC(10,2) NOT NULL,
  surcharge_amount  NUMERIC(10,2) DEFAULT 0,
  tax_amount        NUMERIC(10,2) DEFAULT 0,
  total_amount      NUMERIC(10,2) NOT NULL,
  currency          TEXT DEFAULT 'USD',

  -- Expiry (quotes valid for 15 minutes)
  expires_at        TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
  is_used           BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_price_quotes_company ON public.price_quotes(company_id);
CREATE INDEX idx_price_quotes_expires ON public.price_quotes(expires_at);

-- RLS
ALTER TABLE public.price_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_members_select_quotes"
  ON public.price_quotes FOR SELECT
  USING (company_id = public.auth_company_id());

-- Quotes inserted only by server (service role) — no user INSERT policy
