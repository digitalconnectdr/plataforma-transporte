-- F1.1 Migration 04: Fleet Management
-- vehicle_types, vehicles, maintenance_records

CREATE TABLE public.vehicle_types (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,                    -- "Mercedes S-Class", "Cadillac Escalade"
  class         vehicle_class NOT NULL,
  capacity      INTEGER NOT NULL DEFAULT 4,
  amenities     TEXT[] DEFAULT '{}',              -- ["WiFi", "Water", "Phone Charger"]
  base_image_url TEXT,
  sort_order    INTEGER DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicle_types_company ON public.vehicle_types(company_id);
CREATE INDEX idx_vehicle_types_active ON public.vehicle_types(company_id, is_active);

CREATE TRIGGER vehicle_types_updated_at
  BEFORE UPDATE ON public.vehicle_types
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.vehicle_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_members_select_vehicle_types"
  ON public.vehicle_types FOR SELECT
  USING (company_id = public.auth_company_id());

CREATE POLICY "admins_manage_vehicle_types"
  ON public.vehicle_types FOR ALL
  USING (
    company_id = public.auth_company_id() AND
    public.auth_has_role('company_owner', 'company_admin')
  );

-- ─────────────────────────────────────────────

CREATE TABLE public.vehicles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  vehicle_type_id UUID NOT NULL REFERENCES public.vehicle_types(id),
  make            TEXT NOT NULL,
  model           TEXT NOT NULL,
  year            INTEGER NOT NULL,
  color           TEXT,
  plate_number    TEXT NOT NULL,
  vin             TEXT UNIQUE,
  status          vehicle_status NOT NULL DEFAULT 'available',
  current_driver_id UUID REFERENCES public.user_profiles(id),
  mileage         INTEGER DEFAULT 0,
  last_maintenance_at TIMESTAMPTZ,
  next_maintenance_at TIMESTAMPTZ,
  insurance_expires_at TIMESTAMPTZ,
  notes           TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicles_company ON public.vehicles(company_id);
CREATE INDEX idx_vehicles_status ON public.vehicles(company_id, status);
CREATE INDEX idx_vehicles_driver ON public.vehicles(current_driver_id) WHERE current_driver_id IS NOT NULL;

CREATE TRIGGER vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_members_select_vehicles"
  ON public.vehicles FOR SELECT
  USING (company_id = public.auth_company_id());

CREATE POLICY "dispatchers_update_vehicles"
  ON public.vehicles FOR UPDATE
  USING (
    company_id = public.auth_company_id() AND
    public.auth_has_role('company_owner', 'company_admin', 'dispatcher')
  );

CREATE POLICY "admins_manage_vehicles"
  ON public.vehicles FOR INSERT
  WITH CHECK (
    company_id = public.auth_company_id() AND
    public.auth_has_role('company_owner', 'company_admin')
  );

-- ─────────────────────────────────────────────

CREATE TABLE public.drivers (
  id                UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  company_id        UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  license_number    TEXT,
  license_expiry    DATE,
  license_state     TEXT,
  current_vehicle_id UUID REFERENCES public.vehicles(id),
  is_available      BOOLEAN NOT NULL DEFAULT FALSE,
  rating            NUMERIC(3,2) DEFAULT 5.00 CHECK (rating >= 0 AND rating <= 5),
  total_trips       INTEGER DEFAULT 0,
  total_earnings    NUMERIC(10,2) DEFAULT 0,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_drivers_company ON public.drivers(company_id);
CREATE INDEX idx_drivers_available ON public.drivers(company_id, is_available);

CREATE TRIGGER drivers_updated_at
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_members_select_drivers"
  ON public.drivers FOR SELECT
  USING (company_id = public.auth_company_id());

CREATE POLICY "drivers_update_own"
  ON public.drivers FOR UPDATE
  USING (id = auth.uid() AND company_id = public.auth_company_id());

CREATE POLICY "admins_manage_drivers"
  ON public.drivers FOR ALL
  USING (
    company_id = public.auth_company_id() AND
    public.auth_has_role('company_owner', 'company_admin', 'dispatcher')
  );

-- ─────────────────────────────────────────────

CREATE TABLE public.maintenance_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  vehicle_id    UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,     -- "oil_change", "tire_rotation", "inspection", etc.
  description   TEXT,
  cost          NUMERIC(10,2),
  mileage_at_service INTEGER,
  performed_at  DATE NOT NULL,
  next_due_at   DATE,
  technician    TEXT,
  shop_name     TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_maintenance_vehicle ON public.maintenance_records(vehicle_id);
CREATE INDEX idx_maintenance_company ON public.maintenance_records(company_id);

-- RLS
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_members_select_maintenance"
  ON public.maintenance_records FOR SELECT
  USING (company_id = public.auth_company_id());

CREATE POLICY "admins_manage_maintenance"
  ON public.maintenance_records FOR ALL
  USING (
    company_id = public.auth_company_id() AND
    public.auth_has_role('company_owner', 'company_admin', 'dispatcher')
  );
