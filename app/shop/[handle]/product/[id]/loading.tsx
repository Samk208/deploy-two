export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb Skeleton */}
        <div className="h-4 bg-gray-200 rounded w-64 mb-6 skeleton" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery Skeleton */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-200 rounded-2xl skeleton" />
            <div className="grid grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded-lg skeleton" />
              ))}
            </div>
          </div>

          {/* Product Info Skeleton */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4 skeleton" />
              <div className="flex gap-2">
                <div className="h-6 bg-gray-200 rounded w-16 skeleton" />
                <div className="h-6 bg-gray-200 rounded w-20 skeleton" />
              </div>
              <div className="h-4 bg-gray-200 rounded w-1/2 skeleton" />
              <div className="h-4 bg-gray-200 rounded w-1/3 skeleton" />
              <div className="h-10 bg-gray-200 rounded w-32 skeleton" />
            </div>
            <div className="h-32 bg-gray-200 rounded-2xl skeleton" />
          </div>
        </div>
      </div>
    </div>
  )
}
