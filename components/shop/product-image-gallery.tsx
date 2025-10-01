"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { normalizeAll } from "@/lib/images/normalizeUnsplash";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  layout?: "grid" | "list" | "detail";
  className?: string;
}

export function ProductImageGallery({
  images,
  productName,
  layout = "grid",
  className,
}: ProductImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Normalize Unsplash params and ensure non-empty list (memoized)
  const normalized = useMemo(
    () => normalizeAll(Array.isArray(images) ? images : []),
    [images]
  );
  const safeImages = normalized.length > 0 ? normalized : ["/placeholder.jpg"];
  const currentImage = failed[currentIndex]
    ? "/placeholder.jpg"
    : safeImages[currentIndex] || "/placeholder.jpg";

  // When the image list changes, clamp index and reset failure map
  useEffect(() => {
    if (currentIndex >= safeImages.length) {
      setCurrentIndex(0);
    }
    // Reset failed states when images set changes to avoid stale flags
    setFailed({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeImages.length]);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % safeImages.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length);
  };

  // Card views: optimized for mobile and desktop
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (safeImages.length <= 1) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prevImage();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      nextImage();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (safeImages.length <= 1) return;
    setTouchStartX(e.touches[0]?.clientX ?? null);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (safeImages.length <= 1) return;
    if (touchStartX == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchStartX) - touchStartX;
    const threshold = 30; // px
    if (Math.abs(dx) >= threshold) {
      dx > 0 ? prevImage() : nextImage();
    }
    setTouchStartX(null);
  };

  if (layout === "grid" || layout === "list") {
    return (
      <div
        className={cn("relative group", className)}
        data-testid="image-container"
        role="group"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-label={`${productName} gallery`}
      >
        <div
          className={cn(
            "relative overflow-hidden bg-gray-100 w-full shrink-0 rounded-t-lg",
            layout === "grid" ? "aspect-[4/3]" : "aspect-[3/2] h-32 sm:h-40 lg:h-48"
          )}
        >
          <Image
            data-testid="product-image"
            src={currentImage}
            alt={`${productName} - Image ${currentIndex + 1}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNlZWUiIC8+PC9zdmc+"
            sizes={
              layout === "grid"
                ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                : "(max-width: 640px) 100vw, 50vw"
            }
            priority={false}
            onError={() =>
              setFailed((f) => (f[currentIndex] ? f : { ...f, [currentIndex]: true }))
            }
          />

          {safeImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className={cn(
                  "absolute left-2 top-1/2 -translate-y-1/2",
                  "bg-black/50 hover:bg-black/70 text-white rounded-full",
                  "p-2 sm:p-2 min-w-[44px] min-h-[44px] flex items-center justify-center z-20",
                  "opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity",
                  "touch-manipulation"
                )}
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5 sm:h-4 sm:w-4" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2",
                  "bg-black/50 hover:bg-black/70 text-white rounded-full",
                  "p-2 sm:p-2 min-w-[44px] min-h-[44px] flex items-center justify-center z-20",
                  "opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity",
                  "touch-manipulation"
                )}
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5 sm:h-4 sm:w-4" />
              </button>
            </>
          )}

          {safeImages.length > 1 && (
            <div className="absolute bottom-3 sm:bottom-2 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-1.5 z-20">
              {safeImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  className={cn(
                    "rounded-full transition-all touch-manipulation",
                    "w-2 h-2 sm:w-1.5 sm:h-1.5",
                    idx === currentIndex ? "bg-white w-6 sm:w-4" : "bg-white/60 active:bg-white/80"
                  )}
                  aria-label={`Go to image ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Detail view: gallery with thumbnails (mobile optimized)
  return (
    <div className={cn("space-y-3 sm:space-y-4", className)}>
      <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
        <Image
          src={currentImage}
          alt={`${productName} - Image ${currentIndex + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 70vw, 50vw"
          priority
          onError={() => setFailed((f) => ({ ...f, [currentIndex]: true }))}
        />
        {safeImages.length > 1 && (
          <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded">
            {currentIndex + 1} / {safeImages.length}
          </div>
        )}
      </div>

      {safeImages.length > 1 && (
        <div
          className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0"
          tabIndex={0}
          aria-label="Product thumbnails"
        >
          <div className="flex sm:grid sm:grid-cols-4 gap-2 min-w-min">
            {safeImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "relative flex-shrink-0 w-20 h-20 sm:w-auto sm:h-auto sm:aspect-square",
                  "overflow-hidden rounded-md border-2 transition-all",
                  "touch-manipulation",
                  idx === currentIndex
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-transparent active:border-gray-300"
                )}
              >
                <Image
                  src={failed[idx] ? "/placeholder.jpg" : img}
                  alt={`${productName} thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                  loading="lazy"
                  decoding="async"
                  sizes="80px"
                  placeholder="blur"
                  blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNlZWUiIC8+PC9zdmc+"
                  onError={() =>
                    setFailed((f) => (f[idx] ? f : { ...f, [idx]: true }))
                  }
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
