/* Product Detail Page Component */

// Create app/shop/[handle]/product/[id]/page.tsx

// Based on Next.js Commerce patterns and best practices

import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Heart, Share2, ShoppingCart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: { 
    handle: string;
    id: string;
  };
}

interface ProductWithShop {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  stock_count: number;
  in_stock: boolean;
  category: string;
  commission: number;
  custom_title?: string;
  sale_price?: number;
  shop: {
    id: string;
    handle: string;
    name: string;
    description: string;
    influencer: {
      name: string;
      avatar_url?: string;
    };
  };
}

// Image gallery component
function ProductImageGallery({ images, productName }: { images: string[]; productName: string }) {
  const mainImage = images[0] || '/placeholder-product.jpg';
  
  return (
    <div className="space-y-4">
      {/* Main image */}
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
        <Image
          src={mainImage}
          alt={productName}
          width={600}
          height={600}
          className="h-full w-full object-cover object-center"
          priority
        />
      </div>
      
      {/* Thumbnail gallery */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.slice(0, 4).map((image, index) => (
            <div key={index} className="aspect-square overflow-hidden rounded-md bg-gray-100">
              <Image
                src={image}
                alt={`${productName} view ${index + 1}`}
                width={150}
                height={150}
                className="h-full w-full object-cover object-center cursor-pointer hover:opacity-75 transition-opacity"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Product info component
function ProductInfo({ product }: { product: ProductWithShop }) {
  const effectivePrice = product.sale_price || product.price;
  const hasDiscount = product.sale_price && product.sale_price < product.price;
  const displayName = product.custom_title || product.title;
  
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500">
        <Link href={`/shop/${product.shop.handle}`} className="hover:text-gray-900 flex items-center">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to {product.shop.name}
        </Link>
      </nav>
      
      {/* Product title and shop info */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {displayName}
        </h1>
        <div className="mt-3 flex items-center space-x-2">
          <span className="text-sm text-gray-500">by</span>
          <div className="flex items-center space-x-2">
            {product.shop.influencer.avatar_url && (
              <Image
                src={product.shop.influencer.avatar_url}
                alt={product.shop.influencer.name}
                width={24}
                height={24}
                className="rounded-full"
              />
            )}
            <span className="font-medium text-gray-900">
              {product.shop.influencer.name}
            </span>
          </div>
        </div>
      </div>
      
      {/* Rating placeholder */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <span className="text-sm text-gray-500">(4.8) • 124 reviews</span>
      </div>
      
      {/* Price - NOTE: Prices stored as DECIMAL dollars, not cents */}
      <div className="flex items-center space-x-3">
        <span className="text-3xl font-bold text-gray-900">
          ${effectivePrice.toFixed(2)}
        </span>
        {hasDiscount && (
          <>
            <span className="text-lg text-gray-500 line-through">
              ${product.price.toFixed(2)}
            </span>
            <Badge variant="destructive">
              Save ${(product.price - effectivePrice).toFixed(2)}
            </Badge>
          </>
        )}
      </div>
      
      {/* Stock status */}
      <div className="flex items-center space-x-2">
        {product.in_stock ? (
          <>
            <div className="h-2 w-2 rounded-full bg-green-400"></div>
            <span className="text-sm text-green-600">
              In stock ({product.stock_count} available)
            </span>
          </>
        ) : (
          <>
            <div className="h-2 w-2 rounded-full bg-red-400"></div>
            <span className="text-sm text-red-600">Out of stock</span>
          </>
        )}
      </div>
      
      {/* Description */}
      <div className="prose max-w-none text-gray-600">
        <p>{product.description}</p>
      </div>
      
      {/* Category and commission info */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{product.category}</Badge>
        {hasDiscount && (
          <Badge variant="outline">Influencer Special</Badge>
        )}
      </div>
      
      {/* Actions */}
      <div className="space-y-4">
        <div className="flex space-x-3">
          <Button 
            size="lg" 
            className="flex-1"
            disabled={!product.in_stock}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
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
  );
}

// Loading component
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
  );
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { handle, id } = params;
  const supabase = await createClient();
  
  // Fetch product with shop and influencer data
  const { data: product, error } = await supabase
    .from('influencer_shop_products')
    .select(`
      sale_price,
      custom_title,
      is_featured,
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
      ),
      shops!influencer_shop_products_influencer_id_fkey (
        id,
        handle,
        name,
        description,
        profiles!shops_influencer_id_fkey (
          name,
          avatar_url
        )
      )
    `)
    .eq('product_id', id)
    .eq('shops.handle', handle)
    .single();
    
  if (error || !product) {
    notFound();
  }
  
  // Transform data structure with defensive null checks
  // SAFETY: Guard against missing nested properties to prevent runtime errors
  const productInfo = product?.products || {};
  const shopInfo = product?.shops || {};
  const profileInfo = shopInfo?.profiles || {};
  
  const productData: ProductWithShop = {
    id: productInfo.id ?? '',
    title: productInfo.title ?? 'Untitled Product',
    description: productInfo.description ?? '',
    price: productInfo.price ?? 0,
    images: Array.isArray(productInfo.images) ? productInfo.images : [],
    stock_count: productInfo.stock_count ?? 0,
    in_stock: productInfo.in_stock ?? false,
    category: productInfo.category ?? 'general',
    commission: productInfo.commission ?? 0,
    custom_title: product?.custom_title ?? '',
    sale_price: product?.sale_price ?? null,
    shop: {
      id: shopInfo.id ?? '',
      handle: shopInfo.handle ?? 'unknown',
      name: shopInfo.name ?? 'Unknown Shop',
      description: shopInfo.description ?? '',
      influencer: {
        name: profileInfo.name ?? 'Unknown Influencer',
        avatar_url: profileInfo.avatar_url ?? '',
      },
    },
  };
  
  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Image gallery */}
          <ProductImageGallery 
            images={productData.images} 
            productName={productData.custom_title || productData.title} 
          />
          
          {/* Product info */}
          <ProductInfo product={productData} />
        </div>
        
        {/* Related products section could go here */}
      </div>
    </Suspense>
  );
}