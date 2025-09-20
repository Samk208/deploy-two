'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

const CheckoutPageComponent = dynamic(
  () => import('@/components/shop/checkout-page').then(mod => ({ default: mod.CheckoutPage })),
  {
    loading: () => <CheckoutSkeleton />,
    ssr: false
  }
)

function CheckoutSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <CheckoutPageComponent />
    </Suspense>
  )
}
