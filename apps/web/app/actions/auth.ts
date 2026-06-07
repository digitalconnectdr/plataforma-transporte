'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getDefaultRoute } from '@/lib/auth/permissions'
import type { UserRole } from '@plataforma/database'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const SignupSchema = z.object({
  // Company
  company_name: z.string().min(2, 'Company name must be at least 2 characters'),
  company_slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  // Owner
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const ResetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

const UpdatePasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

// ─── Action Results ────────────────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

// ─── Login ─────────────────────────────────────────────────────────────────────

export async function loginAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const parsed = LoginSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Invalid credentials',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return { success: false, error: 'Invalid email or password' }
  }

  // Get user profile to determine redirect
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  const role = (profile?.role ?? 'customer') as UserRole
  revalidatePath('/', 'layout')
  redirect(getDefaultRoute(role))
}

// ─── Signup (creates company + owner) ──────────────────────────────────────────

export async function signupAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    company_name: formData.get('company_name') as string,
    company_slug: formData.get('company_slug') as string,
    first_name: formData.get('first_name') as string,
    last_name: formData.get('last_name') as string,
    email: formData.get('email') as string,
    phone: (formData.get('phone') as string) || undefined,
    password: formData.get('password') as string,
  }

  const parsed = SignupSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Please fix the errors below',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const admin = createAdminClient()

  // 1. Check slug availability
  const { data: existing } = await admin
    .from('companies')
    .select('id')
    .eq('slug', parsed.data.company_slug)
    .single()

  if (existing) {
    return {
      success: false,
      error: 'This company URL is already taken. Please choose a different one.',
      fieldErrors: { company_slug: ['This slug is already taken'] },
    }
  }

  // 2. Create the company
  const { data: company, error: companyError } = await admin
    .from('companies')
    .insert({
      name: parsed.data.company_name,
      slug: parsed.data.company_slug,
      status: 'trial',
      plan: 'free',
    })
    .select('id')
    .single()

  if (companyError || !company) {
    console.error('Company creation error:', companyError)
    return { success: false, error: 'Failed to create company. Please try again.' }
  }

  // 3. Create the auth user (with metadata for the trigger)
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: false, // Send confirmation email
    user_metadata: {
      company_id: company.id,
      role: 'company_owner',
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      phone: parsed.data.phone ?? null,
    },
  })

  if (authError || !authUser.user) {
    // Rollback: delete the company
    await admin.from('companies').delete().eq('id', company.id)
    console.error('Auth user creation error:', authError)
    if (authError?.message?.includes('already registered')) {
      return { success: false, error: 'An account with this email already exists.' }
    }
    return { success: false, error: 'Failed to create account. Please try again.' }
  }

  // 4. Create user_profile (trigger may handle this, but ensure it exists)
  const { error: profileError } = await admin.from('user_profiles').upsert({
    id: authUser.user.id,
    company_id: company.id,
    role: 'company_owner',
    first_name: parsed.data.first_name,
    last_name: parsed.data.last_name,
    phone: parsed.data.phone ?? null,
  })

  if (profileError) {
    console.error('Profile creation error:', profileError)
    // Non-fatal — trigger may have already created it
  }

  redirect('/auth/verify-email')
}

// ─── Logout ────────────────────────────────────────────────────────────────────

export async function logoutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/auth/login')
}

// ─── Reset Password ────────────────────────────────────────────────────────────

export async function resetPasswordAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = { email: formData.get('email') as string }
  const parsed = ResetPasswordSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: 'Please enter a valid email address' }
  }

  const headersList = await headers()
  const origin = headersList.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/auth/update-password`,
  })

  if (error) {
    console.error('Reset password error:', error)
    // Don't leak whether email exists
  }

  // Always show success to prevent email enumeration
  return { success: true }
}

// ─── Update Password ───────────────────────────────────────────────────────────

export async function updatePasswordAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    password: formData.get('password') as string,
    confirm_password: formData.get('confirm_password') as string,
  }

  const parsed = UpdatePasswordSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Please fix the errors below',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  })

  if (error) {
    return { success: false, error: 'Failed to update password. Please try again.' }
  }

  revalidatePath('/', 'layout')
  redirect('/admin/dashboard')
}
