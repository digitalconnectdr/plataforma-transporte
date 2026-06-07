-- F1.1 Migration 12: Realtime subscriptions & Storage buckets config
-- Enables Supabase Realtime for live dispatch dashboard

-- Enable Realtime for tables that need live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Storage buckets (created via Supabase API/Dashboard, but policies set here)
-- Buckets: 'documents', 'avatars', 'vehicle-images', 'company-logos'

-- NOTE: Run these after creating buckets in Supabase Dashboard → Storage
-- Or they will be created automatically by the app on first run

-- Documents bucket policies
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('documents', 'documents', false, 52428800,  -- 50MB
   ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('avatars', 'avatars', true, 5242880,         -- 5MB
   ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('vehicle-images', 'vehicle-images', true, 10485760,  -- 10MB
   ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('company-logos', 'company-logos', true, 5242880,     -- 5MB
   ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS for documents (private bucket)
CREATE POLICY "drivers_upload_own_documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "drivers_view_own_documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents' AND
    auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "admins_view_all_documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents' AND
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('company_owner', 'company_admin', 'dispatcher')
    )
  );

-- Storage RLS for avatars (public bucket, authenticated upload)
CREATE POLICY "users_upload_own_avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "users_update_own_avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::TEXT = (storage.foldername(name))[1]
  );

-- Storage RLS for vehicle images
CREATE POLICY "admins_manage_vehicle_images"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'vehicle-images' AND
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('company_owner', 'company_admin')
    )
  );

-- Storage RLS for company logos
CREATE POLICY "admins_manage_company_logos"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'company-logos' AND
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('company_owner', 'company_admin')
    )
  );
