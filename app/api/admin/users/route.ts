import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { paginationSchema } from "@/lib/validators"
import { getCurrentUser, hasRole } from "@/lib/auth-helpers"
import { UserRole, type PaginatedResponse } from "@/lib/types"

interface AdminUser {
  id: string
  email: string
  name: string
  role: UserRole
  verified: boolean
  created_at: string
  updated_at: string
}

// GET /api/admin/users - List all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getCurrentUser(supabase)
    if (!user || !hasRole(user, [UserRole.ADMIN])) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized" },
        { status: 403 }
      )
    }

    // Use Next.js provided URL for robustness in build/runtime contexts
    const { searchParams } = request.nextUrl
    const validation = paginationSchema.safeParse(Object.fromEntries(searchParams))
    
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, message: "Invalid query parameters" },
        { status: 400 }
      )
    }

    const { page, limit } = validation.data
    const roleFilter = searchParams.get('role')
    const verifiedFilter = searchParams.get('verified')
    const searchQuery = searchParams.get('search')

    let query = supabase
      .from('user_admin_view')
      .select('id, email, name, role, verified, created_at, updated_at', { count: 'exact' })

    // Apply filters
    if (roleFilter && Object.values(UserRole).includes(roleFilter as UserRole)) {
      query = query.eq('role', roleFilter)
    }

    if (verifiedFilter !== null) {
      query = query.eq('verified', verifiedFilter === 'true')
    }

    if (searchQuery) {
      query = query.or(`email.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    // Order by creation date (newest first)
    query = query.order('created_at', { ascending: false })

    const { data: users, error, count } = await query

    if (error) {
      console.error('Users fetch error:', error)
      return NextResponse.json(
        { ok: false, message: "Failed to fetch users" },
        { status: 500 }
      )
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      ok: true,
      data: users,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
      },
    } as PaginatedResponse<AdminUser>)
  } catch (error) {
    console.error('Admin users API error:', error)
    return NextResponse.json(
      { ok: false, message: "Something went wrong" },
      { status: 500 }
    )
  }
}

// Ensure Node.js runtime to avoid Edge runtime limitations with certain libraries
export const runtime = 'nodejs'
// Mark dynamic to avoid over-aggressive static analysis on params
export const dynamic = 'force-dynamic'

