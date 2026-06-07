-- F1.1 Migration 03: User Profiles & Auth helpers
-- Extends Supabase auth.users with app-specific data

CREATE TABLE public.user_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id    UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role          user_role NOT NULL DEFAULT 'customer',
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  phone         TEXT,
  avatar_url    TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen_at  TIMESTAMPTZ,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_company ON public.user_profiles(company_id);
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX idx_user_profiles_company_role ON public.user_profiles(company_id, role);

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Helper functions used by all RLS policies
-- Returns the company_id of the currently authenticated user
CREATE OR REPLACE FUNCTION public.auth_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM public.user_profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Returns the role of the currently authenticated user
CREATE OR REPLACE FUNCTION public.auth_role()
RETURNS user_role AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Returns true if current user has one of the given roles
CREATE OR REPLACE FUNCTION public.auth_has_role(VARIADIC roles user_role[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = ANY(roles)
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read profiles in their company
CREATE POLICY "company_members_select_profiles"
  ON public.user_profiles FOR SELECT
  USING (company_id = public.auth_company_id());

-- Users can update only their own profile
CREATE POLICY "users_update_own_profile"
  ON public.user_profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    -- Users cannot change their own role or company_id
    role = (SELECT role FROM public.user_profiles WHERE id = auth.uid()) AND
    company_id = public.auth_company_id()
  );

-- Admins can update any profile in their company
CREATE POLICY "admins_update_profiles"
  ON public.user_profiles FOR UPDATE
  USING (
    company_id = public.auth_company_id() AND
    public.auth_has_role('company_owner', 'company_admin')
  );

-- Admins can insert profiles (invite users)
CREATE POLICY "admins_insert_profiles"
  ON public.user_profiles FOR INSERT
  WITH CHECK (
    company_id = public.auth_company_id() AND
    public.auth_has_role('company_owner', 'company_admin')
  );

-- Auto-create user_profile on signup via trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create if company_id is passed in raw_user_meta_data
  IF NEW.raw_user_meta_data->>'company_id' IS NOT NULL THEN
    INSERT INTO public.user_profiles (id, company_id, role, first_name, last_name, phone)
    VALUES (
      NEW.id,
      (NEW.raw_user_meta_data->>'company_id')::UUID,
      COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer'),
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
      NEW.raw_user_meta_data->>'phone'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────
-- Companies RLS policies (deferred here because they reference user_profiles)

-- Company members can read their own company
CREATE POLICY "company_members_select"
  ON public.companies FOR SELECT
  USING (
    id IN (
      SELECT company_id FROM public.user_profiles WHERE id = auth.uid()
    )
  );

-- Only company_owner and company_admin can update company
CREATE POLICY "company_admins_update"
  ON public.companies FOR UPDATE
  USING (
    id IN (
      SELECT company_id FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('company_owner', 'company_admin')
    )
  );

-- Insert handled only by service role (super_admin creates companies)
-- No INSERT policy needed — anon/authenticated cannot create companies directly
