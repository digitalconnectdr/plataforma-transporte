-- F1.1 Migration 02: Companies
-- Root tenant table — every other table references company_id from here

CREATE TABLE public.companies (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  slug                  TEXT NOT NULL UNIQUE,           -- URL-safe identifier
  status                company_status NOT NULL DEFAULT 'trial',
  plan                  company_plan NOT NULL DEFAULT 'free',
  logo_url              TEXT,
  primary_color         TEXT DEFAULT '#e9c176',
  phone                 TEXT,
  email                 TEXT,
  address               TEXT,
  city                  TEXT,
  country               TEXT DEFAULT 'US',
  timezone              TEXT DEFAULT 'America/New_York',
  currency              TEXT DEFAULT 'USD',
  distance_unit         TEXT DEFAULT 'miles' CHECK (distance_unit IN ('miles', 'km')),

  -- Stripe Connect
  stripe_customer_id        TEXT UNIQUE,
  stripe_subscription_id    TEXT UNIQUE,
  stripe_connect_account_id TEXT UNIQUE,     -- for receiving payments
  stripe_connect_onboarded  BOOLEAN DEFAULT FALSE,

  -- Settings (JSONB for flexibility without schema migrations)
  settings  JSONB NOT NULL DEFAULT '{
    "booking": {
      "advance_booking_hours": 2,
      "max_advance_days": 90,
      "allow_instant_booking": true,
      "require_deposit": false,
      "deposit_percentage": 0
    },
    "gratuity": {
      "enabled": true,
      "default_percentage": 20,
      "options": [15, 18, 20, 25]
    },
    "notifications": {
      "email_enabled": true,
      "sms_enabled": true,
      "booking_confirmation": true,
      "driver_assigned": true,
      "driver_en_route": true,
      "trip_completed": true
    },
    "operational": {
      "auto_assign_driver": false,
      "require_vehicle_type": true
    }
  }',

  trial_ends_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_companies_slug ON public.companies(slug);
CREATE INDEX idx_companies_status ON public.companies(status);
CREATE INDEX idx_companies_stripe_customer ON public.companies(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- NOTE: RLS policies for companies are defined in migration 03 (users.sql)
-- after public.user_profiles exists to avoid circular dependency.
