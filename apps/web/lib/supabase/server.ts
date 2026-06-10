import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

// Explicit type for setAll parameter — TypeScript cannot infer it from
// createServerClient because the `cookies` option accepts a union type
// (CookieMethodsServer | CookieMethodsServerDeprecated), which breaks inference.
type CookieItem = {
  name: string
  value: string
  options?: {
    domain?: string
    expires?: Date | number
    httpOnly?: boolean
    maxAge?: number
    path?: string
    sameSite?: 'strict' | 'lax' | 'none' | boolean
    secure?: boolean
    priority?: 'low' | 'medium' | 'high'
    partitioned?: boolean
  }
}

/**
 * Supabase client for use in Server Components, Server Actions, and Route Handlers.
 * Reads cookies to restore the authenticated session server-side.
 */
export async function createClient() {
  const cookieStore = await cookies()

  // No <Database> generic — this client handles auth sessions only.
  // For typed table queries, use createAdminClient() in Server Actions.
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: CookieItem[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Server Component — cannot set cookies directly.
            // Middleware handles session refresh.
          }
        },
      },
    }
  )
}

/**
 * Supabase Admin client with Service Role key.
 * Uses @supabase/supabase-js createClient directly (no SSR cookie layer needed).
 * ONLY use in Server Actions and Route Handlers — never expose to client.
 * Bypasses RLS — use with extreme caution.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
