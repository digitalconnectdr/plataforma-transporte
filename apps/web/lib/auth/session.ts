import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@plataforma/database'
import type { Database } from '@plataforma/database'
import { getDefaultRoute } from './permissions'

export type UserProfile = Database['public']['Tables']['user_profiles']['Row']

export interface SessionUser {
  id: string
  email: string
  role: UserRole
  company_id: string | null
  profile: UserProfile
}

/**
 * Get the current authenticated user + their profile.
 * Returns null if not authenticated.
 * Use in Server Components and Server Actions.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return null

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) return null

  return {
    id: user.id,
    email: user.email!,
    role: profile.role as UserRole,
    company_id: profile.company_id,
    profile,
  }
}

/**
 * Require authentication. Redirects to /auth/login if not authenticated.
 * Use at the top of protected Server Components.
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/login')
  }
  return user
}

/**
 * Require specific roles. Redirects to the user's default route if role doesn't match.
 */
export async function requireRole(...roles: UserRole[]): Promise<SessionUser> {
  const user = await requireAuth()
  if (!roles.includes(user.role)) {
    redirect(getDefaultRoute(user.role))
  }
  return user
}

/**
 * Redirect authenticated users away (e.g., from auth pages).
 * Use on login/signup pages.
 */
export async function redirectIfAuthenticated(to?: string): Promise<void> {
  const user = await getCurrentUser()
  if (user) {
    redirect(to ?? getDefaultRoute(user.role))
  }
}
