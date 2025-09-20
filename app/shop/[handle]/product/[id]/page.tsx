import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { ensureTypedClient } from "@/lib/supabase/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProductImage } from "@/components/ui/product-image"
import { Star, Heart, Share2, ShoppingCart, ArrowLeft } from "lucide-react"

interface ProductDetailPageProps {
  params: Promise<{
    handle: string
    id: string
  }>
}

interface ProductWithShop {
  id: string
  title: string
  description: string
  price: number
  images: string[]
  stock_count: number
  in_stock: boolean
  category: string
  commission?: number
  custom_title?: string
  sale_price?: number
  shop: {
    id: string
    handle: string
    name: string
    description?: string | null
    influencer: {
      name: string
      avatar?: string | null
    }
  }
}

// TypeScript interface for Supabase query result
interface InfluencerShopProductQuery {
  custom_title?: string | null
  sale_price?: number | null
  products?: {
    id: string
    title: string
    description?: string | null
    price: number
    images?: string[] | null
    stock_count?: number | null
    in_stock?: boolean | null
    category?: string | null
    commission?: number | null
  } | null
  shops?: {
    id: string
    handle: string
    name: string
    description?: string | null
    influencer: {
      name: string
      avatar?: string | null
    }
  } | null
}

function ProductImageGallery({ images, productTitle }: { images: string[]; productTitle: string }) {
  const mainImage = images?.[0] || "/placeholder-product.jpg"
  return (
    <div className="space-y-4">
      <div className="aspect-square w-full overflow-hidden rounded-lg">
        <ProductImage
          src={mainImage}
          alt={productTitle}
          fill
          priority
          className="object-cover object-center"
          containerClassName="aspect-square"
          fallbackSrc="/placeholder-product.jpg"
        />
      </div>
      {Array.isArray(images) && images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.slice(0, 4).map((image, index) => (
            <div key={index} className="aspect-square overflow-hidden rounded-md">
              <ProductImage
                src={image}
                alt={`${productTitle} view ${index + 1}`}
                fill
                className="cursor-pointer object-cover object-center transition-opacity hover:opacity-75"
                containerClassName="aspect-square"
                fallbackSrc="/placeholder-product.jpg"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ProductInfo({ product }: { product: ProductWithShop }) {
  const effectivePrice = typeof product.sale_price === "number" ? product.sale_price : product.price
  const hasDiscount = typeof product.sale_price === "number" && product.sale_price < product.price
  const displayTitle = product.custom_title || product.title

  return (
    <div className="space-y-6">
      <nav className="flex items-center space-x-2 text-sm text-gray-500">
        <Link href={`/shop/${product.shop.handle}`} className="flex items-center hover:text-gray-900">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to {product.shop.name}
        </Link>
      </nav>

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{displayTitle}</h1>
        <div className="mt-3 flex items-center space-x-2">
          <span className="text-sm text-gray-500">by</span>
          <div className="flex items-center space-x-2">
            {product.shop.influencer.avatar && (
              <ProductImage
                src={product.shop.influencer.avatar}
                alt={product.shop.influencer.name}
                width={24}
                height={24}
                className="rounded-full"
                showLoadingState={false}
                fallbackSrc="/placeholder-user.jpg"
              />
            )}
            <span className="font-medium text-gray-900">{product.shop.influencer.name}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <span className="text-sm text-gray-500">(4.8) • 124 reviews</span>
      </div>

      <div className="flex items-center space-x-3">
        <span className="text-3xl font-bold text-gray-900">${effectivePrice.toFixed(2)}</span>
        {hasDiscount && (
          <>
            <span className="text-lg text-gray-500 line-through">${product.price.toFixed(2)}</span>
            <Badge variant="destructive">Save ${(product.price - effectivePrice).toFixed(2)}</Badge>
          </>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {product.in_stock ? (
          <>
            <div className="h-2 w-2 rounded-full bg-green-400"></div>
            <span className="text-sm text-green-600">In stock ({product.stock_count} available)</span>
          </>
        ) : (
          <>
            <div className="h-2 w-2 rounded-full bg-red-400"></div>
            <span className="text-sm text-red-600">Out of stock</span>
          </>
        )}
      </div>

      <div className="prose max-w-none text-gray-600">
        <p>{product.description}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{product.category}</Badge>
        {hasDiscount && <Badge variant="outline">Influencer Special</Badge>}
      </div>

      <div className="space-y-4">
        <div className="flex space-x-3">
          <Button size="lg" className="flex-1" disabled={!product.in_stock}>
            <ShoppingCart className="mr-2 h-5 w-5" />
            {product.in_stock ? "Add to Cart" : "Out of Stock"}
          </Button>
          <Button size="lg" variant="outline">
            <Heart className="h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline">
            <Share2 className="h-5 w-5" />
          </Button>
        </div>

        {hasDiscount && (
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              <strong>Influencer Exclusive:</strong> Special pricing available only through {product.shop.influencer.name}'s shop!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function ProductDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="aspect-square w-full animate-pulse rounded-lg bg-gray-200"></div>
          <div className="grid grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-md bg-gray-200"></div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="h-8 w-3/4 animate-pulse rounded bg-gray-200"></div>
          <div className="h-6 w-1/2 animate-pulse rounded bg-gray-200"></div>
          <div className="h-6 w-1/4 animate-pulse rounded bg-gray-200"></div>
          <div className="space-y-2">
            <div className="h-4 animate-pulse rounded bg-gray-200"></div>
            <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { handle, id } = await params
  const supabase = ensureTypedClient(await createServerSupabaseClient())

  // Resolve shop for influencer_id
  const { data: shop } = await supabase
    .from('shops')
    .select('id, influencer_id, handle, name, description')
    .eq('handle', handle)
    .maybeSingle()

  if (!shop) {
    return { title: 'Product | One-Link' }
  }

  // Fetch product linkage and product with proper typing
  const { data: link } = await supabase
    .from('influencer_shop_products')
    .select(`
      custom_title,
      sale_price,
      products (
        id,
        title,
        description,
        price,
        images
      )
    `)
    .eq('influencer_id', shop.influencer_id)
    .eq('product_id', id)
    .maybeSingle() as { data: InfluencerShopProductQuery | null }

  // Type-safe property access with null checks
  const productInfo = link?.products
  const productTitle = link?.custom_title || productInfo?.title || 'Product'
  const description = productInfo?.description || ''
  const images = productInfo?.images
  const image = Array.isArray(images) && images.length > 0
    ? images[0]
    : '/placeholder-product.png'

  return {
    title: `${productTitle} | @${handle} Shop | One-Link`,
    description,
    openGraph: {
      title: productTitle,
      description,
      images: [
        { url: image, width: 800, height: 800, alt: productTitle }
      ],
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title: productTitle,
      description,
      images: [image]
    },
    alternates: { canonical: `/shop/${handle}/product/${id}` }
  }
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { handle, id } = await params
  const supabase = ensureTypedClient(await createServerSupabaseClient())

  // 1) Resolve shop by handle
  const { data: shop, error: shopLookupError } = await supabase
    .from('shops')
    .select('id, influencer_id, handle, name, description')
    .eq('handle', handle)
    .maybeSingle()

  if (shopLookupError || !shop) {
    notFound()
  }

  // 2) Fetch influencer profile
  const { data: influencerProfile } = await supabase
    .from('profiles')
    .select('id, name, avatar')
    .eq('id', shop.influencer_id)
    .maybeSingle()

  // 3) Fetch product link for this influencer and product id with proper typing
  const { data: link, error: linkError } = await supabase
    .from('influencer_shop_products')
    .select(`
      custom_title,
      sale_price,
      products (
        id,
        title,
        description,
        price,
        images,
        stock_count,
        in_stock,
        category,
        commission
      )
    `)
    .eq('influencer_id', shop.influencer_id)
    .eq('product_id', id)
    .maybeSingle() as { data: InfluencerShopProductQuery | null, error: any }

  if (linkError || !link || !link.products) {
    notFound()
  }

  // Type-safe access to nested product data
  const productInfo = link.products

  const product: ProductWithShop = {
    id: productInfo.id,
    title: productInfo.title,
    description: productInfo.description ?? '',
    price: Number(productInfo.price ?? 0),
    images: Array.isArray(productInfo.images) ? productInfo.images : [],
    stock_count: productInfo.stock_count ?? 0,
    in_stock: !!productInfo.in_stock,
    category: productInfo.category ?? 'general',
    commission: typeof productInfo.commission === 'number' ? productInfo.commission : undefined,
    custom_title: link.custom_title ?? undefined,
    sale_price: typeof link.sale_price === 'number' ? link.sale_price : undefined,
    shop: {
      id: shop.id,
      handle: shop.handle,
      name: shop.name,
      description: shop.description,
      influencer: {
        name: influencerProfile?.name ?? 'Influencer',
        avatar: influencerProfile?.avatar ?? undefined,
      },
    },
  }

  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <ProductImageGallery images={product.images} productTitle={product.custom_title || product.title} />
          <ProductInfo product={product} />
        </div>
      </div>
    </Suspense>
  )
}
