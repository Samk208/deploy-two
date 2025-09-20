"use client"

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface ProductImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  priority?: boolean
  sizes?: string
  className?: string
  containerClassName?: string
  showLoadingState?: boolean
  fallbackSrc?: string
}

export function ProductImage({ 
  src, 
  alt, 
  width,
  height,
  fill = false,
  priority = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  className,
  containerClassName,
  showLoadingState = true,
  fallbackSrc = '/placeholder.jpg',
  ...props 
}: ProductImageProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    if (imgSrc !== fallbackSrc) {
      setHasError(true)
      setImgSrc(fallbackSrc)
      setIsLoading(false)
    }
  }

  const handleLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  const imageProps = {
    ...props,
    src: imgSrc,
    alt,
    onError: handleError,
    onLoad: handleLoad,
    sizes,
    priority,
    className: cn(
      "transition-opacity duration-300",
      isLoading && showLoadingState ? "opacity-0" : "opacity-100",
      className
    ),
    ...(fill ? { fill: true } : { width: width || 600, height: height || 600 })
  }

  if (fill) {
    return (
      <div className={cn("relative overflow-hidden", containerClassName)}>
        {isLoading && showLoadingState && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-md" />
        )}
        <Image {...imageProps} alt={alt} />
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-md">
            <div className="text-center text-gray-500">
              <svg 
                className="mx-auto h-12 w-12 text-gray-400 mb-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1} 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
              <span className="text-sm">Image unavailable</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn("relative", containerClassName)}>
      {isLoading && showLoadingState && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse rounded-md"
          style={{ width: width || 600, height: height || 600 }}
        />
      )}
      <Image {...imageProps} alt={alt} />
      {hasError && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-md"
          style={{ width: width || 600, height: height || 600 }}
        >
          <div className="text-center text-gray-500">
            <svg 
              className="mx-auto h-12 w-12 text-gray-400 mb-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1} 
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
            <span className="text-sm">Image unavailable</span>
          </div>
        </div>
      )}
    </div>
  )
}
