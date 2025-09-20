'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { PlusCircle, Upload, Download } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { Product, PaginatedResponse } from '@/lib/types'
import { columns } from './columns'
import { DataTable } from './data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { ImportProductsDialog } from './components/ImportProductsDialog'
import { ExportProductsDrawer } from './components/ExportProductsDrawer'

// Add a new interface for our page's meta data
export interface ProductPageMeta {
  deleteProduct: (productId: string) => void;
}

export default function SupplierProductsPage() {
  const { user, loading: isAuthLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showExportDrawer, setShowExportDrawer] = useState(false)

  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/products?owner=supplier')

      if (response.status === 401 || response.status === 403) {
        router.push('/sign-in')
        toast({ title: 'Unauthorized', description: 'You do not have permission to access this page.', variant: 'destructive' })
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }

      const result: PaginatedResponse<Product> = await response.json()
      setProducts(result.data || [])
    } catch (error) {
      console.error(error)
      toast({ title: 'Error', description: 'Could not fetch your products.', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const deleteProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete product')
      }

      setProducts(prev => prev.filter(p => p.id !== productId))
      toast({ title: 'Success', description: 'Product deleted successfully.' })
    } catch (error) {
      console.error(error)
      toast({ title: 'Error', description: 'Failed to delete product.', variant: 'destructive' })
    }
  }

  const handleImportSuccess = () => {
    fetchProducts()
    setShowImportDialog(false)
    toast({ title: 'Success', description: 'Products imported successfully.' })
  }

  useEffect(() => {
    if (!isAuthLoading && user?.role === 'supplier') {
      fetchProducts()
    }
  }, [isAuthLoading, user])

  if (isAuthLoading || isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Products</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" onClick={() => setShowExportDrawer(true)}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Link href="/dashboard/supplier/products/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={products}
      />

      {/* Import Dialog */}
      <ImportProductsDialog 
        open={showImportDialog} 
        onOpenChange={setShowImportDialog}
        onSuccess={handleImportSuccess}
      />

      {/* Export Drawer */}
      <ExportProductsDrawer 
        open={showExportDrawer} 
        onOpenChange={setShowExportDrawer}
        products={products}
      />
    </div>
  )
}
