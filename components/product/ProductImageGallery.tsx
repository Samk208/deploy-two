"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface ProductImageGalleryProps {
  images: string[];
  title: string;
  primaryImage?: string | null;
}

export default function ProductImageGallery({
  images,
  title,
  primaryImage,
}: ProductImageGalleryProps) {
  // Use images array, fallback to primary_image, then fallback image
  const allImages =
    images && images.length > 0
      ? images
      : primaryImage
        ? [primaryImage]
        : ["/placeholder.jpg"];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="space-y-4">
      {/* Main Image Display */}
      <div className="relative aspect-square w-full group">
        <Image
          src={allImages[currentIndex]}
          alt={`${title} - Image ${currentIndex + 1}`}
          fill
          className="rounded-2xl object-cover transition-opacity duration-300"
          // Eager-load the first image to avoid initial blink
          loading={currentIndex === 0 ? "eager" : "lazy"}
          // Avoid optimization flicker on Supabase-hosted assets
          unoptimized
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority={currentIndex === 0}
          onLoad={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
        />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-neutral-200 rounded-2xl animate-pulse" />
        )}

        {/* Navigation Arrows - Only show if more than 1 image */}
        {allImages.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={goToPrevious}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="secondary"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={goToNext}
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Image Counter */}
        {allImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} of {allImages.length}
          </div>
        )}
      </div>

      {/* Thumbnail Navigation - Only show if more than 1 image */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {allImages.map((image, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                index === currentIndex
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-neutral-200 hover:border-neutral-300"
              }`}
              aria-label={`View image ${index + 1}`}
            >
              <Image
                src={image}
                alt={`${title} thumbnail ${index + 1}`}
                fill
                className="object-cover"
                unoptimized
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Image Info */}
      <div className="text-sm text-muted-foreground">
        {allImages.length === 1
          ? "1 image"
          : `${allImages.length} images • Use arrows or thumbnails to navigate`}
      </div>
    </div>
  );
}
