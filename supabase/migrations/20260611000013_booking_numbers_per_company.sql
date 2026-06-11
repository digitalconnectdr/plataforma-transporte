-- Migration 13: Booking numbers por empresa
-- Antes: secuencia GLOBAL compartida entre todos los tenants (cada empresa
-- veía saltos en sus números y podía inferir el volumen de la plataforma).
-- Ahora: contador atómico por empresa + año.

CREATE TABLE public.booking_counters (
  company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  year        INTEGER NOT NULL,
  counter     BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (company_id, year)
);

ALTER TABLE public.booking_counters ENABLE ROW LEVEL SECURITY;
-- Sin policies: solo la función SECURITY DEFINER y el service role escriben.

-- Inicializar contadores con el máximo existente por empresa/año para que
-- los números nuevos no colisionen con los generados por la secuencia global.
INSERT INTO public.booking_counters (company_id, year, counter)
SELECT
  company_id,
  EXTRACT(YEAR FROM created_at)::INTEGER,
  MAX(NULLIF(SUBSTRING(booking_number FROM '(\d+)$'), '')::BIGINT)
FROM public.bookings
WHERE booking_number ~ '\d+$'
GROUP BY company_id, EXTRACT(YEAR FROM created_at)::INTEGER
ON CONFLICT (company_id, year) DO NOTHING;

-- Reemplaza la función global: UPSERT atómico por empresa+año.
-- SECURITY DEFINER porque el trigger corre con los privilegios del usuario
-- que inserta el booking (RLS no da acceso a booking_counters).
CREATE OR REPLACE FUNCTION public.generate_booking_number(p_company_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_year    INTEGER := EXTRACT(YEAR FROM NOW())::INTEGER;
  v_counter BIGINT;
BEGIN
  INSERT INTO public.booking_counters (company_id, year, counter)
  VALUES (p_company_id, v_year, 1)
  ON CONFLICT (company_id, year)
  DO UPDATE SET counter = public.booking_counters.counter + 1
  RETURNING counter INTO v_counter;

  RETURN 'LXR-' || v_year || '-' || LPAD(v_counter::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- La secuencia global ya no se usa (se conserva por si hay rollback).
