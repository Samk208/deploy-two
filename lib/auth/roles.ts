import type { User } from '@supabase/supabase-js'

export function getMetaRole(user: User | null | undefined): string {
  const role = (user as any)?.app_metadata?.role ?? (user as any)?.user_metadata?.role
  return typeof role === 'string' ? role.toLowerCase() : ''
}

export function hasAnyRole(user: User | null | undefined, roles: string[]): boolean {
  const r = getMetaRole(user)
  return roles.includes(r)
}
