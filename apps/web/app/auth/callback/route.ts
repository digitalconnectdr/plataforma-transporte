import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDefaultRoute } from '@/lib/auth/permissions'
import type { UserRole } from '@/lib/auth/permissions'

/**
 * Supabase Auth callback handler.
 * Handles: email confirmation, magic links, OAuth, and password reset redirects.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? null
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle error from Supabase (e.g., expired link)
  if (error) {
    console.error('Auth callback error:', error, errorDescription)
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(errorDescription ?? error)}`
    )
  }

  if (code) {
    const supabase = await createClient()
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Code exchange error:', exchangeError)
      return NextResponse.redirect(`${origin}/auth/login?error=Authentication+failed`)
    }

    if (data.user) {
      // If there's a specific next path (e.g., update-password), go there
      if (next) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      // Otherwise, look up role and go to default dashboard
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      const role = ((profile as { role?: string } | null)?.role ?? 'customer') as UserRole
      return NextResponse.redirect(`${origin}${getDefaultRoute(role)}`)
    }
  }

  // No code — redirect to login
  return NextResponse.redirect(`${origin}/auth/login`)
}
