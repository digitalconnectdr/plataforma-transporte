-- ── Seed de demo — LuxeRide ────────────────────────────────────────────────────
-- Empresa demo con flota, tarifas y zonas para probar el booking flow completo.
-- Ejecutar con: supabase db reset   (o psql -f supabase/seed/seed.sql)
--
-- NOTA: no crea usuarios (auth.users se llena vía /auth/signup).
-- Para administrar la empresa demo, regístrate y actualiza tu user_profile:
--   UPDATE user_profiles SET company_id = 'a0000000-0000-4000-8000-000000000001',
--     role = 'company_owner' WHERE id = '<tu-user-id>';

-- ── Empresa demo ──────────────────────────────────────────────────────────────
INSERT INTO public.companies (id, name, slug, status, plan, phone, email, city, country, timezone, currency)
VALUES (
  'a0000000-0000-4000-8000-000000000001',
  'Elite Transfers RD',
  'elite-demo',
  'active',
  'professional',
  '+1 809 555 0100',
  'reservas@elitedemo.example.com',
  'Santo Domingo',
  'DO',
  'America/Santo_Domingo',
  'USD'
)
ON CONFLICT (id) DO NOTHING;

-- ── Tipos de vehículo ─────────────────────────────────────────────────────────
INSERT INTO public.vehicle_types (id, company_id, name, class, capacity, amenities, sort_order) VALUES
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   'Mercedes-Benz Clase E', 'sedan', 3, ARRAY['WiFi', 'Agua', 'Cargador'], 1),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001',
   'Cadillac Escalade', 'suv', 6, ARRAY['WiFi', 'Agua', 'Cargador', 'Maletero XL'], 2),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001',
   'Mercedes-Benz Sprinter', 'sprinter', 12, ARRAY['WiFi', 'Agua', 'TV'], 3)
ON CONFLICT (id) DO NOTHING;

-- ── Vehículos físicos ─────────────────────────────────────────────────────────
INSERT INTO public.vehicles (id, company_id, vehicle_type_id, make, model, year, color, plate_number, status) VALUES
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   'b0000000-0000-4000-8000-000000000001', 'Mercedes-Benz', 'E 350', 2024, 'Negro', 'DEMO-001', 'available'),
  ('c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001',
   'b0000000-0000-4000-8000-000000000002', 'Cadillac', 'Escalade', 2023, 'Negro', 'DEMO-002', 'available'),
  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001',
   'b0000000-0000-4000-8000-000000000003', 'Mercedes-Benz', 'Sprinter 2500', 2023, 'Blanco', 'DEMO-003', 'available')
ON CONFLICT (id) DO NOTHING;

-- ── Reglas de precio ──────────────────────────────────────────────────────────
INSERT INTO public.pricing_rules
  (id, company_id, vehicle_type_id, name, model, base_price, per_mile_rate, minimum_fare,
   airport_pickup_fee, airport_dropoff_fee, night_surcharge_pct, weekend_surcharge_pct, priority)
VALUES
  -- Regla general (todos los tipos)
  ('d0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', NULL,
   'Tarifa general por milla', 'per_mile', 10.00, 3.50, 35.00, 15.00, 10.00, 20.00, 15.00, 0),
  -- Sedán ejecutivo
  ('d0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001',
   'b0000000-0000-4000-8000-000000000001',
   'Sedán ejecutivo', 'per_mile', 12.00, 4.00, 45.00, 15.00, 10.00, 20.00, 15.00, 10),
  -- SUV premium
  ('d0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001',
   'b0000000-0000-4000-8000-000000000002',
   'SUV premium', 'per_mile', 18.00, 5.50, 65.00, 20.00, 15.00, 20.00, 15.00, 10),
  -- Sprinter por hora
  ('d0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001',
   'b0000000-0000-4000-8000-000000000003',
   'Sprinter por hora', 'hourly', 0, 0, 120.00, 25.00, 20.00, 20.00, 15.00, 10)
ON CONFLICT (id) DO NOTHING;

-- Ajustar hourly_rate del Sprinter (columna no incluida arriba por orden)
UPDATE public.pricing_rules
SET hourly_rate = 110.00
WHERE id = 'd0000000-0000-4000-8000-000000000004';

-- ── Zona de servicio ──────────────────────────────────────────────────────────
INSERT INTO public.service_zones (id, company_id, name, type, center_lat, center_lng, radius_miles) VALUES
  ('e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   'Gran Santo Domingo', 'standard', 18.4861, -69.9312, 25.0),
  ('e0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001',
   'Zona Aeropuerto SDQ', 'airport', 18.4297, -69.6689, 8.0)
ON CONFLICT (id) DO NOTHING;

-- ── Aeropuertos de la empresa (catálogo global ya seedeado en migración 05) ──
INSERT INTO public.company_airports (company_id, airport_id, pickup_fee, dropoff_fee)
SELECT 'a0000000-0000-4000-8000-000000000001', id, 15.00, 10.00
FROM public.airports
WHERE iata_code IN ('SDQ', 'PUJ', 'STI')
ON CONFLICT (company_id, airport_id) DO NOTHING;
