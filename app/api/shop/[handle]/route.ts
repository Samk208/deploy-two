import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { ensureTypedClient } from "@/lib/supabase/types"
import { type ApiResponse } from "@/lib/types"

export interface PublicShopData {
  influencer: {
    handle: string
    name: string
    bio?: string
    avatar?: string
    banner?: string
    followers?: string
    verified: boolean
    socialLinks?: {
      instagram?: string
      twitter?: string
      youtube?: string
    }
  }
  products: Array<{
    id: string
    title: string
    customTitle?: string
    customDescription?: string
    price: number
    originalPrice?: number
    image: string
    category: string
    region: string[]
    inStock: boolean
    stockCount: number
    rating?: number
    reviews?: number
    badges: string[]
  }>
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params
  try {
    const supabase = ensureTypedClient(await createServerSupabaseClient())

    // Resolve shop by handle to get influencer_id
    const { data: shop, error: shopLookupError } = await supabase
      .from('shops')
      .select('id, influencer_id, handle, name, description, logo')
      .eq('handle', handle)
      .maybeSingle()

    if (shopLookupError || !shop) {
      return NextResponse.json(
        { ok: false, error: "Influencer shop not found" },
        { status: 404 }
      )
    }

    // Fetch influencer basic public info from profiles table
    const { data: influencerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, avatar, verified')
      .eq('id', shop.influencer_id)
      .maybeSingle()

    if (profileError || !influencerProfile) {
      return NextResponse.json(
        { ok: false, error: "Influencer user not found" },
        { status: 404 }
      )
    }

    // Get influencer's published shop products (remove non-existent columns)
    const { data: shopProducts, error: shopError } = await supabase
      .from('influencer_shop_products')
      .select(`
        id,
        custom_title,
        sale_price,
        products (
          id,
          title,
          description,
          price,
          images,
          category,
          region,
          stock_count,
          in_stock
        )
      `)
      .eq('influencer_id', shop.influencer_id)
      .eq('published', true)
      .order('created_at', { ascending: true })

    if (shopError) {
      console.error('Shop products fetch error:', shopError)
      return NextResponse.json(
        { ok: false, error: "Failed to fetch shop products" },
        { status: 500 }
      )
    }

    // Format influencer data (limited to available fields)
    const formattedInfluencer = {
      handle: shop.handle,
      name: influencerProfile.name,
      // bio/banner/socialLinks not in current typed schema; keep undefined
      avatar: influencerProfile.avatar ?? undefined,
      verified: influencerProfile.verified ?? false,
      followers: '0',
    }

    // Format products (hide out-of-stock, show low-stock badges)
    const formattedProducts = shopProducts
      ?.filter((item: any) => item.products?.in_stock && item.products?.stock_count > 0)
      .map((item: any) => {
        const product = item.products
        const badges = []
        
        // Add stock-based badges
        if ((product?.stock_count ?? 0) <= 5) {
          badges.push('Low Stock')
        }
        if (
          typeof item.sale_price === 'number' &&
          typeof product?.price === 'number' &&
          item.sale_price < product.price
        ) {
          badges.push('Sale')
        }
        
        return {
          // Use the underlying product id for routing to /shop/[handle]/product/[id]
          id: product?.id,
          title: product?.title ?? 'Untitled',
          customTitle: item.custom_title,
          price: item.sale_price ?? product?.price ?? 0,
          originalPrice:
            typeof item.sale_price === 'number' &&
            typeof product?.price === 'number' &&
            item.sale_price < product.price
              ? product.price
              : undefined,
          image: Array.isArray(product?.images) && product.images.length > 0
            ? product.images[0]
            : '/placeholder-product.png',
          category: product?.category ?? 'Unknown',
          region: product?.region ?? [],
          inStock: !!product?.in_stock,
          stockCount: product?.stock_count ?? 0,
          rating: 4.5, // TODO: Calculate from reviews
          reviews: 0, // TODO: Calculate from reviews
          badges
        }
      }) || []

    return NextResponse.json({
      ok: true,
      data: {
        influencer: formattedInfluencer,
        products: formattedProducts
      }
    } as ApiResponse<PublicShopData>)
  } catch (error) {
    console.error('Public shop error:', error)
    return NextResponse.json(
      { ok: false, error: "Something went wrong" },
      { status: 500 }
    )
  }
}

