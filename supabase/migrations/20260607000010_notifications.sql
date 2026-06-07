-- F1.1 Migration 10: Notifications & Communication

CREATE TABLE public.notification_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID REFERENCES public.companies(id) ON DELETE CASCADE,  -- NULL = system default
  channel     notification_channel NOT NULL,
  type        TEXT NOT NULL,   -- 'booking_confirmation', 'driver_assigned', 'driver_en_route', etc.
  subject     TEXT,            -- for email
  body        TEXT NOT NULL,   -- supports {{variable}} placeholders
  variables   TEXT[] DEFAULT '{}',   -- list of available variables
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, channel, type)
);

CREATE INDEX idx_notification_templates_company ON public.notification_templates(company_id);
CREATE INDEX idx_notification_templates_type ON public.notification_templates(type);

CREATE TRIGGER notification_templates_updated_at
  BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_members_select_templates"
  ON public.notification_templates FOR SELECT
  USING (
    company_id IS NULL OR  -- system defaults visible to all
    company_id = public.auth_company_id()
  );

CREATE POLICY "admins_manage_templates"
  ON public.notification_templates FOR ALL
  USING (
    company_id = public.auth_company_id() AND
    public.auth_has_role('company_owner', 'company_admin')
  );

-- Seed default notification templates
INSERT INTO public.notification_templates (company_id, channel, type, subject, body, variables) VALUES
  (NULL, 'email', 'booking_confirmation',
   'Booking Confirmed — {{booking_number}}',
   'Dear {{passenger_name}}, your booking {{booking_number}} is confirmed for {{scheduled_at}}. Pickup: {{pickup_address}}. Drop-off: {{dropoff_address}}. Total: {{total_amount}}.',
   ARRAY['booking_number', 'passenger_name', 'scheduled_at', 'pickup_address', 'dropoff_address', 'total_amount']),

  (NULL, 'sms', 'booking_confirmation',
   NULL,
   'LuxeRide: Booking {{booking_number}} confirmed for {{scheduled_at}}. Driver will be assigned shortly.',
   ARRAY['booking_number', 'scheduled_at']),

  (NULL, 'email', 'driver_assigned',
   'Your Driver Is Assigned — {{booking_number}}',
   'Your driver {{driver_name}} ({{vehicle_make}} {{vehicle_model}}, plate {{plate_number}}) has been assigned to your trip on {{scheduled_at}}.',
   ARRAY['booking_number', 'driver_name', 'vehicle_make', 'vehicle_model', 'plate_number', 'scheduled_at']),

  (NULL, 'sms', 'driver_assigned',
   NULL,
   'LuxeRide: {{driver_name}} is your driver. {{vehicle_make}} {{vehicle_model}} - {{plate_number}}. Tracking: {{tracking_url}}',
   ARRAY['driver_name', 'vehicle_make', 'vehicle_model', 'plate_number', 'tracking_url']),

  (NULL, 'sms', 'driver_en_route',
   NULL,
   'LuxeRide: Your driver is on the way! Arriving in approx {{eta_minutes}} minutes.',
   ARRAY['eta_minutes']),

  (NULL, 'sms', 'driver_arrived',
   NULL,
   'LuxeRide: Your driver has arrived at {{pickup_address}}.',
   ARRAY['pickup_address']),

  (NULL, 'email', 'trip_completed',
   'Trip Completed — Receipt for {{booking_number}}',
   'Thank you for riding with LuxeRide. Your trip is complete. Total charged: {{total_amount}}. Rate your experience: {{rating_url}}',
   ARRAY['booking_number', 'total_amount', 'rating_url']),

  (NULL, 'email', 'booking_cancelled',
   'Booking Cancelled — {{booking_number}}',
   'Your booking {{booking_number}} has been cancelled. Reason: {{cancellation_reason}}. If you were charged, a refund will be processed within 5-7 business days.',
   ARRAY['booking_number', 'cancellation_reason']),

  (NULL, 'email', 'payment_receipt',
   'Payment Receipt — {{invoice_number}}',
   'Receipt for {{booking_number}}. Amount: {{total_amount}} {{currency}}. Payment method: {{payment_method}}.',
   ARRAY['booking_number', 'invoice_number', 'total_amount', 'currency', 'payment_method']),

  (NULL, 'email', 'driver_document_expiring',
   'Document Expiring Soon — Action Required',
   'Your {{document_type}} expires on {{expiry_date}}. Please upload a renewed document to continue receiving assignments.',
   ARRAY['document_type', 'expiry_date']),

  (NULL, 'email', 'corporate_invoice',
   'Invoice {{invoice_number}} — Due {{due_date}}',
   'Please find attached invoice {{invoice_number}} for {{total_amount}} {{currency}}, due on {{due_date}}.',
   ARRAY['invoice_number', 'total_amount', 'currency', 'due_date']),

  (NULL, 'email', 'company_welcome',
   'Welcome to LuxeRide — Your Account Is Ready',
   'Welcome to LuxeRide! Your company account is set up. Log in at {{login_url}} to start configuring your fleet and accepting bookings.',
   ARRAY['login_url']);

-- ─────────────────────────────────────────────

CREATE TABLE public.notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES public.user_profiles(id),
  booking_id    UUID REFERENCES public.bookings(id),
  template_id   UUID REFERENCES public.notification_templates(id),
  channel       notification_channel NOT NULL,
  type          TEXT NOT NULL,
  recipient     TEXT NOT NULL,    -- email address or phone number
  subject       TEXT,
  body          TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  provider_id   TEXT,             -- Resend message ID or Twilio SID
  error_message TEXT,
  sent_at       TIMESTAMPTZ,
  delivered_at  TIMESTAMPTZ,
  opened_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_company ON public.notifications(company_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_notifications_booking ON public.notifications(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX idx_notifications_status ON public.notifications(status, created_at);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_select_notifications"
  ON public.notifications FOR SELECT
  USING (
    company_id = public.auth_company_id() AND
    public.auth_has_role('company_owner', 'company_admin')
  );

CREATE POLICY "users_select_own_notifications"
  ON public.notifications FOR SELECT
  USING (
    company_id = public.auth_company_id() AND
    user_id = auth.uid()
  );
