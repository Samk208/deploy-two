import { Suspense } from "react"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { InfluencerShopClient } from "./InfluencerShopClient"
import { Skeleton } from "@/components/ui/skeleton"

interface PageProps {
  params: Promise<{ handle: string }>
}

// Fetch influencer shop data from our API route
async function fetchShopData(handle: string) {
  // Build an absolute endpoint for server-side fetch
  // Priority: explicit service URL env -> derive from incoming request headers -> fallback localhost
  let base = process.env.SHOP_SERVICE_URL || process.env.BASE_URL || ""

  if (!base) {
    const h = await headers()
    const host = h.get("x-forwarded-host") || h.get("host")
    const proto = h.get("x-forwarded-proto") || (process.env.NODE_ENV === "production" ? "https" : "http")
    if (host) base = `${proto}://${host}`
  }

  if (!base) {
    // Last-resort fallback for local dev so server fetch never uses a relative URL
    const port = process.env.PORT || "3000"
    base = `http://localhost:${port}`
  }

  const endpoint = new URL(`/api/shop/${handle}`, base).toString()

  let res: Response
  try {
    res = await fetch(endpoint, {
      cache: 'no-store',
    })
  } catch (err) {
    // Surface server-side fetch failures clearly during SSR
    console.error(`Failed to fetch shop data for handle="${handle}" from ${endpoint}:`, err)
    throw err
  }

  if (!res.ok) return null
  const json = await res.json()
  if (!json?.ok || !json?.data) return null

  // Map API response to the client component props
  const influencer = {
    handle: json.data.influencer.handle,
    name: json.data.influencer.name,
    bio: json.data.influencer.bio ?? '',
    avatar: json.data.influencer.avatar ?? '/brand-manager-avatar.png',
    banner: json.data.influencer.banner ?? '/fashion-banner.png',
    followers: json.data.influencer.followers ?? '0',
    verified: !!json.data.influencer.verified,
    socialLinks: json.data.influencer.socialLinks ?? {},
  }

  // API product shape returned by /api/shop/[handle]
  interface ApiProduct {
    id: string | number
    customTitle?: string
    title?: string
    price?: number
    originalPrice?: number
    image?: string
    badges?: unknown[]
    category?: string
    region?: string | string[]
    inStock?: boolean
    stockCount?: number
    rating?: number
    reviews?: number
  }

  const products = (json.data.products ?? []).map((p: ApiProduct) => ({
    id: String(p.id),
    title: p.customTitle || p.title || 'Untitled',
    price: Number(p.price ?? 0),
    originalPrice: typeof p.originalPrice === 'number' ? p.originalPrice : undefined,
    image: p.image || '/placeholder-product.png',
    badges: Array.isArray(p.badges) ? p.badges : [],
    category: p.category || 'General',
    region: Array.isArray(p.region) ? (p.region[0] || 'Global') : (p.region || 'Global'),
    inStock: !!p.inStock,
    stockCount: Number(p.stockCount ?? 0),
    rating: Number(p.rating ?? 4.5),
    reviews: Number(p.reviews ?? 0),
  }))

  return { influencer, products }
}

function InfluencerShopSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="relative">
        <Skeleton className="h-64 w-full" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="container mx-auto">
            <div className="flex items-end gap-4">
              <Skeleton className="w-24 h-24 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default async function InfluencerShopPage({ params }: PageProps) {
  const { handle } = await params
  
  const data = await fetchShopData(handle)
  if (!data) return notFound()

  return (
    <Suspense fallback={<InfluencerShopSkeleton />}>
      <InfluencerShopClient
        influencer={data.influencer}
        products={data.products}
        handle={handle}
      />
    </Suspense>
  )
}
