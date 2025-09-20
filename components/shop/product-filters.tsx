"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Grid,
  List,
  ArrowUpDown
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCategories } from "@/hooks/use-products"

interface ProductFiltersProps {
  onFiltersChange: (filters: ProductFilters) => void
  totalProducts: number
  className?: string
}

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

const DEFAULT_FILTERS: ProductFilters = {
  search: "",
  category: "",
  priceRange: [0, 1000],
  inStock: true,
  onSale: false,
  rating: 0,
  sortBy: "newest",
  brands: []
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "popular", label: "Most Popular" },
  { value: "name-az", label: "Name: A-Z" },
  { value: "name-za", label: "Name: Z-A" }
]

export function ProductFilters({ onFiltersChange, totalProducts, className }: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { categories, loading: categoriesLoading } = useCategories()

  const [filters, setFilters] = useState<ProductFilters>(DEFAULT_FILTERS)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  
  // Collapsible states
  const [categoryOpen, setCategoryOpen] = useState(true)
  const [priceOpen, setPriceOpen] = useState(true)
  const [brandOpen, setBrandOpen] = useState(true)
  const [ratingOpen, setRatingOpen] = useState(true)

  // Popular brands - in a real app, this would come from API
  const popularBrands = [
    "Nike", "Apple", "Samsung", "Sony", "Canon", "Adidas", 
    "Levi's", "Zara", "H&M", "Uniqlo"
  ]

  // Initialize filters from URL params
  useEffect(() => {
    const urlFilters: Partial<ProductFilters> = {
      search: searchParams.get("search") || "",
      category: searchParams.get("category") || "",
      sortBy: searchParams.get("sort") || "newest",
      inStock: searchParams.get("inStock") !== "false",
      onSale: searchParams.get("onSale") === "true",
    }

    const priceMin = searchParams.get("priceMin")
    const priceMax = searchParams.get("priceMax")
    if (priceMin && priceMax) {
      urlFilters.priceRange = [parseInt(priceMin), parseInt(priceMax)]
    }

    const rating = searchParams.get("rating")
    if (rating) {
      urlFilters.rating = parseInt(rating)
    }

    const brands = searchParams.get("brands")
    if (brands) {
      urlFilters.brands = brands.split(",")
    }

    setFilters(prev => ({ ...prev, ...urlFilters }))
  }, [searchParams])

  // Update filters and URL
  const updateFilters = (newFilters: Partial<ProductFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    onFiltersChange(updatedFilters)

    // Update URL
    const params = new URLSearchParams()
    if (updatedFilters.search) params.set("search", updatedFilters.search)
    if (updatedFilters.category) params.set("category", updatedFilters.category)
    if (updatedFilters.sortBy !== "newest") params.set("sort", updatedFilters.sortBy)
    if (!updatedFilters.inStock) params.set("inStock", "false")
    if (updatedFilters.onSale) params.set("onSale", "true")
    if (updatedFilters.priceRange[0] > 0) params.set("priceMin", updatedFilters.priceRange[0].toString())
    if (updatedFilters.priceRange[1] < 1000) params.set("priceMax", updatedFilters.priceRange[1].toString())
    if (updatedFilters.rating > 0) params.set("rating", updatedFilters.rating.toString())
    if (updatedFilters.brands.length > 0) params.set("brands", updatedFilters.brands.join(","))

    router.push(`?${params.toString()}`, { scroll: false })
  }

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS)
    onFiltersChange(DEFAULT_FILTERS)
    router.push(window.location.pathname, { scroll: false })
  }

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.search) count++
    if (filters.category) count++
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) count++
    if (!filters.inStock) count++
    if (filters.onSale) count++
    if (filters.rating > 0) count++
    if (filters.brands.length > 0) count++
    return count
  }, [filters])

  const handleBrandChange = (brand: string, checked: boolean) => {
    const newBrands = checked 
      ? [...filters.brands, brand]
      : filters.brands.filter(b => b !== brand)
    updateFilters({ brands: newBrands })
  }

  const removeBrand = (brand: string) => {
    const newBrands = filters.brands.filter(b => b !== brand)
    updateFilters({ brands: newBrands })
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
          className="pl-9"
        />
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="default" className="ml-1 h-5 px-1.5 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>

          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-red-600 hover:text-red-700"
            >
              Clear all
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {totalProducts.toLocaleString()} products
          </span>

          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-7 w-7 p-0"
            >
              <Grid className="h-3 w-3" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-7 w-7 p-0"
            >
              <List className="h-3 w-3" />
            </Button>
          </div>

          <Select value={filters.sortBy} onValueChange={(value) => updateFilters({ sortBy: value })}>
            <SelectTrigger className="w-[180px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filter Tags */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: {filters.search}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => updateFilters({ search: "" })}
              />
            </Badge>
          )}
          {filters.category && (
            <Badge variant="secondary" className="gap-1">
              {filters.category}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => updateFilters({ category: "" })}
              />
            </Badge>
          )}
          {(filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) && (
            <Badge variant="secondary" className="gap-1">
              ${filters.priceRange[0]} - ${filters.priceRange[1]}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => updateFilters({ priceRange: [0, 1000] })}
              />
            </Badge>
          )}
          {filters.onSale && (
            <Badge variant="secondary" className="gap-1">
              On Sale
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => updateFilters({ onSale: false })}
              />
            </Badge>
          )}
          {!filters.inStock && (
            <Badge variant="secondary" className="gap-1">
              Include Out of Stock
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => updateFilters({ inStock: true })}
              />
            </Badge>
          )}
          {filters.rating > 0 && (
            <Badge variant="secondary" className="gap-1">
              {filters.rating}+ Stars
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => updateFilters({ rating: 0 })}
              />
            </Badge>
          )}
          {filters.brands.map((brand) => (
            <Badge key={brand} variant="secondary" className="gap-1">
              {brand}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeBrand(brand)}
              />
            </Badge>
          ))}
        </div>
      )}

      {/* Advanced Filters */}
      {isFilterOpen && (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Categories */}
              <div>
                <Collapsible open={categoryOpen} onOpenChange={setCategoryOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full mb-3">
                    <h4 className="font-medium">Categories</h4>
                    {categoryOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2">
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="all-categories"
                          checked={!filters.category}
                          onCheckedChange={() => updateFilters({ category: "" })}
                        />
                        <Label htmlFor="all-categories" className="cursor-pointer">
                          All Categories
                        </Label>
                      </div>
                      {categories.map((category) => (
                        <div key={category.name} className="flex items-center space-x-2">
                          <Checkbox
                            id={`category-${category.name}`}
                            checked={filters.category === category.name}
                            onCheckedChange={() => updateFilters({ 
                              category: filters.category === category.name ? "" : category.name 
                            })}
                          />
                          <Label htmlFor={`category-${category.name}`} className="cursor-pointer flex-1">
                            <div className="flex justify-between">
                              <span>{category.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {category.count}
                              </span>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* Price Range */}
              <div>
                <Collapsible open={priceOpen} onOpenChange={setPriceOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full mb-3">
                    <h4 className="font-medium">Price Range</h4>
                    {priceOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4">
                    <Slider
                      value={filters.priceRange}
                      onValueChange={(value) => updateFilters({ priceRange: value as [number, number] })}
                      max={1000}
                      min={0}
                      step={10}
                      className="w-full"
                    />
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>${filters.priceRange[0]}</span>
                      <span>${filters.priceRange[1]}</span>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* Brands */}
              <div>
                <Collapsible open={brandOpen} onOpenChange={setBrandOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full mb-3">
                    <h4 className="font-medium">Brands</h4>
                    {brandOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2">
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {popularBrands.map((brand) => (
                        <div key={brand} className="flex items-center space-x-2">
                          <Checkbox
                            id={`brand-${brand}`}
                            checked={filters.brands.includes(brand)}
                            onCheckedChange={(checked) => handleBrandChange(brand, !!checked)}
                          />
                          <Label htmlFor={`brand-${brand}`} className="cursor-pointer">
                            {brand}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* Other Filters */}
              <div>
                <h4 className="font-medium mb-3">Other Filters</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="in-stock"
                      checked={filters.inStock}
                      onCheckedChange={(checked) => updateFilters({ inStock: !!checked })}
                    />
                    <Label htmlFor="in-stock" className="cursor-pointer">
                      In Stock Only
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="on-sale"
                      checked={filters.onSale}
                      onCheckedChange={(checked) => updateFilters({ onSale: !!checked })}
                    />
                    <Label htmlFor="on-sale" className="cursor-pointer">
                      On Sale
                    </Label>
                  </div>

                  <Collapsible open={ratingOpen} onOpenChange={setRatingOpen}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full">
                      <span className="font-medium">Rating</span>
                      {ratingOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 space-y-2">
                      {[4, 3, 2, 1].map((rating) => (
                        <div key={rating} className="flex items-center space-x-2">
                          <Checkbox
                            id={`rating-${rating}`}
                            checked={filters.rating === rating}
                            onCheckedChange={() => updateFilters({ 
                              rating: filters.rating === rating ? 0 : rating 
                            })}
                          />
                          <Label htmlFor={`rating-${rating}`} className="cursor-pointer">
                            {rating}+ Stars
                          </Label>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
