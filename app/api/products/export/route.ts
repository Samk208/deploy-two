import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getCurrentUser, hasRole } from "@/lib/auth-helpers"
import { UserRole, type ApiResponse } from "@/lib/types"
import { stringify } from "csv-stringify/sync"
import { z } from "zod"

// Simple validation schema for export parameters
const productQuerySchema = z.object({
  category: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get current user and check permissions
    const user = await getCurrentUser(supabase)
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    if (!hasRole(user, [UserRole.SUPPLIER, UserRole.ADMIN])) {
      return NextResponse.json(
        { ok: false, error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const queryData = {
      category: searchParams.get('category') || undefined,
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
    }

    const validation = productQuerySchema.safeParse(queryData)
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid query parameters" },
        { status: 400 }
      )
    }

    const { category, status, search } = validation.data

    // Build query
    let query = supabase
      .from('products')
      .select('*')

    // Apply filters
    if (category) {
      query = query.eq('category', category)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // For suppliers, only show their own products
    if (user.role === UserRole.SUPPLIER) {
      query = query.eq('supplier_id', user.id)
    }

    const { data: products, error } = await query

    if (error) {
      console.error('Products export error:', error)
      return NextResponse.json(
        { ok: false, error: "Failed to fetch products" },
        { status: 500 }
      )
    }

    // Convert to CSV
    const csvData = stringify(products || [], {
      header: true,
      columns: [
        'id',
        'title',
        'description',
        'price',
        'category',
        'stock',
        'status',
        'created_at',
        'updated_at'
      ]
    })

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="products-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { ok: false, error: "Something went wrong" },
      { status: 500 }
    )
  }
}
