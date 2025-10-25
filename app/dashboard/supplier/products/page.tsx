"use client";

import { TranslatedText } from "@/components/global/TranslatedText";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getProducts, PAGE_SIZE } from "@/lib/api/client";
import { useAuth } from "@/lib/auth-context";
import { Product } from "@/lib/types";
import { Download, PlusCircle, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { columns } from "./columns";
import { ExportProductsDrawer } from "./components/ExportProductsDrawer";
import { ImportProductsDialog } from "./components/ImportProductsDialog";
import { DataTable } from "./data-table";

// Add a new interface for our page's meta data
export interface ProductPageMeta {
  deleteProduct: (productId: string) => void;
}

export default function SupplierProductsPage() {
  const { user, loading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState<number>(1);
  const [pageCount, setPageCount] = useState<number>(1);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDrawer, setShowExportDrawer] = useState(false);
  const [regionFilter, setRegionFilter] = useState<string>("ALL");

  const ownerParam = user?.role === "admin" ? "admin" : "supplier";

  const fetchProducts = async (nextPage: number = 1) => {
    setIsLoading(true);
    try {
      const resp = await getProducts<Product>({
        owner: ownerParam,
        page: nextPage,
        pageSize: PAGE_SIZE,
        region: regionFilter !== "ALL" ? regionFilter : undefined,
      });
      setProducts(resp.items);
      setPage(nextPage);
      setPageCount(Math.max(1, Math.ceil(resp.total / resp.pageSize)));
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Could not fetch your products.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete product");
      }

      setProducts((prev) => prev.filter((p) => p.id !== productId));
      toast({ title: "Success", description: "Product deleted successfully." });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to delete product.",
        variant: "destructive",
      });
    }
  };

  const handleImportSuccess = () => {
    fetchProducts(page);
    setShowImportDialog(false);
    toast({ title: "Success", description: "Products imported successfully." });
  };

  // Initial load: allow both supplier and admin to view supplier products list (read-only for admin)
  useEffect(() => {
    if (isAuthLoading) return;
    if (user) {
      // suppliers and admins can view
      fetchProducts(1);
    } else {
      // no user -> clear loader to avoid blank screen
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthLoading, user?.id, user?.role]);

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
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          <TranslatedText>My Products</TranslatedText>
        </h1>
        <div className="flex gap-2 items-center">
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="w-36" data-testid="region-filter">
              <SelectValue placeholder="All Regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">
                <TranslatedText>All Regions</TranslatedText>
              </SelectItem>
              <SelectItem value="KR">KR</SelectItem>
              <SelectItem value="JP">JP</SelectItem>
              <SelectItem value="CN">CN</SelectItem>
              <SelectItem value="Global">
                <TranslatedText>Global</TranslatedText>
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => fetchProducts(1)}
            data-testid="apply-filters"
          >
            <TranslatedText>Apply</TranslatedText>
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowImportDialog(true)}
            data-testid="open-import-dialog"
          >
            <Upload className="mr-2 h-4 w-4" />
            <TranslatedText>Import</TranslatedText>
          </Button>
          <Button variant="outline" onClick={() => setShowExportDrawer(true)}>
            <Download className="mr-2 h-4 w-4" />
            <TranslatedText>Export</TranslatedText>
          </Button>
          <Link href="/dashboard/supplier/products/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              <TranslatedText>Add Product</TranslatedText>
            </Button>
          </Link>
        </div>
      </div>

      {/* Empty state when no products */}
      {products.length === 0 ? (
        <div
          className="border rounded-md p-8 text-center text-gray-600"
          data-testid="empty-products"
        >
          <p className="mb-4">
            <TranslatedText>No products yet.</TranslatedText>
          </p>
          <Link href="/dashboard/supplier/products/new" className="inline-flex">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              <TranslatedText>Create your first product</TranslatedText>
            </Button>
          </Link>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={products}
          isServerMode
          page={page}
          pageCount={pageCount}
          onPageChange={(p) => fetchProducts(p)}
        />
      )}

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
  );
}
