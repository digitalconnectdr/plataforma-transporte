-- F1.1 Migration 11: Documents & Audit Logs

-- Driver & vehicle documents (stored in Supabase Storage)
CREATE TABLE public.documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  driver_id       UUID REFERENCES public.drivers(id) ON DELETE CASCADE,
  vehicle_id      UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  type            document_type NOT NULL,
  file_url        TEXT NOT NULL,
  file_name       TEXT NOT NULL,
  file_size_bytes INTEGER,
  mime_type       TEXT,
  expires_at      DATE,
  verified_at     TIMESTAMPTZ,
  verified_by     UUID REFERENCES public.user_profiles(id),
  is_verified     BOOLEAN DEFAULT FALSE,
  rejection_reason TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (driver_id IS NOT NULL OR vehicle_id IS NOT NULL)
);

CREATE INDEX idx_documents_company ON public.documents(company_id);
CREATE INDEX idx_documents_driver ON public.documents(driver_id) WHERE driver_id IS NOT NULL;
CREATE INDEX idx_documents_vehicle ON public.documents(vehicle_id) WHERE vehicle_id IS NOT NULL;
CREATE INDEX idx_documents_expiry ON public.documents(expires_at) WHERE expires_at IS NOT NULL;

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_select_documents"
  ON public.documents FOR SELECT
  USING (
    company_id = public.auth_company_id() AND
    public.auth_has_role('company_owner', 'company_admin', 'dispatcher')
  );

CREATE POLICY "drivers_select_own_documents"
  ON public.documents FOR SELECT
  USING (
    company_id = public.auth_company_id() AND
    public.auth_has_role('driver') AND
    driver_id = auth.uid()
  );

CREATE POLICY "drivers_insert_own_documents"
  ON public.documents FOR INSERT
  WITH CHECK (
    company_id = public.auth_company_id() AND
    driver_id = auth.uid()
  );

CREATE POLICY "admins_verify_documents"
  ON public.documents FOR UPDATE
  USING (
    company_id = public.auth_company_id() AND
    public.auth_has_role('company_owner', 'company_admin')
  );

-- ─────────────────────────────────────────────

-- Immutable audit trail for all critical operations
CREATE TABLE public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID REFERENCES public.companies(id),           -- NULL for super_admin actions
  user_id     UUID REFERENCES auth.users(id),
  action      TEXT NOT NULL,       -- 'INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', etc.
  table_name  TEXT,
  record_id   UUID,
  old_values  JSONB,
  new_values  JSONB,
  ip_address  INET,
  user_agent  TEXT,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_company ON public.audit_logs(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_logs_table ON public.audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit logs are read-only for admins; only service role can write
CREATE POLICY "admins_select_audit_logs"
  ON public.audit_logs FOR SELECT
  USING (
    company_id = public.auth_company_id() AND
    public.auth_has_role('company_owner', 'company_admin', 'accounting')
  );

-- No INSERT/UPDATE/DELETE policies — service role only
-- This ensures audit trail integrity

-- Generic audit log trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (
    company_id,
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values
  ) VALUES (
    CASE
      WHEN TG_OP = 'DELETE' THEN OLD.company_id
      ELSE NEW.company_id
    END,
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    CASE
      WHEN TG_OP = 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit trigger to critical tables
CREATE TRIGGER audit_bookings
  AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_payments
  AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_refunds
  AFTER INSERT OR UPDATE ON public.refunds
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_user_profiles
  AFTER INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_companies
  AFTER INSERT OR UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
