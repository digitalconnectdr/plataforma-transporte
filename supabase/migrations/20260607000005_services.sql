-- F1.1 Migration 05: Services, Zones & Airports

-- Service zones (geographic pricing areas)
CREATE TABLE public.service_zones (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL DEFAULT 'standard' CHECK (type IN ('standard', 'airport', 'premium', 'restricted')),
  -- GeoJSON polygon stored as JSONB (use PostGIS geography if needed later)
  geometry      JSONB,
  center_lat    NUMERIC(10,7),
  center_lng    NUMERIC(10,7),
  radius_miles  NUMERIC(8,2),     -- for circle zones
  color         TEXT DEFAULT '#e9c176',   -- map display color
  sort_order    INTEGER DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_service_zones_company ON public.service_zones(company_id);
CREATE INDEX idx_service_zones_active ON public.service_zones(company_id, is_active);

CREATE TRIGGER service_zones_updated_at
  BEFORE UPDATE ON public.service_zones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.service_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_members_select_zones"
  ON public.service_zones FOR SELECT
  USING (company_id = public.auth_company_id());

CREATE POLICY "admins_manage_zones"
  ON public.service_zones FOR ALL
  USING (
    company_id = public.auth_company_id() AND
    public.auth_has_role('company_owner', 'company_admin')
  );

-- ─────────────────────────────────────────────

-- Airports (shared catalog — no company_id; all companies can use)
CREATE TABLE public.airports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iata_code   TEXT NOT NULL UNIQUE,    -- "JFK", "LAX", "MIA"
  icao_code   TEXT,
  name        TEXT NOT NULL,
  city        TEXT NOT NULL,
  state       TEXT,
  country     TEXT NOT NULL DEFAULT 'US',
  lat         NUMERIC(10,7),
  lng         NUMERIC(10,7),
  terminal_count INTEGER DEFAULT 1,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_airports_iata ON public.airports(iata_code);
CREATE INDEX idx_airports_country ON public.airports(country);

-- RLS — airports are public read, service-role write
ALTER TABLE public.airports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "airports_public_read"
  ON public.airports FOR SELECT
  USING (is_active = TRUE);

-- Airport surcharges per company (linking airports to companies with custom fees)
CREATE TABLE public.company_airports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  airport_id    UUID NOT NULL REFERENCES public.airports(id),
  pickup_fee    NUMERIC(10,2) DEFAULT 0,
  dropoff_fee   NUMERIC(10,2) DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, airport_id)
);

CREATE INDEX idx_company_airports_company ON public.company_airports(company_id);

-- RLS
ALTER TABLE public.company_airports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_members_select_company_airports"
  ON public.company_airports FOR SELECT
  USING (company_id = public.auth_company_id());

CREATE POLICY "admins_manage_company_airports"
  ON public.company_airports FOR ALL
  USING (
    company_id = public.auth_company_id() AND
    public.auth_has_role('company_owner', 'company_admin')
  );

-- Seed common airports (will be expanded in seed files)
INSERT INTO public.airports (iata_code, icao_code, name, city, state, country, lat, lng) VALUES
  ('JFK', 'KJFK', 'John F. Kennedy International Airport', 'New York', 'NY', 'US', 40.6413, -73.7781),
  ('LAX', 'KLAX', 'Los Angeles International Airport', 'Los Angeles', 'CA', 'US', 33.9425, -118.4081),
  ('ORD', 'KORD', 'O''Hare International Airport', 'Chicago', 'IL', 'US', 41.9742, -87.9073),
  ('MIA', 'KMIA', 'Miami International Airport', 'Miami', 'FL', 'US', 25.7959, -80.2870),
  ('LGA', 'KLGA', 'LaGuardia Airport', 'New York', 'NY', 'US', 40.7769, -73.8740),
  ('EWR', 'KEWR', 'Newark Liberty International Airport', 'Newark', 'NJ', 'US', 40.6895, -74.1745),
  ('BOS', 'KBOS', 'Logan International Airport', 'Boston', 'MA', 'US', 42.3656, -71.0096),
  ('DFW', 'KDFW', 'Dallas/Fort Worth International Airport', 'Dallas', 'TX', 'US', 32.8998, -97.0403),
  ('ATL', 'KATL', 'Hartsfield-Jackson Atlanta International Airport', 'Atlanta', 'GA', 'US', 33.6407, -84.4277),
  ('LAS', 'KLAS', 'Harry Reid International Airport', 'Las Vegas', 'NV', 'US', 36.0840, -115.1537),
  ('SDQ', 'MDSD', 'Las Américas International Airport', 'Santo Domingo', NULL, 'DO', 18.4297, -69.6689),
  ('PUJ', 'MDPC', 'Punta Cana International Airport', 'Punta Cana', NULL, 'DO', 18.5674, -68.3634),
  ('STI', 'MDST', 'Cibao International Airport', 'Santiago', NULL, 'DO', 19.4061, -70.6047);
