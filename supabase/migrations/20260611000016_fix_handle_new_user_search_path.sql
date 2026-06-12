-- ─────────────────────────────────────────────────────────────────────────────
-- Fix: signup fallaba con "Database error creating new user" (GoTrue 500).
--
-- Causa raíz: handle_new_user() no tenía search_path fijo. Cuando GoTrue
-- (rol supabase_auth_admin) insertaba en auth.users, el trigger se compilaba
-- con SU search_path y no resolvía el tipo `user_role` (vive en public).
-- Como postgres sí lo resolvía, el INSERT manual funcionaba y el de Auth no.
--
-- Fix: SET search_path = public + tipos calificados (public.user_role).
-- NOTA: ya aplicada manualmente en producción el 2026-06-11; este archivo
-- la deja registrada para entornos nuevos.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'company_id' IS NOT NULL THEN
    INSERT INTO public.user_profiles (id, company_id, role, first_name, last_name, phone)
    VALUES (
      NEW.id,
      (NEW.raw_user_meta_data->>'company_id')::UUID,
      COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'customer'::public.user_role),
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
      NEW.raw_user_meta_data->>'phone'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
