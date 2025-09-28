import { createServerClient } from '@supabase/ssr'
import type { Database } from './database.types'
import type { NextRequest } from 'next/server'
import { cookies as nextCookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// For Pages Router - create server client with request context
export async function createServerSupabaseClient(request?: NextRequest) {
  // If we have a request, use its cookies
  if (request) {
    return createServerClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll().map(cookie => ({
              name: cookie.name,
              value: cookie.value
            }))
          },
          // In middleware/request context we cannot mutate request cookies here.
          // Session refresh in middleware is handled by lib/supabase/middleware.updateSession.
          // Provide a no-op to satisfy the interface.
          setAll() {},
        },
      }
    )
  }

  // Fallback for when no request context is available
  // Use Next.js App Router cookies store to properly read/write auth cookies.
  const store = await (nextCookies as unknown as () => Promise<any>)()
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return store?.get?.(name)?.value
      },
      set(name: string, value: string, options?: any) {
        store?.set?.(name, value, options)
      },
      remove(name: string, options?: any) {
        store?.set?.(name, '', { ...(options || {}), maxAge: 0 })
      },
    },
  })
}

// Type helpers
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Re-export for consistency
export { createServerSupabaseClient as default }
