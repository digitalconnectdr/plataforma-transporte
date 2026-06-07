-- F1.1 Migration 09: Corporate Accounts

CREATE TABLE public.corporate_accounts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  contact_name          TEXT,
  contact_email         TEXT,
  billing_email         TEXT,
  phone                 TEXT,
  address               TEXT,
  tax_id                TEXT,

  -- Billing
  credit_limit          NUMERIC(10,2) DEFAULT 0,
  current_balance       NUMERIC(10,2) DEFAULT 0,  -- outstanding unpaid amount
  payment_terms         INTEGER DEFAULT 30,         -- net days
  billing_cycle         TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('weekly', 'bi_weekly', 'monthly')),

  -- Policies
  require_approval      BOOLEAN DEFAULT FALSE,      -- trips require manager approval
  approval_threshold    NUMERIC(10,2),              -- auto-approve below this amount
  allow_personal_trips  BOOLEAN DEFAULT FALSE,
  cost_center_required  BOOLEAN DEFAULT FALSE,

  stripe_customer_id    TEXT,
  notes                 TEXT,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_corporate_accounts_company ON public.corporate_accounts(company_id);
CREATE INDEX idx_corporate_accounts_active ON public.corporate_accounts(company_id, is_active);

CREATE TRIGGER corporate_accounts_updated_at
  BEFORE UPDATE ON public.corporate_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.corporate_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_select_corporate_accounts"
  ON public.corporate_accounts FOR SELECT
  USING (
    company_id = public.auth_company_id() AND
    public.auth_has_role('company_owner', 'company_admin', 'accounting', 'dispatcher')
  );

-- NOTE: corporate_users_select_own_account policy added below after corporate_members is created

CREATE POLICY "admins_manage_corporate_accounts"
  ON public.corporate_accounts FOR ALL
  USING (
    company_id = public.auth_company_id() AND
    public.auth_has_role('company_owner', 'company_admin')
  );

-- ─────────────────────────────────────────────

CREATE TABLE public.corporate_members (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  corporate_account_id  UUID NOT NULL REFERENCES public.corporate_accounts(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  role                  TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('manager', 'user')),
  spending_limit        NUMERIC(10,2),               -- per-trip spending limit
  monthly_limit         NUMERIC(10,2),
  cost_center           TEXT,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (corporate_account_id, user_id)
);

CREATE INDEX idx_corporate_members_account ON public.corporate_members(corporate_account_id);
CREATE INDEX idx_corporate_members_user ON public.corporate_members(user_id);
CREATE INDEX idx_corporate_members_company ON public.corporate_members(company_id);

ALTER TABLE public.corporate_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_select_corporate_members"
  ON public.corporate_members FOR SELECT
  USING (
    company_id = public.auth_company_id() AND
    public.auth_has_role('company_owner', 'company_admin', 'accounting')
  );

CREATE POLICY "corporate_users_select_own_membership"
  ON public.corporate_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "admins_manage_corporate_members"
  ON public.corporate_members FOR ALL
  USING (
    company_id = public.auth_company_id() AND
    public.auth_has_role('company_owner', 'company_admin')
  );

-- Corporate accounts policy that references corporate_members (deferred until corporate_members exists)
CREATE POLICY "corporate_users_select_own_account"
  ON public.corporate_accounts FOR SELECT
  USING (
    company_id = public.auth_company_id() AND
    public.auth_has_role('corporate_manager', 'corporate_user') AND
    id IN (
      SELECT corporate_account_id FROM public.corporate_members WHERE user_id = auth.uid()
    )
  );

-- Now add FK constraints that were deferred (corporate_account_id on bookings and invoices)
ALTER TABLE public.bookings
  ADD CONSTRAINT fk_bookings_corporate_account
  FOREIGN KEY (corporate_account_id) REFERENCES public.corporate_accounts(id);

ALTER TABLE public.invoices
  ADD CONSTRAINT fk_invoices_corporate_account
  FOREIGN KEY (corporate_account_id) REFERENCES public.corporate_accounts(id);
