"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function TestProducts() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [count, setCount] = useState(0)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error, count } = await supabase
          .from('products')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })

        if (error) throw error
        
        setProducts(data || [])
        setCount(count || 0)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch products')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Products Test</h1>
      <p className="mb-2 font-semibold">Total products in database: {count}</p>
      {error && <p className="text-red-500">Error: {error}</p>}
      {products && (
        <div className="space-y-4">
          {products.map((product) => (
            <div key={product.id} className="border p-4 rounded bg-gray-50">
              <h3 className="font-bold text-lg">{product.title}</h3>
              <p>Price: ${product.price}</p>
              <p>In Stock: {product.in_stock ? 'Yes' : 'No'}</p>
              <p>Active: {product.active ? 'Yes' : 'No'}</p>
              <p>Category: {product.category || 'None'}</p>
              <p>Stock Count: {product.stock_count || 0}</p>
              <div className="mt-2">
                <p className="font-semibold">Images:</p>
                <pre className="bg-gray-200 p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(product.images, null, 2)}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
