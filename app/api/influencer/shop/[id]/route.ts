import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { ensureTypedClient } from "@/lib/supabase/types"
import { getCurrentUser, hasRole } from "@/lib/auth-helpers"
import { UserRole, type ApiResponse } from "@/lib/types"
import { z } from "zod"

const updateShopProductSchema = z.object({
  customTitle: z.string().optional(),
  customDescription: z.string().optional(),
  salePrice: z.number().min(0).optional(),
  published: z.boolean().optional(),
  displayOrder: z.number().min(0).optional()
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = ensureTypedClient(await createServerSupabaseClient())
    
    const user = await getCurrentUser(supabase)
    if (!user || !hasRole(user, [UserRole.INFLUENCER])) {
      return NextResponse.json(
        { ok: false, error: "Influencer access required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = updateShopProductSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          ok: false, 
          error: "Invalid data",
          fieldErrors: validation.error.flatten().fieldErrors 
        },
        { status: 400 }
      )
    }

    // Treat params.id as productId within the influencer's shop context
    const productId = id

    // Fetch current shop products
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('products')
      .eq('influencer_id', user.id)
      .maybeSingle()

    if (shopError) {
      console.error('Shop fetch error:', shopError)
      return NextResponse.json(
        { ok: false, error: "Failed to fetch shop" },
        { status: 500 }
      )
    }

    if (!shop?.products || !Array.isArray(shop.products)) {
      return NextResponse.json(
        { ok: false, error: "Shop has no products to update" },
        { status: 404 }
      )
    }

    let newProducts: any[] = [...shop.products]
    if (typeof newProducts[0] === 'string') {
      // No per-product overrides available; nothing to update
      return NextResponse.json({
        ok: true,
        data: null,
        message: "No-op: shop stores products as string[]; no overrides to update"
      })
    } else {
      // JSON objects array
      newProducts = newProducts.map((p: any) =>
        p.product_id === productId
          ? {
              ...p,
              ...(validation.data.customTitle !== undefined && { custom_title: validation.data.customTitle }),
              ...(validation.data.salePrice !== undefined && { sale_price: validation.data.salePrice }),
              ...(validation.data.published !== undefined && { published: validation.data.published }),
            }
          : p
      )
    }

    const { error: updateError } = await supabase
      .from('shops')
      .update({ products: newProducts, updated_at: new Date().toISOString() })
      .eq('influencer_id', user.id)

    if (updateError) {
      console.error('Shop products update error:', updateError)
      return NextResponse.json(
        { ok: false, error: "Failed to update shop product" },
        { status: 500 }
      )
    }

    console.log(`🛍️ [AUDIT] Influencer ${user.id} updated shop product ${productId}`)

    return NextResponse.json({
      ok: true,
      data: { product_id: productId },
      message: "Shop product updated successfully"
    })
  } catch (error) {
    console.error('Update shop product error:', error)
    return NextResponse.json(
      { ok: false, error: "Something went wrong" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = ensureTypedClient(await createServerSupabaseClient())
    
    const user = await getCurrentUser(supabase)
    if (!user || !hasRole(user, [UserRole.INFLUENCER])) {
      return NextResponse.json(
        { ok: false, error: "Influencer access required" },
        { status: 403 }
      )
    }

    const productId = id

    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('products')
      .eq('influencer_id', user.id)
      .maybeSingle()

    if (shopError) {
      console.error('Shop fetch error:', shopError)
      return NextResponse.json(
        { ok: false, error: "Failed to fetch shop" },
        { status: 500 }
      )
    }

    if (!shop?.products || !Array.isArray(shop.products)) {
      return NextResponse.json(
        { ok: false, error: "Shop has no products" },
        { status: 404 }
      )
    }

    let newProducts: any[]
    if (typeof shop.products[0] === 'string') {
      const ids = shop.products as string[]
      newProducts = ids.filter(p => p !== productId)
    } else {
      const arr = shop.products as Array<any>
      newProducts = arr.filter(p => p.product_id !== productId)
    }

    const { error: updateError } = await supabase
      .from('shops')
      .update({ products: newProducts, updated_at: new Date().toISOString() })
      .eq('influencer_id', user.id)

    if (updateError) {
      console.error('Shop product delete error:', updateError)
      return NextResponse.json(
        { ok: false, error: "Failed to delete shop product" },
        { status: 500 }
      )
    }

    console.log(`🛍️ [AUDIT] Influencer ${user.id} removed product from shop ${productId}`)

    return NextResponse.json({
      ok: true,
      message: "Product removed from shop successfully"
    })
  } catch (error) {
    console.error('Delete shop product error:', error)
    return NextResponse.json(
      { ok: false, error: "Something went wrong" },
      { status: 500 }
    )
  }
}
