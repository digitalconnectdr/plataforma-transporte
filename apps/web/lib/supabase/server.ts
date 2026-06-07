import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

/**
 * Supabase client for use in Server Components, Server Actions, and Route Handlers.
 * Reads cookies to restore the authenticated session server-side.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
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
