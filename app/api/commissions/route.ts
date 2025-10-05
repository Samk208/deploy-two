import { type NextRequest, NextResponse } from "next/server"
export const runtime = 'nodejs'

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { ensureTypedClient } from "@/lib/supabase/types"
import { getCurrentUser, hasRole } from "@/lib/auth-helpers"
import { UserRole, type ApiResponse } from "@/lib/types"
import { type Inserts } from "@/lib/supabase/server"
import * as z from "zod"

const createCommissionSchema = z.z.object({
  orderId: z.z.string().uuid(),
  influencerId: z.z.string().uuid(),
  supplierId: z.z.string().uuid(),
  productId: z.z.string().uuid(),
  amount: z.z.number().min(0),
  rate: z.z.number().min(0).max(95),
  status: z.z.enum(['pending', 'paid', 'disputed']).default('pending')
})

const updateCommissionSchema = z.z.object({
  status: z.z.enum(['pending', 'paid', 'disputed']).optional(),
  paidAt: z.z.string().datetime().optional(),
  disputeReason: z.z.string().optional()
})

export interface CommissionData {
  id: string
  orderId: string
  influencerId?: string
  supplierId: string
  productId: string
  amount: number
  rate: number
  status: 'pending' | 'paid' | 'disputed'
  createdAt: string
  paidAt?: string
  disputeReason?: string
  order?: {
    id: string
    total: number
    status: string
    customerName: string
  }
  product?: {
    title: string
    image: string
  }
  influencer?: {
    name: string
    email: string
  }
  supplier?: {
    name: string
    email: string
  }
}

// GET /api/commissions - List commissions with filters
export async function GET(request: NextRequest) {
  try {
    const supabase = ensureTypedClient(await createServerSupabaseClient())
    
    const user = await getCurrentUser(supabase)
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')
    const orderId = searchParams.get('orderId')
    // Support canonical page/pageSize but keep backward-compat with limit/offset
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const pageSize = Math.max(1, parseInt(searchParams.get('pageSize') || searchParams.get('limit') || '50'))
    const offsetParam = searchParams.get('offset')
    const offset = offsetParam !== null ? parseInt(offsetParam) : (page - 1) * pageSize
    const limit = pageSize

    // Build query based on user role
    let query = supabase
      .from('commissions')
      .select(`
        id,
        order_id,
        influencer_id,
        supplier_id,
        product_id,
        amount,
        rate,
        status,
        created_at,
        paid_at,
        orders (
          id,
          total,
          status,
          users!orders_customer_id_fkey (
            name
          )
        ),
        products (
          title,
          images
        ),
        users!commissions_influencer_id_fkey (
          name,
          email
        ),
        users!commissions_supplier_id_fkey (
          name,
          email
        )
      `)

    // Apply role-based filtering
    if (hasRole(user, [UserRole.ADMIN])) {
      // Admins can see all commissions
      if (userId) {
        query = query.or(`influencer_id.eq.${userId},supplier_id.eq.${userId}`)
      }
    } else if (hasRole(user, [UserRole.INFLUENCER])) {
      // Influencers can only see their own commissions
      query = query.eq('influencer_id', user.id)
    } else if (hasRole(user, [UserRole.SUPPLIER])) {
      // Suppliers can only see their own commissions
      query = query.eq('supplier_id', user.id)
    } else {
      return NextResponse.json(
        { ok: false, error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (orderId) {
      query = query.eq('order_id', orderId)
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: commissions, error } = await query

    if (error) {
      console.error('Commissions fetch error:', error)
      return NextResponse.json(
        { ok: false, error: "Failed to fetch commissions" },
        { status: 500 }
      )
    }

    // Format response data
    const formattedCommissions: CommissionData[] = commissions?.map((commission: any) => ({
      id: commission.id,
      orderId: commission.order_id,
      influencerId: commission.influencer_id,
      supplierId: commission.supplier_id,
      productId: commission.product_id,
      amount: commission.amount,
      rate: commission.rate,
      status: commission.status,
      createdAt: commission.created_at,
      paidAt: commission.paid_at,
      order: commission.orders ? {
        id: commission.orders.id,
        total: commission.orders.total,
        status: commission.orders.status,
        customerName: commission.orders.users?.name || 'Unknown Customer'
      } : undefined,
      product: commission.products ? {
        title: commission.products.title,
        image: commission.products.images?.[0] || '/placeholder-product.png'
      } : undefined,
      influencer: commission.users ? {
        name: commission.users.name,
        email: commission.users.email
      } : undefined,
      supplier: commission.users ? {
        name: commission.users.name,
        email: commission.users.email
      } : undefined
    })) || []

    // Get total count for pagination
    const { count } = await supabase
      .from('commissions')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      ok: true,
      items: formattedCommissions,
      total: count || 0,
      page,
      pageSize: limit,
    } as any)
  } catch (error) {
    console.error('Get commissions error:', error)
    return NextResponse.json(
      { ok: false, error: "Something went wrong" },
      { status: 500 }
    )
  }
}

// POST /api/commissions - Create commission transaction
export async function POST(request: NextRequest) {
  try {
    const supabase = ensureTypedClient(await createServerSupabaseClient())
    
    const user = await getCurrentUser(supabase)
    if (!user || !hasRole(user, [UserRole.ADMIN])) {
      return NextResponse.json(
        { ok: false, error: "Admin access required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = createCommissionSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          ok: false, 
          error: "Invalid commission data",
          fieldErrors: validation.error.flatten().fieldErrors 
        },
        { status: 400 }
      )
    }

    type CommissionInsert = Inserts<'commissions'>
    const insertData: CommissionInsert = {
      order_id: validation.data.orderId,
      influencer_id: validation.data.influencerId,
      supplier_id: validation.data.supplierId,
      product_id: validation.data.productId,
      amount: validation.data.amount,
      rate: validation.data.rate,
      status: validation.data.status,
      created_at: new Date().toISOString()
    }
    
    const { data: commission, error } = await supabase
      .from('commissions')
      .insert(insertData)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Commission creation error:', error)
      return NextResponse.json(
        { ok: false, error: "Failed to create commission" },
        { status: 500 }
      )
    }

    if (commission) {
      const auditPayload = {
        action: 'COMMISSION_CREATED',
        actor_id: user.id,
        resource_type: 'commission',
        resource_id: commission.id,
        metadata: {
          amount: commission.amount,
          influencer_id: commission.influencer_id,
          supplier_id: commission.supplier_id,
          product_id: commission.product_id,
          order_id: commission.order_id
        },
        created_at: new Date().toISOString()
      }
      const { error: auditError } = await supabase.from('audit_logs' as any).insert(auditPayload as any)
      if (auditError) {
        console.error('Audit log insert failed:', auditError)
      }
    }

    return NextResponse.json({
      ok: true,
      data: commission,
      message: "Commission created successfully"
    } as ApiResponse)
  } catch (error) {
    console.error('Create commission error:', error)
    return NextResponse.json(
      { ok: false, error: "Something went wrong" },
      { status: 500 }
    )
  }
}
