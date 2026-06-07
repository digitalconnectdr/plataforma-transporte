import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import type { UserRole } from '@/lib/auth/permissions'
import { getDefaultRoute, ADMIN_ROLES } from '@/lib/auth/permissions'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // No <Database> generic — middleware only checks auth and role, uses type casts.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Always call getUser() — never getSession() — for security.
  // getUser() validates the JWT with the Supabase server.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ── Auth pages: redirect logged-in users to their dashboard ──────────────────
  if (pathname.startsWith('/auth') && !pathname.startsWith('/auth/callback')) {
    if (user) {
      // Get role to redirect to the correct dashboard
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = (profile?.role ?? 'customer') as UserRole
      return NextResponse.redirect(new URL(getDefaultRoute(role), request.url))
    }
  }

  // ── Protected routes: require authentication ──────────────────────────────────
  const protectedPrefixes = ['/admin', '/dispatcher', '/driver', '/corporate', '/account', '/super-admin']
  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix))

  if (isProtected && !user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Role-based route protection ───────────────────────────────────────────────
  if (isProtected && user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = (profile?.role ?? 'customer') as UserRole

    // Super admin panel
    if (pathname.startsWith('/super-admin') && role !== 'super_admin') {
      return NextResponse.redirect(new URL(getDefaultRoute(role), request.url))
    }

    // Admin panel — only admin roles
    if (pathname.startsWith('/admin') && !ADMIN_ROLES.includes(role)) {
      return NextResponse.redirect(new URL(getDefaultRoute(role), request.url))
    }

    // Driver panel — only drivers
    if (pathname.startsWith('/driver') && role !== 'driver') {
      return NextResponse.redirect(new URL(getDefaultRoute(role), request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
