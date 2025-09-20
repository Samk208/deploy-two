import { createServerClient } from '@supabase/ssr'
import type { Database } from './database.types'
import type { NextRequest } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// For Pages Router - create server client with request context
export function createServerSupabaseClient(request?: NextRequest) {
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
          setAll() {
            // No-op for server-side operations in Pages Router
          },
        },
      }
    )
  }

  // Fallback for when no request context is available
  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          // Return empty array when no request context
          return []
        },
        setAll() {
          // No-op for server-side operations
        },
      },
    }
  )
}

// Type helpers
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Re-export for consistency
export { createServerSupabaseClient as default }
