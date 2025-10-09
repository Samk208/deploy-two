/**
 * Unified Auth & Session Module
 *
 * Provides consolidated server-side session management and role-based authorization.
 * This module serves as the single source of truth for auth operations across
 * API routes and server components.
 *
 * @module lib/auth/session
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { type User, UserRole } from '@/lib/types'
import { type NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import type { TypedSupabaseClient } from '@/lib/supabase/types'

// Re-export UserRole for convenience
export { UserRole } from '@/lib/types'

/**
 * Get the current server-side session
 *
 * @param req - Optional NextRequest (for middleware/API routes)
 * @returns Session object with user and auth data, or null if not authenticated
 */
export async function getServerSession(req?: NextRequest) {
  try {
    const supabase = req
      ? await createServerSupabaseClient(req)
      : await createServerSupabaseClient()

    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
      return null
    }

    return session
  } catch (error) {
    console.error('[session] Error getting server session:', error)
    return null
  }
}

/**
 * Get the current user with their roles
 *
 * @param req - Optional NextRequest or TypedSupabaseClient
 * @returns User object with roles array, or null if not authenticated
 */
export async function getUserWithRoles(
  req?: NextRequest | TypedSupabaseClient
): Promise<User | null> {
  try {
    // Determine if we have a client or need to create one
    let supabase: TypedSupabaseClient

    if (!req) {
      supabase = await createServerSupabaseClient()
    } else if ('auth' in req) {
      // Already a supabase client
      supabase = req as TypedSupabaseClient
    } else {
      // NextRequest - create client
      supabase = await createServerSupabaseClient(req as NextRequest)
    }

    // Get session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return null

    // Fetch user profile with role
    const query = supabase
      .from('profiles')
      .select('id, name, role, avatar, verified, created_at, updated_at')
      .eq('id', session.user.id)
      .maybeSingle()

    const { data: profile, error } = await query

    if (error || !profile) {
      console.error('[session] Error fetching user profile:', error)
      return null
    }

    // Transform to User type
    const user: User = {
      id: profile.id,
      email: session.user.email ?? '',
      name: (profile as any).name ?? '',
      role: (profile as any).role as UserRole,
      avatar: (profile as any).avatar || undefined,
      verified: (profile as any).verified || false,
      createdAt: (profile as any).created_at ?? new Date().toISOString(),
      updatedAt: (profile as any).updated_at ?? new Date().toISOString()
    }

    return user
  } catch (error) {
    console.error('[session] Error getting user with roles:', error)
    return null
  }
}

/**
 * Check if user has any of the allowed roles
 *
 * @param user - User object or null
 * @param allowedRoles - Array of allowed role strings
 * @returns true if user has at least one of the allowed roles
 */
export function hasRole(
  user: User | null,
  allowedRoles: string[] | UserRole[]
): boolean {
  if (!user) return false

  const userRole = user.role as string
  const allowed = allowedRoles as string[]

  return allowed.includes(userRole)
}

/**
 * Require specific roles for access (use in API routes)
 *
 * Throws a 403 Forbidden response if user doesn't have required roles.
 * Returns the user if authorized.
 *
 * @param req - NextRequest or TypedSupabaseClient
 * @param requiredRoles - Array of required role strings
 * @returns User object if authorized
 * @throws NextResponse with 403 status if unauthorized
 *
 * @example
 * ```typescript
 * export async function GET(req: NextRequest) {
 *   const user = await requireRole(req, ['supplier', 'admin'])
 *   // User is guaranteed to have supplier or admin role here
 * }
 * ```
 */
export async function requireRole(
  req: NextRequest | TypedSupabaseClient,
  requiredRoles: string[] | UserRole[]
): Promise<User> {
  const user = await getUserWithRoles(req)

  if (!user) {
    throw NextResponse.json(
      { ok: false, error: 'Authentication required' },
      { status: 401 }
    )
  }

  if (!hasRole(user, requiredRoles)) {
    throw NextResponse.json(
      {
        ok: false,
        error: 'Forbidden',
        message: `Required roles: ${requiredRoles.join(', ')}`
      },
      { status: 403 }
    )
  }

  return user
}

/**
 * Require authentication (use in API routes)
 *
 * Returns the user if authenticated, throws 401 if not.
 *
 * @param req - NextRequest or TypedSupabaseClient
 * @returns User object if authenticated
 * @throws NextResponse with 401 status if not authenticated
 */
export async function requireAuth(
  req: NextRequest | TypedSupabaseClient
): Promise<User> {
  const user = await getUserWithRoles(req)

  if (!user) {
    throw NextResponse.json(
      { ok: false, error: 'Authentication required' },
      { status: 401 }
    )
  }

  return user
}

/**
 * Check if current environment has freezes enabled
 *
 * @returns Object with freeze status flags
 */
export function getFreezeStatus() {
  return {
    coreFreeze: process.env.CORE_FREEZE === 'true',
    shopsFreeze: process.env.SHOPS_FREEZE === 'true',
    dryRunOnboarding: process.env.DRY_RUN_ONBOARDING === 'true' || process.env.CORE_FREEZE === 'true'
  }
}

/**
 * Get redirect path based on user role
 *
 * @param user - User object
 * @returns Dashboard path for the user's role
 */
export function getRoleDashboardPath(user: User): string {
  switch (user.role) {
    case UserRole.ADMIN:
      return '/admin/dashboard'
    case UserRole.SUPPLIER:
      return '/dashboard/supplier'
    case UserRole.INFLUENCER:
      return '/dashboard/influencer'
    case UserRole.CUSTOMER:
    default:
      return '/'
  }
}
