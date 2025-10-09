"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface ProductImageCarouselProps {
  images: string[] | null | undefined;
  title: string;
  className?: string;
  priority?: boolean;
}

export function ProductImageCarousel({
  images,
  title,
  className,
  priority = false,
}: ProductImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [isHovered, setIsHovered] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Prepare images array with fallback
  const imageList =
    Array.isArray(images) && images.length > 0
      ? images.filter((img) => typeof img === "string" && img.trim() !== "")
      : ["/images/fallback.jpg"];

  const hasMultipleImages = imageList.length > 1;
  const currentImage = imageList[currentIndex] || "/images/fallback.jpg";

  // Reset current index if images change
  useEffect(() => {
    setCurrentIndex(0);
    setImageErrors(new Set());
  }, [images]);

  // Auto-scroll functionality (pauses on hover)
  useEffect(() => {
    if (!hasMultipleImages || isHovered) return;

    const interval = setInterval(() => {
      handleNext();
    }, 4000); // Auto-advance every 4 seconds

    return () => clearInterval(interval);
  }, [currentIndex, hasMultipleImages, isHovered]);

  const handlePrevious = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev === 0 ? imageList.length - 1 : prev - 1));
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev === imageList.length - 1 ? 0 : prev + 1));
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleImageError = (index: number) => {
    setImageErrors((prev) => new Set(prev).add(index));
  };

  const handleDotClick = (index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  return (
    <div
      className={cn("relative group", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Image Container */}
      <div className="aspect-[4/3] relative overflow-hidden bg-gray-100 rounded-xl">
        <Image
          src={
            imageErrors.has(currentIndex)
              ? "/images/fallback.jpg"
              : currentImage
          }
          alt={`${title} - Image ${currentIndex + 1}`}
          fill
          className={cn(
            "object-cover transition-all duration-300",
            isTransitioning && "scale-105"
          )}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={priority}
          onError={() => handleImageError(currentIndex)}
        />

        {/* Navigation Arrows - Only show if multiple images */}
        {hasMultipleImages && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0",
                "bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm",
                "transition-all duration-200 z-10",
                isHovered
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-2"
              )}
              onClick={handlePrevious}
              disabled={isTransitioning}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0",
                "bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm",
                "transition-all duration-200 z-10",
                isHovered
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-2"
              )}
              onClick={handleNext}
              disabled={isTransitioning}
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Image Counter Badge */}
        {hasMultipleImages && (
          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
            {currentIndex + 1} / {imageList.length}
          </div>
        )}

        {/* Touch/Swipe indicators for mobile */}
        {hasMultipleImages && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {imageList.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  index === currentIndex
                    ? "bg-white scale-125"
                    : "bg-white/50 hover:bg-white/70"
                )}
                onClick={() => handleDotClick(index)}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail Strip - Only show on hover for multiple images */}
      {hasMultipleImages && imageList.length <= 5 && (
        <div
          className={cn(
            "absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1 transition-all duration-300",
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          )}
        >
          {imageList.map((image, index) => (
            <button
              key={index}
              className={cn(
                "w-12 h-12 rounded-md overflow-hidden border-2 transition-all duration-200",
                index === currentIndex
                  ? "border-indigo-500 scale-110"
                  : "border-white/50 hover:border-white"
              )}
              onClick={() => handleDotClick(index)}
              disabled={isTransitioning}
            >
              <Image
                src={imageErrors.has(index) ? "/images/fallback.jpg" : image}
                alt={`${title} thumbnail ${index + 1}`}
                width={48}
                height={48}
                className="object-cover w-full h-full"
                onError={() => handleImageError(index)}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
