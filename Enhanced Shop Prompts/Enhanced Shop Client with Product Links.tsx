// Enhanced app/shop/[handle]/InfluencerShopClient.tsx
// Fixes product links and improves image handling

'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Star, ShoppingCart, Heart, ExternalLink } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  in_stock: boolean;
  stock_count: number;
  custom_title?: string;
  sale_price?: number;
  is_featured?: boolean;
}

interface ShopData {
  id: string;
  handle: string;
  name: string;
  description: string;
  influencer: {
    display_name: string;
    avatar_url?: string;
    bio?: string;
  };
  products: Product[];
}

interface InfluencerShopClientProps {
  shopData: ShopData;
}

function ProductCard({ product, shopHandle }: { product: Product; shopHandle: string }) {
  const [imageError, setImageError] = useState(false);
  const effectivePrice = product.sale_price || product.price;
  const hasDiscount = product.sale_price && product.sale_price < product.price;
  const displayName = product.custom_title || product.name;
  
  // Fallback image
  const productImage = imageError || !product.images?.length 
    ? '/placeholder-product.jpg' 
    : product.images[0];
    
  const handleImageError = () => {
    setImageError(true);
  };
  
  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-lg">
      <div className="aspect-square overflow-hidden">
        <Link href={`/shop/${shopHandle}/product/${product.id}`}>
          <Image
            src={productImage}
            alt={displayName}
            width={400}
            height={400}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            onError={handleImageError}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
          />
        </Link>
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Product badges */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {hasDiscount && (
                <Badge variant="destructive" className="text-xs">
                  Sale
                </Badge>
              )}
              {product.is_featured && (
                <Badge variant="default" className="text-xs">
                  Featured
                </Badge>
              )}
              {!product.in_stock && (
                <Badge variant="outline" className="text-xs">
                  Out of Stock
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Heart className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Product title */}
          <div>
            <h3 className="font-semibold text-lg leading-tight line-clamp-2">
              <Link href={`/shop/${shopHandle}/product/${product.id}`} className="hover:underline">
                {displayName}
              </Link>
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {product.description}
            </p>
          </div>
          
          {/* Rating */}
          <div className="flex items-center gap-1">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">(4.5)</span>
          </div>
          
          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg">
                ${(effectivePrice / 100).toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-muted-foreground line-through">
                  ${(product.price / 100).toFixed(2)}
                </span>
              )}
            </div>
            <Badge variant="secondary" className="text-xs">
              {product.category}
            </Badge>
          </div>
          
          {/* Stock info */}
          <div className="text-xs text-muted-foreground">
            {product.in_stock ? (
              <span className="text-green-600">
                {product.stock_count} in stock
              </span>
            ) : (
              <span className="text-red-600">Out of stock</span>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              className="flex-1" 
              disabled={!product.in_stock}
              size="sm"
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              Add to Cart
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/shop/${shopHandle}/product/${product.id}`}>
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ShopHeader({ shopData }: { shopData: ShopData }) {
  const [avatarError, setAvatarError] = useState(false);
  
  const avatarSrc = avatarError || !shopData.influencer.avatar_url 
    ? '/default-avatar.jpg' 
    : shopData.influencer.avatar_url;
    
  return (
    <div className="text-center space-y-6 py-12">
      <div className="flex justify-center">
        <div className="relative">
          <Image
            src={avatarSrc}
            alt={shopData.influencer.display_name}
            width={120}
            height={120}
            className="rounded-full border-4 border-white shadow-lg"
            onError={() => setAvatarError(true)}
          />
          <div className="absolute -bottom-2 -right-2 bg-green-500 border-4 border-white rounded-full p-2">
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">{shopData.name}</h1>
        <p className="text-xl text-muted-foreground">
          by {shopData.influencer.display_name}
        </p>
        {shopData.description && (
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {shopData.description}
          </p>
        )}
        {shopData.influencer.bio && (
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            {shopData.influencer.bio}
          </p>
        )}
      </div>
      
      <div className="flex justify-center gap-4">
        <Button variant="outline">
          <Heart className="h-4 w-4 mr-2" />
          Follow Shop
        </Button>
        <Button variant="outline">
          <ExternalLink className="h-4 w-4 mr-2" />
          Share Shop
        </Button>
      </div>
    </div>
  );
}

export default function InfluencerShopClient({ shopData }: InfluencerShopClientProps) {
  const [filter, setFilter] = useState<'all' | 'featured' | 'sale'>('all');
  
  const filteredProducts = shopData.products.filter(product => {
    if (filter === 'featured') return product.is_featured;
    if (filter === 'sale') return product.sale_price && product.sale_price < product.price;
    return true;
  });
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Shop Header */}
      <ShopHeader shopData={shopData} />
      
      {/* Filters */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center gap-2 mb-8">
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            All Products ({shopData.products.length})
          </Button>
          <Button 
            variant={filter === 'featured' ? 'default' : 'outline'}
            onClick={() => setFilter('featured')}
            size="sm"
          >
            Featured ({shopData.products.filter(p => p.is_featured).length})
          </Button>
          <Button 
            variant={filter === 'sale' ? 'default' : 'outline'}
            onClick={() => setFilter('sale')}
            size="sm"
          >
            On Sale ({shopData.products.filter(p => p.sale_price && p.sale_price < p.price).length})
          </Button>
        </div>
        
        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                shopHandle={shopData.handle}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">
              {filter === 'all' 
                ? 'No products available in this shop.'
                : `No ${filter} products found.`
              }
            </div>
            {filter !== 'all' && (
              <Button 
                variant="outline" 
                onClick={() => setFilter('all')}
                className="mt-4"
              >
                View All Products
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
