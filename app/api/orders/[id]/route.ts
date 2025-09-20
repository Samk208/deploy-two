import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { ensureTypedClient } from "@/lib/supabase/types"
import { updateOrderStatusSchema, uuidSchema } from "@/lib/validators"
import { getCurrentUser, hasRole } from "@/lib/auth-helpers"
import { UserRole, type ApiResponse, type Order } from "@/lib/types"
import { QueryData } from '@supabase/supabase-js'
import { type Updates } from "@/lib/supabase/server"

// GET /api/orders/[id] - Get single order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = ensureTypedClient(await createServerSupabaseClient())
    const user = await getCurrentUser(supabase)
    if (!user) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    const validation = uuidSchema.safeParse(id)
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, message: "Invalid order ID" },
        { status: 400 }
      )
    }

    let query = supabase
      .from('orders')
      .select('*')
      .eq('id', id)

    // Role-based filtering
    if (user.role === UserRole.CUSTOMER) {
      query = query.eq('customer_id', user.id)
    } else if (user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized" },
        { status: 403 }
      )
    }

    const orderQuery = query.maybeSingle()
    type OrderRow = QueryData<typeof orderQuery>
    const { data: order, error } = await orderQuery

    if (error || !order) {
      return NextResponse.json(
        { ok: false, message: "Order not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ok: true,
      data: order,
    } as ApiResponse<Order>)
  } catch (error) {
    console.error('Order fetch error:', error)
    return NextResponse.json(
      { ok: false, message: "Something went wrong" },
      { status: 500 }
    )
  }
}

// PUT /api/orders/[id] - Update order status (admins only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = ensureTypedClient(await createServerSupabaseClient())
    const user = await getCurrentUser(supabase)
    if (!user || !hasRole(user, [UserRole.ADMIN])) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized" },
        { status: 403 }
      )
    }

    const validation = uuidSchema.safeParse(id)
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, message: "Invalid order ID" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const updateValidation = updateOrderStatusSchema.safeParse(body)
    
    if (!updateValidation.success) {
      const errors: Record<string, string> = {}
      updateValidation.error.errors.forEach((error) => {
        errors[error.path[0] as string] = error.message
      })
      
      return NextResponse.json(
        { ok: false, message: "Invalid order data", errors },
        { status: 400 }
      )
    }

    const { status, notes } = updateValidation.data

    type OrderUpdate = Updates<'orders'>
    const updateData: OrderUpdate = {
      status,
      updated_at: new Date().toISOString(),
    }
    
    const updateQuery = supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle()
    
    type UpdatedOrderRow = QueryData<typeof updateQuery>
    const { data: order, error } = await updateQuery

    if (error || !order) {
      console.error('Order update error:', error)
      return NextResponse.json(
        { ok: false, message: "Failed to update order" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      data: order,
      message: "Order updated successfully",
    } as ApiResponse<Order>)
  } catch (error) {
    console.error('Order update error:', error)
    return NextResponse.json(
      { ok: false, message: "Something went wrong" },
      { status: 500 }
    )
  }
}
