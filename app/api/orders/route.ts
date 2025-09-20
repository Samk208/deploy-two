import { type NextRequest, NextResponse } from "next/server"
export const runtime = 'nodejs'

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { paginationSchema } from "@/lib/validators"
import { getCurrentUser, hasRole } from "@/lib/auth-helpers"
import { UserRole, type PaginatedResponse, type Order } from "@/lib/types"

// GET /api/orders - List orders for current user or all orders for admins
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getCurrentUser(supabase)
    if (!user) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const validation = paginationSchema.safeParse(Object.fromEntries(searchParams))
    
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, message: "Invalid query parameters" },
        { status: 400 }
      )
    }

    const { page, limit } = validation.data

    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' })

    // Role-based filtering
    if (user.role === UserRole.CUSTOMER) {
      query = query.eq('customer_id', user.id)
    } else if (user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized" },
        { status: 403 }
      )
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    // Order by creation date (newest first)
    query = query.order('created_at', { ascending: false })

    const { data: orders, error, count } = await query

    if (error) {
      console.error('Orders fetch error:', error)
      return NextResponse.json(
        { ok: false, message: "Failed to fetch orders" },
        { status: 500 }
      )
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      ok: true,
      data: orders,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
      },
    } as PaginatedResponse<Order>)
  } catch (error) {
    console.error('Orders API error:', error)
    return NextResponse.json(
      { ok: false, message: "Something went wrong" },
      { status: 500 }
    )
  }
}
