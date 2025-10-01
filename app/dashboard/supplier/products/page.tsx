"use client";

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
import { getProducts } from "@/lib/api/client";
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

  const fetchProducts = async (nextPage: number = 1) => {
    setIsLoading(true);
    try {
      const resp = await getProducts<Product>({
        owner: "supplier",
        page: nextPage,
        pageSize: 10,
        region: regionFilter !== "ALL" ? regionFilter : undefined,
      });
      const data = (resp as any).data || (resp as any).products || [];
      setProducts(data);
      setPage(nextPage);
      const total = (resp as any).total ?? (resp as any).totalCount ?? 0;
      const size = resp.pageSize ?? 10;
      setPageCount(Math.max(1, Math.ceil(total / size)));
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

  useEffect(() => {
    if (!isAuthLoading && user?.role === "supplier") {
      fetchProducts(1);
    }
  }, [isAuthLoading, user, regionFilter]);

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
        <h1 className="text-2xl font-bold">My Products</h1>
        <div className="flex gap-2 items-center">
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="w-36" data-testid="region-filter">
              <SelectValue placeholder="All Regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Regions</SelectItem>
              <SelectItem value="KR">KR</SelectItem>
              <SelectItem value="JP">JP</SelectItem>
              <SelectItem value="CN">CN</SelectItem>
              <SelectItem value="Global">Global</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => fetchProducts(1)}
            data-testid="apply-filters"
          >
            Apply
          </Button>
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
        isServerMode
        page={page}
        pageCount={pageCount}
        onPageChange={(p) => fetchProducts(p)}
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
  );
}
