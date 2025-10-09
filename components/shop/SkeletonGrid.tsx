import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonGridProps {
  count?: number;
  variant?: "card" | "list";
  showActions?: boolean;
}

export default function SkeletonGrid({
  count = 9,
  variant = "card",
  showActions = true,
}: SkeletonGridProps) {
  if (variant === "list") {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex items-center justify-between pt-2">
                    <Skeleton className="h-6 w-20" />
                    {showActions && <Skeleton className="h-8 w-24" />}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="group overflow-hidden">
          <CardContent className="p-0">
            {/* Image skeleton */}
            <div className="aspect-[4/3] relative">
              <Skeleton className="w-full h-full" />
              {/* Badges skeleton */}
              <div className="absolute top-2 left-2 space-y-1">
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              {/* Action buttons skeleton */}
              {showActions && (
                <div className="absolute top-2 right-2 space-y-1">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              )}
            </div>

            {/* Content skeleton */}
            <div className="p-4 space-y-3">
              <div className="space-y-2">
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
              </div>

              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>

              <Skeleton className="h-4 w-full" />

              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>

              {/* Mobile button skeleton */}
              <div className="sm:hidden">
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Enhanced loading state for filter bar
export function FilterBarSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex-1 max-w-md">
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-10 w-40" />
            </div>
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-5 w-20" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Loading state for individual product cards with shimmer effect
export function ProductCardSkeleton({
  showActions = true,
}: {
  showActions?: boolean;
}) {
  return (
    <Card className="group overflow-hidden animate-pulse">
      <CardContent className="p-0">
        <div className="aspect-[4/3] relative bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer">
          {showActions && (
            <div className="absolute top-2 right-2 space-y-1">
              <div className="h-8 w-8 bg-white/80 rounded-full" />
              <div className="h-8 w-8 bg-white/80 rounded-full" />
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          <div className="space-y-2">
            <div
              className="h-5 bg-gray-200 rounded animate-pulse"
              style={{ width: "80%" }}
            />
            <div
              className="h-4 bg-gray-200 rounded animate-pulse"
              style={{ width: "60%" }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div
              className="h-4 bg-gray-200 rounded animate-pulse"
              style={{ width: "4rem" }}
            />
            <div
              className="h-4 bg-gray-200 rounded animate-pulse"
              style={{ width: "3rem" }}
            />
          </div>

          <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />

          <div className="flex items-center justify-between">
            <div
              className="h-6 bg-gray-200 rounded animate-pulse"
              style={{ width: "5rem" }}
            />
            <div
              className="h-4 bg-gray-200 rounded animate-pulse"
              style={{ width: "4rem" }}
            />
          </div>

          <div className="sm:hidden">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
