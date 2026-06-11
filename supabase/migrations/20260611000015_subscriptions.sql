-- Migration 15: Suscripciones de empresas (panel del owner de la plataforma)
-- subscription_ends_at = hasta cuándo está pagado el servicio de la empresa.
-- Las renovaciones extienden esta fecha desde max(now, vencimiento actual).

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_companies_subscription
  ON public.companies (status, subscription_ends_at);
