-- F1.1 Migration 08: Payments, Refunds & Invoices
-- Stripe Connect: platform collects, transfers to company accounts

CREATE TABLE public.payments (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id                UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  booking_id                UUID REFERENCES public.bookings(id),
  customer_id               UUID REFERENCES public.user_profiles(id),

  -- Stripe fields
  stripe_payment_intent_id  TEXT UNIQUE,
  stripe_charge_id          TEXT UNIQUE,
  stripe_connect_account_id TEXT,         -- company's Stripe Connect account

  -- Amounts (ALL server-calculated)
  amount                    NUMERIC(10,2) NOT NULL,
  currency                  TEXT NOT NULL DEFAULT 'USD',
  platform_fee              NUMERIC(10,2) DEFAULT 0,    -- LuxeRide platform fee
  net_amount                NUMERIC(10,2),              -- amount after platform fee

  status                    payment_status NOT NULL DEFAULT 'pending',
  payment_method            payment_method_type NOT NULL DEFAULT 'card',
  stripe_payment_method_id  TEXT,         -- for saved cards

  -- Metadata
  description               TEXT,
  metadata                  JSONB DEFAULT '{}',
  failure_code              TEXT,
  failure_message           TEXT,

  captured_at               TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_company ON public.payments(company_id);
CREATE INDEX idx_payments_booking ON public.payments(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX idx_payments_customer ON public.payments(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX idx_payments_stripe_pi ON public.payments(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
CREATE INDEX idx_payments_status ON public.payments(company_id, status);

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounting_select_payments"
  ON public.payments FOR SELECT
  USING (
    company_id = public.auth_company_id() AND
    public.auth_has_role('company_owner', 'company_admin', 'accounting', 'dispatcher')
  );

CREATE POLICY "customers_select_own_payments"
  ON public.payments FOR SELECT
  USING (
    company_id = public.auth_company_id() AND
    public.auth_has_role('customer', 'corporate_user', 'corporate_manager') AND
    customer_id = auth.uid()
  );

-- Payments inserted/updated only by service role (Stripe webhooks)

-- ─────────────────────────────────────────────

CREATE TABLE public.refunds (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  payment_id            UUID NOT NULL REFERENCES public.payments(id),
  booking_id            UUID REFERENCES public.bookings(id),
  stripe_refund_id      TEXT UNIQUE,
  amount                NUMERIC(10,2) NOT NULL,
  reason                TEXT,          -- 'duplicate', 'fraudulent', 'requested_by_customer', 'cancellation'
  status                TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed')),
  initiated_by          UUID REFERENCES public.user_profiles(id),
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refunds_company ON public.refunds(company_id);
CREATE INDEX idx_refunds_payment ON public.refunds(payment_id);

CREATE TRIGGER refunds_updated_at
  BEFORE UPDATE ON public.refunds
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounting_select_refunds"
  ON public.refunds FOR SELECT
  USING (
    company_id = public.auth_company_id() AND
    public.auth_has_role('company_owner', 'company_admin', 'accounting')
  );

-- ─────────────────────────────────────────────

CREATE TABLE public.invoices (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id           UUID REFERENCES public.user_profiles(id),
  corporate_account_id  UUID,           -- FK added after corporate table
  invoice_number        TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  subtotal              NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_amount            NUMERIC(10,2) DEFAULT 0,
  discount_amount       NUMERIC(10,2) DEFAULT 0,
  total_amount          NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency              TEXT DEFAULT 'USD',
  notes                 TEXT,
  due_date              DATE,
  sent_at               TIMESTAMPTZ,
  paid_at               TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

CREATE OR REPLACE FUNCTION public.set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('invoice_number_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoices_set_number
  BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_invoice_number();

CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_invoices_company ON public.invoices(company_id);
CREATE INDEX idx_invoices_customer ON public.invoices(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX idx_invoices_status ON public.invoices(company_id, status);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounting_select_invoices"
  ON public.invoices FOR SELECT
  USING (
    company_id = public.auth_company_id() AND
    public.auth_has_role('company_owner', 'company_admin', 'accounting')
  );

CREATE POLICY "customers_select_own_invoices"
  ON public.invoices FOR SELECT
  USING (
    company_id = public.auth_company_id() AND
    customer_id = auth.uid()
  );

-- ─────────────────────────────────────────────

CREATE TABLE public.invoice_line_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id    UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  booking_id    UUID REFERENCES public.bookings(id),
  description   TEXT NOT NULL,
  quantity      INTEGER DEFAULT 1,
  unit_price    NUMERIC(10,2) NOT NULL,
  total_price   NUMERIC(10,2) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoice_line_items_invoice ON public.invoice_line_items(invoice_id);

ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoice_line_items_select"
  ON public.invoice_line_items FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM public.invoices WHERE company_id = public.auth_company_id()
    )
  );
