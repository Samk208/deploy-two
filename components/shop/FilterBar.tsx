"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { SORT_OPTIONS } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  Filter,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Props = {
  total?: number;
};

const POPULAR_CATEGORIES = [
  "Electronics",
  "Clothing",
  "Books",
  "Home & Garden",
  "Beauty",
  "Sports",
];

const POPULAR_BRANDS = ["Apple", "Samsung", "Nike", "Adidas", "Sony", "LG"];

export default function FilterBar({ total }: Props) {
  const router = useRouter();
  const sp = useSearchParams();

  const [q, setQ] = useState(sp.get("q") ?? "");
  const [sort, setSort] = useState(sp.get("sort") ?? "new");
  const [category, setCategory] = useState(sp.get("category") ?? "");
  const [brand, setBrand] = useState(sp.get("brand") ?? "");
  const [minPrice, setMinPrice] = useState(sp.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(sp.get("maxPrice") ?? "");
  const [priceRange, setPriceRange] = useState([
    parseInt(sp.get("minPrice") ?? "0"),
    parseInt(sp.get("maxPrice") ?? "1000"),
  ]);
  const [inStockOnly, setInStockOnly] = useState(
    (sp.get("inStockOnly") ?? "true") === "true"
  );
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState("");

  // Track active filters for display
  const activeFilters = useMemo(() => {
    const filters = [];
    if (q) filters.push({ key: "search", label: `Search: "${q}"`, value: q });
    if (category)
      filters.push({
        key: "category",
        label: `Category: ${category}`,
        value: category,
      });
    if (brand)
      filters.push({ key: "brand", label: `Brand: ${brand}`, value: brand });
    if (minPrice)
      filters.push({
        key: "minPrice",
        label: `Min: $${minPrice}`,
        value: minPrice,
      });
    if (maxPrice)
      filters.push({
        key: "maxPrice",
        label: `Max: $${maxPrice}`,
        value: maxPrice,
      });
    if (!inStockOnly)
      filters.push({
        key: "inStockOnly",
        label: "Show out of stock",
        value: "false",
      });
    return filters;
  }, [q, category, brand, minPrice, maxPrice, inStockOnly]);

  // Enhanced debounced search with better UX
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(sp.toString());
      if (q.trim()) {
        params.set("q", q.trim());
      } else {
        params.delete("q");
      }
      params.set("page", "1");
      router.push(`/shop?${params.toString()}`);
    }, 400); // Slightly longer delay for better UX
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Update price range when individual price inputs change
  useEffect(() => {
    const min = parseInt(minPrice) || 0;
    const max = parseInt(maxPrice) || 1000;
    setPriceRange([min, max]);
  }, [minPrice, maxPrice]);

  function applyFilters() {
    const params = new URLSearchParams(sp.toString());
    function setOrDel(k: string, v: string) {
      if (v && v.trim()) {
        params.set(k, v.trim());
      } else {
        params.delete(k);
      }
    }
    setOrDel("sort", sort);
    setOrDel("category", category);
    setOrDel("brand", brand);
    setOrDel("minPrice", minPrice);
    setOrDel("maxPrice", maxPrice);
    params.set("inStockOnly", String(inStockOnly));
    params.set("page", "1");
    router.push(`/shop?${params.toString()}`);
  }

  function clearAllFilters() {
    setQ("");
    setSort("new");
    setCategory("");
    setBrand("");
    setMinPrice("");
    setMaxPrice("");
    setPriceRange([0, 1000]);
    setInStockOnly(true);
    router.push("/shop");
  }

  function removeFilter(filterKey: string) {
    const params = new URLSearchParams(sp.toString());
    switch (filterKey) {
      case "search":
        setQ("");
        params.delete("q");
        break;
      case "category":
        setCategory("");
        params.delete("category");
        break;
      case "brand":
        setBrand("");
        params.delete("brand");
        break;
      case "minPrice":
        setMinPrice("");
        params.delete("minPrice");
        break;
      case "maxPrice":
        setMaxPrice("");
        params.delete("maxPrice");
        break;
      case "inStockOnly":
        setInStockOnly(true);
        params.set("inStockOnly", "true");
        break;
    }
    params.set("page", "1");
    router.push(`/shop?${params.toString()}`);
  }

  function handlePriceRangeChange(values: number[]) {
    setPriceRange(values);
    setMinPrice(values[0].toString());
    setMaxPrice(values[1].toString());
  }

  function applyQuickFilter(type: string, value: string) {
    if (type === "category") {
      setCategory(value);
    } else if (type === "brand") {
      setBrand(value);
    }
    // Auto-apply the filter
    setTimeout(applyFilters, 100);
  }

  const countText = useMemo(() => {
    if (typeof total === "number") {
      return `${total.toLocaleString()} ${total === 1 ? "product" : "products"}`;
    }
    return "";
  }, [total]);

  return (
    <div className="space-y-4">
      {/* Main Filter Bar */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          {/* Primary Row */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Search */}
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-10 pr-4"
              />
              {q && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setQ("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium whitespace-nowrap">
                Sort by:
              </Label>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-40">
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

            {/* Advanced Filters Toggle */}
            <Button
              variant="outline"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="flex items-center gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilters.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFilters.length}
                </Badge>
              )}
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  isAdvancedOpen && "rotate-180"
                )}
              />
            </Button>

            {/* Results Count */}
            {countText && (
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {countText}
              </div>
            )}
          </div>

          {/* Advanced Filters */}
          <Collapsible open={isAdvancedOpen}>
            <CollapsibleContent className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Category Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All categories</SelectItem>
                      {POPULAR_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Brand Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Brand</Label>
                  <Select value={brand} onValueChange={setBrand}>
                    <SelectTrigger>
                      <SelectValue placeholder="All brands" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All brands</SelectItem>
                      {POPULAR_BRANDS.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Price Range</Label>
                  <div className="px-2">
                    <Slider
                      value={priceRange}
                      onValueChange={handlePriceRangeChange}
                      max={1000}
                      min={0}
                      step={10}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>${priceRange[0]}</span>
                      <span>${priceRange[1]}</span>
                    </div>
                  </div>
                </div>

                {/* Stock Status */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Availability</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="inStock"
                      checked={inStockOnly}
                      onCheckedChange={(checked) =>
                        setInStockOnly(Boolean(checked))
                      }
                    />
                    <Label htmlFor="inStock" className="text-sm">
                      In stock only
                    </Label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-4">
                <Button
                  onClick={applyFilters}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Apply Filters
                </Button>
                <Button variant="outline" onClick={clearAllFilters}>
                  Clear All
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-gray-700">
            Active filters:
          </span>
          {activeFilters.map((filter) => (
            <Badge
              key={filter.key}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              {filter.label}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-gray-200"
                onClick={() => removeFilter(filter.key)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Quick Filter Suggestions */}
      {!isAdvancedOpen && activeFilters.length === 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-600">Popular categories:</span>
            {POPULAR_CATEGORIES.slice(0, 4).map((cat) => (
              <Button
                key={cat}
                variant="outline"
                size="sm"
                onClick={() => applyQuickFilter("category", cat)}
                className="text-xs"
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
