"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useProducts } from "@/hooks/use-products"
import { useCartStore, type CartItem } from "@/lib/store/cart"
import { ProductCard } from "@/components/shop/product-card"
import { EnhancedProductCard } from "@/components/shop/enhanced-product-card"
import { ProductFilters, type ProductFilters as ProductFiltersType } from "@/components/shop/product-filters"
import { EnhancedProductFilters } from "@/components/shop/enhanced-product-filters"
import { CartSidebar } from "@/components/shop/cart-sidebar"
import { QuickViewModal } from "@/components/shop/quick-view-modal"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { 
  ShoppingCart, 
  ArrowRight, 
  TrendingUp, 
  Users, 
  Star,
  Filter,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function EnhancedShopPage() {
  const [filters, setFilters] = useState<ProductFiltersType>({
    search: "",
    category: "",
    priceRange: [0, 1000],
    inStock: true,
    onSale: false,
    rating: 0,
    sortBy: "newest",
    brands: []
  })
  
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [currentPage, setCurrentPage] = useState(1)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [quickViewProduct, setQuickViewProduct] = useState<any>(null)
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)
  
  // Temporary direct product fetching to test
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  
  const { getTotalItems, addItem } = useCartStore()

  // Add to cart function
  const addToCart = (product: any) => {
    const cartItem: Omit<CartItem, 'quantity'> & { quantity?: number } = {
      id: product.id,
      title: product.title,
      price: product.price,
      originalPrice: product.original_price,
      image: product.images?.[0] || '/placeholder.svg',
      category: product.category,
      supplierId: product.supplier_id || '',
      supplierName: product.supplier?.name || 'Unknown Supplier',
      supplierVerified: product.supplier?.verified || false,
      maxQuantity: product.stock_count || 10,
      quantity: 1
    }
    
    addItem(cartItem)
    toast.success(`${product.title} added to cart!`)
  }

  // Fetch products directly using the configured client
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const { supabase } = await import('@/lib/supabase/client')
        
        const { data, error, count } = await supabase
          .from('products')
          .select('*', { count: 'exact' })
          .eq('active', true)
          .eq('in_stock', true)
          .order('created_at', { ascending: false })
          .limit(12)
        
        if (error) throw error
        
        // Ensure totalCount is set correctly from the count response
        console.log('Direct fetch successful:', { data: data?.length, count })
        console.log('Setting products:', data)
        setProducts(data || [])
        setTotalCount(count || 0)
        setHasMore((data?.length || 0) === 12)
        console.log('State updated, products length:', data?.length)
      } catch (err) {
        // Reset count on error to maintain consistency
        console.error('Direct fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch products')
        setProducts([])
        setTotalCount(0)
      } finally {
        setLoading(false)
      }
      // Ensure totalCount is always consistent with actual data
    }
    
    fetchProducts()
  }, [filters.category, filters.search])

  // Transform products to match ProductCard interface
  const transformProduct = (product: any) => ({
    id: product.id,
    title: product.title,
    description: product.description,
    price: product.price,
    originalPrice: product.original_price,
    images: product.images || ['/placeholder.svg'],
    category: product.category,
    tags: product.region || [], // Use region as tags for now
    stock_count: product.stock_count || 0,
    in_stock: product.in_stock || false,
    active: product.active || true,
    rating: 4.5, // Default rating
    review_count: Math.floor(Math.random() * 100) + 10, // Random review count
    supplier: {
      id: product.supplier_id || '',
      name: 'TechGear Supplier', // Default supplier name for now
      verified: true,
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    }
  })

  const transformedProducts = products.map(transformProduct)
  
  // Debug logging
  console.log('Current state:', { products: products.length, transformedProducts: transformedProducts.length, loading, totalCount })

  const handleFiltersChange = (newFilters: ProductFiltersType) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset pagination when filters change
  }

  const handleLoadMore = () => {
    // TODO: Implement load more functionality
    console.log('Load more clicked')
  }
  
  const refetch = () => {
    // TODO: Implement refetch functionality
    console.log('Refetch clicked')
  }
  
  const fetchMore = () => {
    // TODO: Implement fetch more functionality
    console.log('Fetch more clicked')
  }

  const handleQuickView = (product: any) => {
    setQuickViewProduct(product)
    setIsQuickViewOpen(true)
  }

  const closeQuickView = () => {
    setIsQuickViewOpen(false)
    setQuickViewProduct(null)
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-red-600">Error Loading Products</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            
            <div className="flex flex-col gap-2">
              <Button onClick={refetch} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
              <ShoppingCart className="w-3 h-3 mr-1" />
              Shop from verified creators
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Discover Amazing
              <span className="text-indigo-600"> Products</span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Browse thousands of handpicked products from creators and suppliers you trust. 
              Find exactly what you're looking for with our advanced filters.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{totalCount.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Products</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">500+</div>
                <div className="text-sm text-gray-600">Brands</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">50+</div>
                <div className="text-sm text-gray-600">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">4.8</div>
                <div className="text-sm text-gray-600">Avg Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-8">
              <EnhancedProductFilters
                onFiltersChange={handleFiltersChange}
                totalProducts={totalCount}
              />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Mobile Filter Button */}
            <div className="lg:hidden mb-6">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full justify-center">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters & Sort
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full sm:w-96">
                  <EnhancedProductFilters
                    onFiltersChange={handleFiltersChange}
                    totalProducts={totalCount}
                    className="h-full overflow-y-auto"
                  />
                </SheetContent>
              </Sheet>
            </div>

            {/* Products Grid/List */}
            <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded">
              <p>Debug: Loading: {loading.toString()}</p>
              <p>Debug: Products: {products.length}</p>
              <p>Debug: Transformed: {transformedProducts.length}</p>
              <p>Debug: Total: {totalCount}</p>
            </div>
            
            {loading && <ProductGridSkeleton />}
            
            {/* View Mode Toggle - Enhanced */}
            {!loading && (
              <div className="flex justify-between items-center mb-6">
                <div className="text-sm text-gray-600">
                  Showing {transformedProducts.length} of {totalCount} products
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border rounded-lg p-1">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="h-8 px-3"
                    >
                      <Grid className="h-4 w-4 mr-1" />
                      Grid
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="h-8 px-3"
                    >
                      <List className="h-4 w-4 mr-1" />
                      List
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Products Display */}
            {!loading && transformedProducts.length > 0 && (
              <div className={cn(
                "grid gap-6 mb-12",
                viewMode === "grid" 
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3" 
                  : "grid-cols-1"
              )}>
                {transformedProducts.map((product) => (
                  <EnhancedProductCard
                    key={product.id}
                    product={product}
                    size={viewMode === "list" ? "lg" : "md"}
                    showSupplier={true}
                    onQuickView={handleQuickView}
                    onAddToCart={addToCart}
                  />
                ))}
              </div>
            )}

            {/* Load More / Pagination */}
            {!loading && hasMore && (
              <div className="text-center">
                <Button
                  onClick={handleLoadMore}
                  disabled={loading}
                  size="lg"
                  variant="outline"
                  className="min-w-[200px]"
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Load More Products
                </Button>
              </div>
            )}

            {/* No Results */}
            {!loading && transformedProducts.length === 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <ShoppingCart className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  No products found
                </h3>
                <p className="text-gray-600 mb-8">
                  {totalCount === 0 
                    ? "No products have been added to the database yet." 
                    : "Try adjusting your filters or search terms to find what you're looking for."
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={() => handleFiltersChange({
                    search: "",
                    category: "",
                    priceRange: [0, 1000],
                    inStock: true,
                    onSale: false,
                    rating: 0,
                    sortBy: "newest",
                    brands: []
                  })}>
                    Clear All Filters
                  </Button>
                  
                  {totalCount === 0 && (
                    <Button variant="outline" asChild>
                      <Link href="/dashboard/supplier">
                        Add Products
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Enhanced Floating Cart Button - Mobile */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              size="lg"
              className={cn(
                "fixed bottom-6 right-6 z-50 shadow-lg rounded-full h-16 w-16 p-0",
                "bg-indigo-600 hover:bg-indigo-700 transition-all duration-300",
                getTotalItems() > 0 && "animate-pulse scale-110"
              )}
            >
              <ShoppingCart className="h-6 w-6" />
              {getTotalItems() > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white min-w-[24px] h-6 rounded-full text-xs flex items-center justify-center font-bold">
                  {getTotalItems()}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-96 p-0">
            <CartSidebar />
          </SheetContent>
        </Sheet>
      </div>

      {/* Enhanced Desktop Cart Sidebar */}
      <div className="hidden lg:block">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="lg"
              className={cn(
                "fixed top-1/2 right-0 -translate-y-1/2 z-50 rounded-l-lg rounded-r-none",
                "shadow-lg bg-white border-r-0 pr-3 pl-4 transition-all duration-300",
                getTotalItems() > 0 && "bg-indigo-50 border-indigo-200"
              )}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              <span className="font-semibold">{getTotalItems()}</span>
              {getTotalItems() > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  !
                </div>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-96 p-0">
            <CartSidebar />
          </SheetContent>
        </Sheet>
      </div>

      {/* Enhanced CTA Section */}
      <section className="py-16 bg-gradient-to-br from-indigo-600 to-purple-700 mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6">
              Ready to Start Selling?
            </h2>
            <p className="text-xl text-indigo-100 mb-8">
              Join thousands of creators and suppliers earning with our platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-50" asChild>
                <Link href="/sign-up?type=creator">
                  Become a Creator
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-indigo-600"
                asChild
              >
                <Link href="/sign-up?type=supplier">List Your Products</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={isQuickViewOpen}
        onClose={closeQuickView}
        onAddToCart={addToCart}
      />
    </div>
  )
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="h-64 w-full" />
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
