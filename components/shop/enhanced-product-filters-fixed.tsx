"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
  const [priceMin, setPriceMin] = useState(0)
  const [priceMax, setPriceMax] = useState(1000)
  const router = useRouter()
  const searchParams = useSearchParams()
  const isInitialMount = useRef(true)

  // Load filters from URL on mount - only run once
  useEffect(() => {
    if (!isInitialMount.current) return
    
    const search = searchParams.get("search") || ""
    const category = searchParams.get("category") || ""
    const priceMinParam = searchParams.get("priceMin") || "0"
    const priceMaxParam = searchParams.get("priceMax") || "1000"
    const rating = searchParams.get("rating") || "0"
    const sortBy = searchParams.get("sortBy") || "newest"
    const inStock = searchParams.get("inStock") !== "false"
    const onSale = searchParams.get("onSale") === "true"
    const brandsParam = searchParams.get("brands") || ""

    const minPrice = parseInt(priceMinParam)
    const maxPrice = parseInt(priceMaxParam)
    
    setPriceMin(minPrice)
    setPriceMax(maxPrice)

    const newFilters: ProductFilters = {
      search,
      category,
      priceRange: [minPrice, maxPrice],
      inStock,
      onSale,
      rating: parseInt(rating),
      sortBy,
      brands: brandsParam ? brandsParam.split(",") : []
    }

    setFilters(newFilters)
    onFiltersChange(newFilters)
    isInitialMount.current = false
  }, [searchParams]) // Remove onFiltersChange from dependencies

  // Update URL when filters change
  const updateURL = useCallback((newFilters: ProductFilters) => {
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
  }, [router])

  const handleFilterChange = useCallback((key: keyof ProductFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
    updateURL(newFilters)
  }, [filters, onFiltersChange, updateURL])

  const handlePriceChange = useCallback((field: 'min' | 'max', value: string) => {
    const numValue = parseInt(value) || 0
    if (field === 'min') {
      setPriceMin(numValue)
      const newMax = Math.max(numValue, priceMax)
      setPriceMax(newMax)
      handleFilterChange("priceRange", [numValue, newMax])
    } else {
      setPriceMax(numValue)
      const newMin = Math.min(numValue, priceMin)
      setPriceMin(newMin)
      handleFilterChange("priceRange", [newMin, numValue])
    }
  }, [priceMin, priceMax, handleFilterChange])

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
    setPriceMin(0)
    setPriceMax(1000)
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

          {/* Price Range - Using input fields instead of Slider to avoid infinite loop */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Price Range
            </Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Min"
                  value={priceMin}
                  onChange={(e) => handlePriceChange('min', e.target.value)}
                  min={0}
                  max={1000}
                  className="w-full"
                />
              </div>
              <span className="text-gray-500">-</span>
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Max"
                  value={priceMax}
                  onChange={(e) => handlePriceChange('max', e.target.value)}
                  min={0}
                  max={1000}
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>${priceMin}</span>
              <span>${priceMax}</span>
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
                  variant={filters.rating === rating ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange("rating", filters.rating === rating ? 0 : rating)}
                  className="p-2"
                >
                  <Star className={cn("h-4 w-4", filters.rating >= rating && "fill-current")} />
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
            <div className="space-y-2">
              {brands.map((brand) => (
                <label
                  key={brand}
                  className="flex items-center space-x-2 cursor-pointer hover:text-indigo-600"
                >
                  <input
                    type="checkbox"
                    checked={filters.brands.includes(brand)}
                    onChange={() => handleBrandToggle(brand)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm">{brand}</span>
                </label>
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
              >
                In Stock Only
              </Button>
              <Button
                variant={filters.onSale ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange("onSale", !filters.onSale)}
              >
                On Sale
              </Button>
            </div>
          </div>

          {/* Sort By */}
          <div className="space-y-2">
            <Label>Sort By</Label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t space-y-2">
            <div className="text-sm text-gray-500">
              Showing {totalProducts} products
            </div>
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="w-full"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
