"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProductImage } from "@/components/ui/product-image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ExternalLink,
  Grid3X3,
  Instagram,
  List,
  Search,
  Shield,
  Star,
  TrendingUp,
  Twitter,
  Users,
  Youtube,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

// Shop model for UI
export interface Shop {
  id: string;
  handle: string;
  name: string;
  bio: string;
  avatar: string;
  banner: string;
  followers: string; // human-readable like "125K", "1.2M", "999"
  verified: boolean;
  category: string;
  rating: number;
  totalProducts: number;
  totalSales: number;
  createdAt?: string;
  badges: string[];
  socialLinks: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
}

// Map raw API shop into UI Shop type, returning null if invalid
function mapApiShopToShop(apiShop: any): Shop | null {
  const idVal =
    (typeof apiShop?.id === "string" && apiShop.id.trim()) ||
    (typeof apiShop?.id === "number" && String(apiShop.id)) ||
    "";
  const handleVal = typeof apiShop?.handle === "string" ? apiShop.handle.trim() : "";
  const nameVal = typeof apiShop?.name === "string" ? apiShop.name.trim() : "";
  if (!idVal || !handleVal || !nameVal) return null;

  // Preserve social links if provided as discrete fields or nested object
  const apiSocial = (apiShop?.socialLinks && typeof apiShop.socialLinks === "object")
    ? apiShop.socialLinks
    : {};
  const socialLinks: Shop["socialLinks"] = {
    instagram:
      (typeof apiShop?.instagram === "string" && apiShop.instagram) ||
      (typeof apiSocial?.instagram === "string" && apiSocial.instagram) ||
      undefined,
    twitter:
      (typeof apiShop?.twitter === "string" && apiShop.twitter) ||
      (typeof apiSocial?.twitter === "string" && apiSocial.twitter) ||
      undefined,
    youtube:
      (typeof apiShop?.youtube === "string" && apiShop.youtube) ||
      (typeof apiSocial?.youtube === "string" && apiSocial.youtube) ||
      undefined,
  };

  return {
    id: idVal,
    handle: handleVal,
    name: nameVal,
    bio: typeof apiShop?.description === "string" ? apiShop.description : "",
    avatar:
      (typeof apiShop?.influencer_avatar === "string" && apiShop.influencer_avatar) ||
      "/brand-manager-avatar.png",
    banner:
      (typeof apiShop?.banner === "string" && apiShop.banner) ||
      "/fashion-banner.png",
    followers: Number.isFinite(Number(apiShop?.followers_count))
      ? String(apiShop.followers_count)
      : "0",
    verified: Boolean(apiShop?.verified),
    category:
      Array.isArray(apiShop?.categories) && apiShop.categories.length > 0
        ? String(apiShop.categories[0])
        : "General",
    rating: Number.isFinite(Number(apiShop?.rating)) ? Number(apiShop?.rating) : 0,
    totalProducts: Number.isFinite(Number(apiShop?.product_count))
      ? Number(apiShop.product_count)
      : 0,
    totalSales: 0,
    createdAt:
      (typeof apiShop?.created_at === "string" && apiShop.created_at) ||
      (typeof apiShop?.createdAt === "string" && apiShop.createdAt) ||
      undefined,
    badges: apiShop?.verified ? ["Verified"] : [],
    socialLinks,
  };
}
// Loading skeleton for shops directory
function SkeletonGrid() {
  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 w-full bg-gray-200 rounded-md mb-3" />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}

function EmptyState() {
  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <Search className="h-12 w-12 mx-auto text-gray-400" />
      <h3 className="mt-4 text-lg font-medium text-gray-900">No shops found</h3>
      <p className="text-gray-600">Once creators publish products, shops will appear here.</p>
    </main>
  )
}

const categories = [
  "All",
  "Fashion",
  "Technology",
  "Health & Beauty",
  "Home & Garden",
  "Sports & Fitness",
  "Food & Kitchen",
];
const sortOptions = [
  { value: "popular", label: "Most Popular" },
  { value: "newest", label: "Newest" },
  { value: "followers", label: "Most Followers" },
  { value: "rating", label: "Highest Rated" },
  { value: "products", label: "Most Products" },
];

// Robust followers parser: supports K, M, B, decimals, or plain numbers
function parseFollowers(value: string): number {
  if (!value) return 0;
  const trimmed = String(value).trim();
  const match = trimmed.match(/^\s*([0-9]+(?:\.[0-9]+)?)\s*([kKmMbB])?\s*$/);
  if (!match) {
    // Try plain integer fallback
    const fallback = Number(trimmed.replace(/[,\s]/g, ""));
    return Number.isFinite(fallback) ? fallback : 0;
  }
  const num = parseFloat(match[1]);
  const suffix = match[2]?.toUpperCase();
  const multiplier =
    suffix === "K" ? 1e3 : suffix === "M" ? 1e6 : suffix === "B" ? 1e9 : 1;
  const result = num * multiplier;
  return Number.isFinite(result) ? result : 0;
}

function ShopCard({ shop }: { shop: Shop }) {
  return (
    <Card
      data-testid="shop-card"
      className="group overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300"
    >
      <div className="relative h-32 overflow-hidden">
        <ProductImage
          src={shop.banner || "/placeholder.svg"}
          alt={`${shop.name}'s shop banner`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          containerClassName="h-32"
          fallbackSrc="/placeholder.svg"
        />
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {shop.badges.map((badge) => (
            <Badge
              key={badge}
              variant={
                badge === "Verified"
                  ? "default"
                  : badge === "Top Seller"
                    ? "destructive"
                    : "secondary"
              }
              className="text-xs"
            >
              {badge}
            </Badge>
          ))}
        </div>
        <div className="absolute bottom-2 right-2">
          {shop.rating > 0 && (
            <div className="flex items-center gap-1 bg-black/50 text-white px-2 py-1 rounded text-xs">
              <Star className="h-3 w-3 text-amber-400 fill-current" />
              <span>{shop.rating}</span>
            </div>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="relative">
            <ProductImage
              src={shop.avatar || "/placeholder.svg"}
              alt={shop.name}
              width={48}
              height={48}
              className="rounded-full border-2 border-white shadow-sm"
              showLoadingState={false}
              fallbackSrc="/placeholder-user.jpg"
            />
            {shop.verified && (
              <div className="absolute -bottom-1 -right-1 bg-indigo-600 rounded-full p-1">
                <Shield className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              <Link
                href={`/shop/${shop.handle}`}
                className="hover:text-indigo-600"
              >
                {shop.name}
              </Link>
            </h3>
            <p className="text-sm text-gray-600">@{shop.handle}</p>
            <p className="text-xs text-gray-500 line-clamp-2 mt-1">
              {shop.bio}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{shop.followers}</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            <span>{shop.totalProducts} products</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {shop.socialLinks.instagram && (
              <Link
                href={shop.socialLinks.instagram}
                className="text-gray-400 hover:text-pink-500"
              >
                <Instagram className="h-4 w-4" />
              </Link>
            )}
            {shop.socialLinks.twitter && (
              <Link
                href={shop.socialLinks.twitter}
                className="text-gray-400 hover:text-blue-500"
              >
                <Twitter className="h-4 w-4" />
              </Link>
            )}
            {shop.socialLinks.youtube && (
              <Link
                href={shop.socialLinks.youtube}
                className="text-gray-400 hover:text-red-500"
              >
                <Youtube className="h-4 w-4" />
              </Link>
            )}
          </div>
          <Button
            size="sm"
            asChild
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Link href={`/shop/${shop.handle}`}>
              Visit Shop
              <ExternalLink className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ShopsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [shops, setShops] = useState<Shop[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/shops/directory", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load directory");
        const json = await res.json();
        const list = Array.isArray(json?.data?.shops) ? json.data.shops : [];
        const mapped = list
          .map((s: any) => mapApiShopToShop(s))
          .filter((s: Shop | null): s is Shop => s !== null);
        if (!cancelled) setShops(mapped);
      } catch (_e) {
        if (!cancelled) setShops([]); // empty-state, not mock data
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true }; 
  }, []);

  // Filter and sort shops
  const filteredShops = useMemo(() => {
    const baseList = Array.isArray(shops) ? shops : [];
    const filtered = baseList.filter((shop) => {
      const matchesSearch =
        shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.bio.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || shop.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    // Sort shops
    const sorted = [...filtered];
    switch (sortBy) {
      case "newest": {
        return sorted.sort((a, b) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : NaN;
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : NaN;
          const taValid = Number.isFinite(ta);
          const tbValid = Number.isFinite(tb);
          if (taValid && tbValid) {
            if (tb > ta) return 1;
            if (tb < ta) return -1;
            return 0;
          }
          // If one is missing/invalid, push it after the valid one
          if (!taValid && tbValid) return 1; // a missing -> after b
          if (taValid && !tbValid) return -1; // b missing -> after a
          // Both missing/invalid: keep original order (stable sort expectation)
          return 0;
        });
      }
      case "followers":
        return sorted.sort(
          (a, b) => parseFollowers(b.followers) - parseFollowers(a.followers)
        );
      case "rating":
        return sorted.sort((a, b) => b.rating - a.rating);
      case "products":
        return sorted.sort((a, b) => b.totalProducts - a.totalProducts);
      default:
        // Popular: prefer follower count as a meaningful metric
        return sorted.sort(
          (a, b) => parseFollowers(b.followers) - parseFollowers(a.followers)
        );
    }
  }, [shops, searchQuery, selectedCategory, sortBy]);

  if (shops === null || loading) return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">Discover Amazing Shops</h1>
            <p className="text-xl text-indigo-100 mb-8">Explore curated collections from your favorite influencers and creators</p>
          </div>
        </div>
      </section>
      <SkeletonGrid />
    </div>
  );

  if (Array.isArray(shops) && shops.length === 0) return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">Discover Amazing Shops</h1>
            <p className="text-xl text-indigo-100 mb-8">Explore curated collections from your favorite influencers and creators</p>
          </div>
        </div>
      </section>
      <EmptyState />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">Discover Amazing Shops</h1>
            <p className="text-xl text-indigo-100 mb-8">
              Explore curated collections from your favorite influencers and
              creators
            </p>
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search shops, creators, or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 text-gray-900 bg-white border-0 rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filters & Controls */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={
                    selectedCategory === category ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={
                    selectedCategory === category
                      ? "bg-indigo-600 hover:bg-indigo-700"
                      : ""
                  }
                >
                  {category}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            {filteredShops.length} shop{filteredShops.length !== 1 ? "s" : ""}{" "}
            found
          </div>
        </div>
      </section>

      {/* Shops Grid */}
      <main
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-8"
        id="main-content"
      >
        {filteredShops.length > 0 ? (
          <div
            className={`grid gap-6 ${
              viewMode === "grid"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1 max-w-4xl mx-auto"
            }`}
          >
            {filteredShops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No shops found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or category filters
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
