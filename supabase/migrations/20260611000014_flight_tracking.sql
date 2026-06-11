-- Migration 14: Flight tracking
-- Estado del vuelo consultado a la API (AeroDataBox / FlightAware) para
-- reservaciones de aeropuerto. flight_checked_at sirve de throttle (30 min).

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS flight_status        TEXT,       -- 'scheduled','enroute','delayed','arrived','cancelled','unknown'
  ADD COLUMN IF NOT EXISTS flight_delay_minutes INTEGER,    -- minutos de retraso estimado (negativo = adelantado)
  ADD COLUMN IF NOT EXISTS flight_checked_at    TIMESTAMPTZ; -- última consulta a la API

CREATE INDEX IF NOT EXISTS idx_bookings_flight_check
  ON public.bookings (company_id, scheduled_at)
  WHERE flight_number IS NOT NULL;
