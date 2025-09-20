import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { ensureTypedClient } from "@/lib/supabase/types"
import { updateProductSchema, uuidSchema } from "@/lib/validators"
import { getCurrentUser, hasRole } from "@/lib/auth-helpers"
import { UserRole, type ApiResponse, type Product } from "@/lib/types"
import { QueryData } from '@supabase/supabase-js'
import { type Updates } from "@/lib/supabase/server"

// GET /api/products/[id] - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: productId } = await params

    const validation = uuidSchema.safeParse(productId)
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid product ID" },
        { status: 400 }
      )
    }

    const supabase = ensureTypedClient(await createServerSupabaseClient())
    const query = supabase
      .from('products')
      .select(`
        *,
        users!products_supplier_id_fkey (
          id,
          name,
          email
        )
      `)
      .eq('id', productId)
      .maybeSingle()
    
    type ProductRow = QueryData<typeof query>
    const { data: product, error } = await query

    if (error || !product) {
      return NextResponse.json(
        { ok: false, error: "Product not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ok: true,
      data: product,
    } as ApiResponse<Product>)
  } catch (error) {
    console.error('Product fetch error:', error)
    return NextResponse.json(
      { ok: false, error: "Something went wrong" },
      { status: 500 }
    )
  }
}

// PUT /api/products/[id] - Update product (suppliers only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: productId } = await params

    const supabase = ensureTypedClient(await createServerSupabaseClient())
    
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

    const validation = uuidSchema.safeParse(productId)
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid product ID" },
        { status: 400 }
      )
    }

    // Check if product exists and user has permission
    const existingQuery = supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .maybeSingle()
    
    type ExistingProductRow = QueryData<typeof existingQuery>
    const { data: existingProduct, error: fetchError } = await existingQuery

    if (fetchError || !existingProduct) {
      return NextResponse.json(
        { ok: false, error: "Product not found" },
        { status: 404 }
      )
    }

    // Check ownership (suppliers can only edit their own products)
    if (user.role === UserRole.SUPPLIER && existingProduct.supplier_id !== user.id) {
      return NextResponse.json(
        { ok: false, error: "You can only edit your own products" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const updateValidation = updateProductSchema.safeParse(body)
    
    if (!updateValidation.success) {
      return NextResponse.json(
        { 
          ok: false, 
          error: "Invalid product data",
          fieldErrors: updateValidation.error.flatten().fieldErrors 
        },
        { status: 400 }
      )
    }

    const validatedUpdate = updateValidation.data

    // Check for duplicate SKU if SKU is being updated
    if (validatedUpdate.sku && validatedUpdate.sku !== existingProduct.sku) {
      const duplicateQuery = supabase
        .from('products')
        .select('id')
        .eq('supplier_id', existingProduct.supplier_id)
        .eq('sku', validatedUpdate.sku)
        .neq('id', productId)
        .maybeSingle()
      
      type DuplicateProductRow = QueryData<typeof duplicateQuery>
      const { data: duplicateProduct } = await duplicateQuery

      if (duplicateProduct) {
        return NextResponse.json(
          { 
            ok: false, 
            error: "Product with this SKU already exists",
            fieldErrors: { sku: ["SKU must be unique per supplier"] }
          },
          { status: 409 }
        )
      }
    }

    // Calculate final price if commission is updated
    const finalUpdateData: any = {
      ...validatedUpdate,
      updated_at: new Date().toISOString(),
    }

    // Map validation schema fields to database fields
    if (validatedUpdate.stockCount !== undefined) {
      finalUpdateData.stock_count = validatedUpdate.stockCount
      finalUpdateData.in_stock = validatedUpdate.stockCount > 0
    }
    
    if (validatedUpdate.region !== undefined) {
      finalUpdateData.region = validatedUpdate.region
    }
    
    if (validatedUpdate.images !== undefined) {
      finalUpdateData.images = validatedUpdate.images
    }
    
    if (validatedUpdate.originalPrice !== undefined) {
      finalUpdateData.original_price = validatedUpdate.originalPrice
    }
    
    if (validatedUpdate.sku !== undefined) {
      finalUpdateData.sku = validatedUpdate.sku
    }

    type ProductUpdate = Updates<'products'>
    const productUpdate: ProductUpdate = finalUpdateData
    
    const updateQuery = supabase
      .from('products')
      .update(productUpdate)
      .eq('id', productId)
      .select(`
        *,
        users!products_supplier_id_fkey (
          id,
          name,
          email
        )
      `)
      .maybeSingle()
    
    type UpdatedProductRow = QueryData<typeof updateQuery>
    const { data: product, error } = await updateQuery

    if (error || !product) {
      console.error('Product update error:', error)
      return NextResponse.json(
        { ok: false, error: "Failed to update product" },
        { status: 500 }
      )
    }

    console.log(`📦 [AUDIT] User ${user.id} updated product ${productId}`)

    return NextResponse.json({
      ok: true,
      data: product,
      message: "Product updated successfully",
    } as ApiResponse<Product>)
  } catch (error) {
    console.error('Product update error:', error)
    return NextResponse.json(
      { ok: false, error: "Something went wrong" },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id] - Delete product (suppliers only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: productId } = await params

    const supabase = ensureTypedClient(await createServerSupabaseClient())
    
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

    const validation = uuidSchema.safeParse(productId)
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid product ID" },
        { status: 400 }
      )
    }

    // Check if product exists and user has permission
    const deleteQuery = supabase
      .from('products')
      .select('supplier_id')
      .eq('id', productId)
      .maybeSingle()
    
    type DeleteProductRow = QueryData<typeof deleteQuery>
    const { data: existingProduct, error: fetchError } = await deleteQuery

    if (fetchError || !existingProduct) {
      return NextResponse.json(
        { ok: false, error: "Product not found" },
        { status: 404 }
      )
    }

    // Check ownership (suppliers can only delete their own products)
    if (user.role === UserRole.SUPPLIER && existingProduct.supplier_id !== user.id) {
      return NextResponse.json(
        { ok: false, error: "You can only delete your own products" },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) {
      console.error('Product deletion error:', error)
      return NextResponse.json(
        { ok: false, error: "Failed to delete product" },
        { status: 500 }
      )
    }

    console.log(`🗑️ [AUDIT] User ${user.id} deleted product ${productId}`)

    return NextResponse.json({
      ok: true,
      message: "Product deleted successfully",
    } as ApiResponse)
  } catch (error) {
    console.error('Product deletion error:', error)
    return NextResponse.json(
      { ok: false, error: "Something went wrong" },
      { status: 500 }
    )
  }
}
