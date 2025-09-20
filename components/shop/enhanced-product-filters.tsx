"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Check, X, Filter, Search, Star, Tag, DollarSign, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ProductFilters {
  search: string
  category: string
  priceRange: [number, number]
  inStock: boolean
  onSale: boolean
  rating: number
  sortBy: string
  brands: string[]
}

interface ProductFiltersProps {
  onFiltersChange: (filters: ProductFilters) => void
  totalProducts: number
  className?: string
}

const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "popularity", label: "Most Popular" },
  { value: "oldest", label: "Oldest First" }
]

const categories = [
  "Electronics",
  "Fashion", 
  "Home & Garden",
  "Sports",
  "Beauty",
  "Books",
  "Toys",
  "Automotive"
]

const brands = [
  "Apple",
  "Samsung", 
  "Nike",
  "Adidas",
  "Sony",
  "LG",
  "Canon",
  "Dell"
]

export function EnhancedProductFilters({ onFiltersChange, totalProducts, className }: ProductFiltersProps) {
  const [filters, setFilters] = useState<ProductFilters>({
    search: "",
    category: "",
    priceRange: [0, 1000],
    inStock: true,
    onSale: false,
    rating: 0,
    sortBy: "newest",
    brands: []
  })

  const [isExpanded, setIsExpanded] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Load filters from URL on mount
  useEffect(() => {
    const search = searchParams.get("search") || ""
    const category = searchParams.get("category") || ""
    const priceMin = searchParams.get("priceMin") || "0"
    const priceMax = searchParams.get("priceMax") || "1000"
    const rating = searchParams.get("rating") || "0"
    const sortBy = searchParams.get("sortBy") || "newest"
    const inStock = searchParams.get("inStock") !== "false"
    const onSale = searchParams.get("onSale") === "true"
    const brandsParam = searchParams.get("brands") || ""

    const newFilters: ProductFilters = {
      search,
      category,
      priceRange: [parseInt(priceMin), parseInt(priceMax)],
      inStock,
      onSale,
      rating: parseInt(rating),
      sortBy,
      brands: brandsParam ? brandsParam.split(",") : []
    }

    setFilters(newFilters)
    onFiltersChange(newFilters)
  }, [searchParams, onFiltersChange])

  // Update URL when filters change
  const updateURL = (newFilters: ProductFilters) => {
    const params = new URLSearchParams()
    
    if (newFilters.search) params.set("search", newFilters.search)
    if (newFilters.category) params.set("category", newFilters.category)
    if (newFilters.priceRange[0] > 0) params.set("priceMin", newFilters.priceRange[0].toString())
    if (newFilters.priceRange[1] < 1000) params.set("priceMax", newFilters.priceRange[1].toString())
    if (newFilters.rating > 0) params.set("rating", newFilters.rating.toString())
    if (newFilters.sortBy !== "newest") params.set("sortBy", newFilters.sortBy)
    if (!newFilters.inStock) params.set("inStock", "false")
    if (newFilters.onSale) params.set("onSale", "true")
    if (newFilters.brands.length > 0) params.set("brands", newFilters.brands.join(","))

    const newURL = params.toString() ? `?${params.toString()}` : ""
    router.push(`/shop${newURL}`, { scroll: false })
  }

  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
    updateURL(newFilters)
  }

  const handleBrandToggle = (brand: string) => {
    const newBrands = filters.brands.includes(brand)
      ? filters.brands.filter(b => b !== brand)
      : [...filters.brands, brand]
    
    handleFilterChange("brands", newBrands)
  }

  const clearFilters = () => {
    const defaultFilters: ProductFilters = {
      search: "",
      category: "",
      priceRange: [0, 1000],
      inStock: true,
      onSale: false,
      rating: 0,
      sortBy: "newest",
      brands: []
    }
    setFilters(defaultFilters)
    onFiltersChange(defaultFilters)
    router.push("/shop", { scroll: false })
  }

  const activeFiltersCount = [
    filters.search,
    filters.category,
    filters.priceRange[0] > 0 || filters.priceRange[1] < 1000,
    !filters.inStock,
    filters.onSale,
    filters.rating > 0,
    filters.brands.length > 0
  ].filter(Boolean).length

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-600 hover:text-gray-900"
        >
          {isExpanded ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
        </Button>
      </div>

      {isExpanded && (
        <div className="space-y-6">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search Products
            </Label>
            <Input
              id="search"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Category
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={filters.category === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange("category", filters.category === category ? "" : category)}
                  className="justify-start text-xs"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Price Range
            </Label>
            <div className="px-2">
              <Slider
                value={filters.priceRange}
                onValueChange={(value) => handleFilterChange("priceRange", value as [number, number])}
                max={1000}
                min={0}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>${filters.priceRange[0]}</span>
                <span>${filters.priceRange[1]}</span>
              </div>
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Minimum Rating
            </Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <Button
                  key={rating}
                  variant={filters.rating >= rating ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange("rating", filters.rating === rating ? 0 : rating)}
                  className="p-1 h-8 w-8"
                >
                  <Star className={cn("h-4 w-4", filters.rating >= rating ? "fill-current" : "")} />
                </Button>
              ))}
            </div>
          </div>

          {/* Brands */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Brands
            </Label>
            <div className="space-y-1">
              {brands.map((brand) => (
                <div key={brand} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={brand}
                    checked={filters.brands.includes(brand)}
                    onChange={() => handleBrandToggle(brand)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor={brand} className="text-sm font-normal">
                    {brand}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Filters */}
          <div className="space-y-2">
            <Label>Quick Filters</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filters.inStock ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange("inStock", !filters.inStock)}
                className="text-xs"
              >
                In Stock Only
              </Button>
              <Button
                variant={filters.onSale ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange("onSale", !filters.onSale)}
                className="text-xs"
              >
                On Sale
              </Button>
            </div>
          </div>

          {/* Sort */}
          <div className="space-y-2">
            <Label>Sort By</Label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="w-full"
            >
              Clear All Filters
            </Button>
          )}

          {/* Results Count */}
          <div className="text-sm text-gray-600 pt-2 border-t">
            Showing {totalProducts} products
          </div>
        </div>
      )}
    </div>
  )
}
