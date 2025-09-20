"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { ProductImage } from "@/components/ui/product-image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  Star,
  Shield,
  Users,
  TrendingUp,
  Filter,
  Grid3X3,
  List,
  Instagram,
  Twitter,
  Youtube,
  ExternalLink,
} from "lucide-react"

// Mock influencer shops data
const mockShops = [
  {
    id: "1",
    handle: "sarah_style",
    name: "Sarah Chen",
    bio: "Fashion & lifestyle creator sharing sustainable finds ✨",
    avatar: "/brand-manager-avatar.png",
    banner: "/fashion-banner.png",
    followers: "125K",
    verified: true,
    category: "Fashion",
    rating: 4.8,
    totalProducts: 45,
    totalSales: 1250,
    badges: ["Verified", "Top Seller"],
    socialLinks: {
      instagram: "https://instagram.com/sarah_style",
      twitter: "https://twitter.com/sarah_style",
      youtube: "https://youtube.com/@sarahstyle",
    },
  },
  {
    id: "2",
    handle: "tech_guru_mike",
    name: "Mike Rodriguez",
    bio: "Latest tech reviews and gadget recommendations 🔥",
    avatar: "/brand-manager-avatar.png",
    banner: "/tech-banner.png",
    followers: "89K",
    verified: true,
    category: "Technology",
    rating: 4.9,
    totalProducts: 32,
    totalSales: 890,
    badges: ["Verified", "Tech Expert"],
    socialLinks: {
      instagram: "https://instagram.com/tech_guru_mike",
      youtube: "https://youtube.com/@techgurumike",
    },
  },
  {
    id: "3",
    handle: "wellness_with_anna",
    name: "Anna Thompson",
    bio: "Holistic wellness & natural beauty advocate 🌿",
    avatar: "/brand-manager-avatar.png",
    banner: "/wellness-banner.png",
    followers: "67K",
    verified: true,
    category: "Health & Beauty",
    rating: 4.7,
    totalProducts: 28,
    totalSales: 650,
    badges: ["Verified", "Wellness Expert"],
    socialLinks: {
      instagram: "https://instagram.com/wellness_with_anna",
      twitter: "https://twitter.com/wellness_anna",
    },
  },
  {
    id: "4",
    handle: "home_decor_lily",
    name: "Lily Park",
    bio: "Creating beautiful spaces on any budget 🏠",
    avatar: "/brand-manager-avatar.png",
    banner: "/home-banner.png",
    followers: "45K",
    verified: false,
    category: "Home & Garden",
    rating: 4.6,
    totalProducts: 38,
    totalSales: 420,
    badges: ["Rising Star"],
    socialLinks: {
      instagram: "https://instagram.com/home_decor_lily",
      youtube: "https://youtube.com/@homedecorwithLily",
    },
  },
  {
    id: "5",
    handle: "fitness_coach_alex",
    name: "Alex Johnson",
    bio: "Fitness equipment & nutrition recommendations 💪",
    avatar: "/brand-manager-avatar.png",
    banner: "/fitness-banner.png",
    followers: "112K",
    verified: true,
    category: "Sports & Fitness",
    rating: 4.8,
    totalProducts: 52,
    totalSales: 980,
    badges: ["Verified", "Fitness Pro"],
    socialLinks: {
      instagram: "https://instagram.com/fitness_coach_alex",
      twitter: "https://twitter.com/fitnessalex",
      youtube: "https://youtube.com/@fitnesscoachAlex",
    },
  },
  {
    id: "6",
    handle: "foodie_adventures",
    name: "Emma Wilson",
    bio: "Kitchen essentials & gourmet food discoveries 🍳",
    avatar: "/brand-manager-avatar.png",
    banner: "/food-banner.png",
    followers: "78K",
    verified: true,
    category: "Food & Kitchen",
    rating: 4.7,
    totalProducts: 41,
    totalSales: 720,
    badges: ["Verified", "Culinary Expert"],
    socialLinks: {
      instagram: "https://instagram.com/foodie_adventures",
      youtube: "https://youtube.com/@foodieadventures",
    },
  },
]

const categories = ["All", "Fashion", "Technology", "Health & Beauty", "Home & Garden", "Sports & Fitness", "Food & Kitchen"]
const sortOptions = [
  { value: "popular", label: "Most Popular" },
  { value: "newest", label: "Newest" },
  { value: "followers", label: "Most Followers" },
  { value: "rating", label: "Highest Rated" },
  { value: "products", label: "Most Products" },
]

export default function ShopsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [sortBy, setSortBy] = useState("popular")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Filter and sort shops
  const filteredShops = useMemo(() => {
    const filtered = mockShops.filter((shop) => {
      const matchesSearch = 
        shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.bio.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === "All" || shop.category === selectedCategory

      return matchesSearch && matchesCategory
    })

    // Sort shops
    switch (sortBy) {
      case "newest":
        return filtered.sort((a, b) => b.id.localeCompare(a.id))
      case "followers":
        return filtered.sort((a, b) => parseInt(b.followers.replace('K', '')) - parseInt(a.followers.replace('K', '')))
      case "rating":
        return filtered.sort((a, b) => b.rating - a.rating)
      case "products":
        return filtered.sort((a, b) => b.totalProducts - a.totalProducts)
      default:
        return filtered.sort((a, b) => b.totalSales - a.totalSales)
    }
  }, [searchQuery, selectedCategory, sortBy])

  const ShopCard = ({ shop }: { shop: typeof mockShops[0] }) => (
    <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300">
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
              variant={badge === "Verified" ? "default" : badge === "Top Seller" ? "destructive" : "secondary"}
              className="text-xs"
            >
              {badge}
            </Badge>
          ))}
        </div>
        <div className="absolute bottom-2 right-2">
          <div className="flex items-center gap-1 bg-black/50 text-white px-2 py-1 rounded text-xs">
            <Star className="h-3 w-3 text-amber-400 fill-current" />
            <span>{shop.rating}</span>
          </div>
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
              <Link href={`/shop/${shop.handle}`} className="hover:text-indigo-600">
                {shop.name}
              </Link>
            </h3>
            <p className="text-sm text-gray-600">@{shop.handle}</p>
            <p className="text-xs text-gray-500 line-clamp-2 mt-1">{shop.bio}</p>
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
              <Link href={shop.socialLinks.instagram} className="text-gray-400 hover:text-pink-500">
                <Instagram className="h-4 w-4" />
              </Link>
            )}
            {shop.socialLinks.twitter && (
              <Link href={shop.socialLinks.twitter} className="text-gray-400 hover:text-blue-500">
                <Twitter className="h-4 w-4" />
              </Link>
            )}
            {shop.socialLinks.youtube && (
              <Link href={shop.socialLinks.youtube} className="text-gray-400 hover:text-red-500">
                <Youtube className="h-4 w-4" />
              </Link>
            )}
          </div>
          <Button size="sm" asChild className="bg-indigo-600 hover:bg-indigo-700">
            <Link href={`/shop/${shop.handle}`}>
              Visit Shop
              <ExternalLink className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">Discover Amazing Shops</h1>
            <p className="text-xl text-indigo-100 mb-8">
              Explore curated collections from your favorite influencers and creators
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
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category ? "bg-indigo-600 hover:bg-indigo-700" : ""}
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
            {filteredShops.length} shop{filteredShops.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </section>

      {/* Shops Grid */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8" id="main-content">
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No shops found</h3>
            <p className="text-gray-600">Try adjusting your search or category filters</p>
          </div>
        )}
      </main>
    </div>
  )
}
