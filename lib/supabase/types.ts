import type { Database } from './database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

// Re-export Database type for external use
export type { Database }

// Unified type for all Supabase clients
export type TypedSupabaseClient = SupabaseClient<Database, 'public', any>

// Type helpers for consistent typing across all clients
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Query result types
export type QueryResult<T> = {
  data: T | null
  error: any
}

// Helper to ensure consistent client typing
export function ensureTypedClient(client: any): TypedSupabaseClient {
  return client as TypedSupabaseClient
}