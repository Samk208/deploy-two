"use client";

import { ProductImageGallery } from "@/components/shop/product-image-gallery";
import { QuickViewModal } from "@/components/shop/quick-view-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCartStore, type CartItem } from "@/lib/store/cart";
import {
  CheckCircle,
  Heart,
  Instagram,
  MapPin,
  Search,
  Share2,
  ShoppingCart,
  Star,
  Twitter,
  Users,
  Youtube,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string;
  badges: string[];
  category: string;
  region: string;
  inStock: boolean;
  stockCount: number;
  rating: number;
  reviews: number;
}

// Product shape used by the Quick View modal
interface QuickViewProduct {
  id: string | number;
  title: string;
  description?: string;
  price: number;
  original_price?: number;
  images?: string[] | string;
  category?: string;
  region?: string;
  in_stock?: boolean;
  stock_count?: number;
  rating?: number;
  reviews?: number;
  commission?: number;
}

interface Influencer {
  handle: string;
  name: string;
  bio: string;
  avatar: string;
  banner: string;
  followers: string;
  verified: boolean;
  socialLinks: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
}

interface InfluencerShopClientProps {
  influencer: Influencer;
  products: Product[];
  handle: string;
}

export function InfluencerShopClient({
  influencer,
  products,
  handle,
}: InfluencerShopClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [sortBy, setSortBy] = useState("featured");
  const { addItem } = useCartStore();
  const [quickViewProduct, setQuickViewProduct] =
    useState<QuickViewProduct | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  // Get unique categories and regions
  const categories = useMemo(() => {
    const cats = ["All", ...new Set(products.map((p) => p.category))];
    return cats;
  }, [products]);

  const regions = useMemo(() => {
    const regs = ["All", ...new Set(products.map((p) => p.region))];
    return regs;
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const matchesSearch = product.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory;
      const matchesRegion =
        selectedRegion === "All" || product.region === selectedRegion;
      return matchesSearch && matchesCategory && matchesRegion;
    });

    // Sort products
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "reviews":
        filtered.sort((a, b) => b.reviews - a.reviews);
        break;
      default:
        // Keep original order for 'featured'
        break;
    }

    return filtered;
  }, [products, searchQuery, selectedCategory, selectedRegion, sortBy]);

  const handleAddToCart = (product: Product) => {
    try {
      console.debug("[InfluencerShop] Add to cart clicked:", {
        product,
        influencer,
        handle,
      });
    } catch (_) {}
    const cartItem: Omit<CartItem, "quantity"> & { quantity?: number } = {
      id: String(product.id),
      title: product.title,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      category: product.category,
      maxQuantity: product.stockCount,
      // Use influencer handle as a stable, non-empty supplier identifier fallback for dev
      supplierId: handle || influencer.handle || "unknown",
      supplierName: "Unknown Supplier",
      supplierVerified: false,
      shopHandle: handle,
      influencerHandle: influencer.handle,
      quantity: 1,
    };
    addItem(cartItem);
    toast.success(`${product.title} added to cart!`);
  };

  const openQuickView = (product: Product) => {
    const modalProduct: QuickViewProduct = {
      id: product.id,
      title: product.title,
      description: "",
      price: product.price,
      original_price: product.originalPrice,
      images: [product.image].filter(Boolean),
      category: product.category,
      region: product.region,
      in_stock: product.inStock,
      stock_count: product.stockCount,
      rating: product.rating,
      reviews: product.reviews,
      commission: 0,
    };
    setQuickViewProduct(modalProduct);
    setIsQuickViewOpen(true);
  };

  const closeQuickView = () => {
    setIsQuickViewOpen(false);
    setQuickViewProduct(null);
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case "instagram":
        return <Instagram className="h-5 w-5" />;
      case "twitter":
        return <Twitter className="h-5 w-5" />;
      case "youtube":
        return <Youtube className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="relative">
        <div className="h-64 bg-gradient-to-r from-purple-500 to-pink-500 overflow-hidden">
          <Image
            src={influencer.banner}
            alt={`${influencer.name} banner`}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Influencer Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
          <div className="container mx-auto">
            <div className="flex items-end gap-4">
              <div className="relative">
                <Image
                  src={influencer.avatar}
                  alt={influencer.name}
                  width={96}
                  height={96}
                  className="rounded-full border-4 border-white shadow-lg"
                />
                {influencer.verified && (
                  <CheckCircle className="absolute -bottom-1 -right-1 h-6 w-6 text-blue-500 bg-white rounded-full" />
                )}
              </div>

              <div className="flex-1 text-white">
                <h1 className="text-2xl font-bold mb-1">{influencer.name}</h1>
                <p className="text-sm opacity-90 mb-2">@{influencer.handle}</p>
                <p className="text-sm opacity-90 max-w-2xl">{influencer.bio}</p>

                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {influencer.followers} followers
                    </span>
                  </div>

                  {/* Social Links */}
                  <div className="flex gap-2">
                    {Object.entries(influencer.socialLinks).map(
                      ([platform, url]) => (
                        <Link
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                        >
                          {getSocialIcon(platform)}
                        </Link>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Follow
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="reviews">Most Reviews</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-8">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No products found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                {filteredProducts.length} product
                {filteredProducts.length !== 1 ? "s" : ""} found
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="group hover:shadow-lg transition-shadow overflow-hidden"
                >
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => openQuickView(product)}
                      className="w-full text-left"
                      aria-label={`Quick view ${product.title}`}
                    >
                      <ProductImageGallery
                        images={[product.image]}
                        productName={product.title}
                        layout="grid"
                        className="w-full"
                      />
                    </button>

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                      {product.badges.map((badge) => (
                        <Badge
                          key={badge}
                          variant="secondary"
                          className="text-xs"
                        >
                          {badge}
                        </Badge>
                      ))}
                    </div>

                    {/* Stock indicator */}
                    {product.stockCount <= 5 && (
                      <Badge
                        variant="destructive"
                        className="absolute top-2 right-2 text-xs"
                      >
                        Only {product.stockCount} left
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-sm line-clamp-2 flex-1">
                        {product.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 mb-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">
                        {product.rating}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({product.reviews})
                      </span>
                    </div>

                    <div className="flex items-center gap-1 mb-3">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {product.region}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">
                          ${product.price}
                        </span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-500 line-through">
                            ${product.originalPrice}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <Button
                        className="w-full"
                        disabled={!product.inStock}
                        onClick={() => handleAddToCart(product)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add to Cart
                      </Button>
                      <Link href={`/shop/${handle}/product/${product.id}`}>
                        <Button variant="outline" className="w-full">
                          View
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={isQuickViewOpen}
        onClose={closeQuickView}
        onAddToCart={(p) => {
          // Map modal product back to cart schema
          const mapped: Product = {
            id: String((p as QuickViewProduct).id),
            title: (p as QuickViewProduct).title,
            price: (p as QuickViewProduct).price,
            originalPrice: (p as QuickViewProduct).original_price,
            image: Array.isArray((p as QuickViewProduct).images)
              ? ((p as QuickViewProduct).images as string[])[0]
              : ((p as QuickViewProduct).images as string | undefined) || "",
            badges: [],
            category: (p as QuickViewProduct).category || "General",
            region: (p as QuickViewProduct).region || "Global",
            inStock: (p as QuickViewProduct).in_stock !== false,
            stockCount: (p as QuickViewProduct).stock_count || 0,
            rating: (p as QuickViewProduct).rating || 4.5,
            reviews: (p as QuickViewProduct).reviews || 0,
          };
          handleAddToCart(mapped);
        }}
      />
    </div>
  );
}
