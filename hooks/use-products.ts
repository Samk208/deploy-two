import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client' // Direct client import to avoid server bundling
import type { Product } from '@/lib/types'

interface UseProductsParams {
  category?: string
  search?: string
  supplierId?: string
  limit?: number
  page?: number
}

interface UseProductsReturn {
  products: Product[]
  loading: boolean
  error: string | null
  hasMore: boolean
  totalCount: number
  refetch: () => void
  fetchMore: () => void
}

export function useProducts(params: UseProductsParams = {}): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  const { category, search, supplierId, limit = 12 } = params

  const fetchProducts = async (page: number = 1, append: boolean = false) => {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching products with params:', { page, append, category, search, supplierId, limit })

      const offset = (page - 1) * limit

      // SIMPLIFIED QUERY - No user join to avoid recursion
      let query = supabase
        .from('products')
        .select(`
          *
        `, { count: 'exact' })
        .eq('active', true)
        .or('in_stock.eq.true,stock_count.gt.0')
        .order('created_at', { ascending: false })

      // Apply filters
      if (category) {
        query = query.eq('category', category)
      }
      if (supplierId) {
        query = query.eq('supplier_id', supplierId)
      }
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1)

      console.log('Executing simplified query...')
      const { data, error, count } = await query
      // Temporary debug log for investigations
      console.log('DBG_products', { error, len: data?.length, sample: data?.slice(0, 2) })

      if (error) {
        console.error('Supabase query error:', error)
        throw new Error(`Query failed: ${error.message}`)
      }

      console.log('Query successful:', { data: data?.length, count })

      const newProducts = data || []
      
      if (append) {
        setProducts(prev => [...prev, ...newProducts])
      } else {
        setProducts(newProducts)
      }

      setTotalCount(count || 0)
      setHasMore(newProducts.length === limit && (offset + limit) < (count || 0))
      setCurrentPage(page)
      
      console.log('Products state updated:', { 
        productsCount: newProducts.length, 
        totalCount: count,
        hasMore: newProducts.length === limit && (offset + limit) < (count || 0)
      })

    } catch (err) {
      console.error('Error fetching products:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products'
      setError(errorMessage)
      toast.error('Failed to load products: ' + errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const refetch = () => {
    setCurrentPage(1)
    fetchProducts(1, false)
  }

  const fetchMore = () => {
    if (hasMore && !loading) {
      fetchProducts(currentPage + 1, true)
    }
  }

  useEffect(() => {
    fetchProducts(1, false)
  }, [category, search, supplierId, limit])

  return {
    products,
    loading,
    error,
    hasMore,
    totalCount,
    refetch,
    fetchMore
  }
}

export function useProduct(productId: string | null) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!productId) {
      setProduct(null)
      setLoading(false)
      return
    }

    const fetchProduct = async () => {
      try {
        setLoading(true)
        setError(null)

        // Simplified query without user join
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .eq('active', true)
          .or('in_stock.eq.true,stock_count.gt.0')
          .maybeSingle()
        
        if (error) throw error
        setProduct(data || null)
      } catch (err) {
        console.error('Error fetching product:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch product')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId])

  return { product, loading, error }
}

export function useCategories() {
  const [categories, setCategories] = useState<Array<{ name: string; count: number }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('category, in_stock, stock_count')
          .eq('active', true)
          .or('in_stock.eq.true,stock_count.gt.0')

        if (error) throw error

        // Count categories with proper type checking
        const categoryCount = (data || []).reduce((acc: Record<string, number>, item: any) => {
          if (item && item.category) {
            acc[item.category] = (acc[item.category] || 0) + 1
          }
          return acc
        }, {})

        const sortedCategories = Object.entries(categoryCount)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)

        setCategories(sortedCategories)
      } catch (err) {
        console.error('Error fetching categories:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  return { categories, loading }
}
