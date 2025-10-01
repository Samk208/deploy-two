"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import {
  BarChart3,
  DollarSign,
  Edit,
  Eye,
  EyeOff,
  GripVertical,
  Percent,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface AvailableProduct {
  id: string;
  title: string;
  basePrice: number;
  commission: number;
  image: string;
  category: string;
  region: string[];
  supplier: string;
  inStock: boolean;
  stockCount: number;
}

interface ShopProduct {
  id: string;
  productId: string;
  title: string;
  customTitle?: string;
  customDescription?: string;
  basePrice: number;
  salePrice: number;
  commission: number;
  expectedCommission: number;
  image: string;
  category: string;
  region: string[];
  supplier: string;
  inStock: boolean;
  stockCount: number;
  published: boolean;
  order: number;
}

export default function MyShopBuilder() {
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    region: "",
    supplier: "",
    minPrice: 0,
    maxPrice: 1000,
  });
  const [shopProducts, setShopProducts] = useState<ShopProduct[]>([]);
  const [availableProducts, setAvailableProducts] = useState<
    AvailableProduct[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ShopProduct | null>(
    null
  );
  const [processing, setProcessing] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [bulkAction, setBulkAction] = useState<
    "publish" | "unpublish" | "delete" | null
  >(null);

  // Fetch shop data
  const fetchShopData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.search) params.append("search", filters.search);
      if (filters.category) params.append("category", filters.category);
      if (filters.region) params.append("region", filters.region);
      if (filters.supplier) params.append("supplier", filters.supplier);
      if (filters.minPrice > 0)
        params.append("minPrice", filters.minPrice.toString());
      if (filters.maxPrice < 1000)
        params.append("maxPrice", filters.maxPrice.toString());

      const response = await fetch(`/api/influencer/shop?${params}`);
      const result = await response.json();

      if (result.ok) {
        setShopProducts(result.data.shopProducts);
        setAvailableProducts(result.data.availableProducts);
        setError(null);
      } else {
        setError(result.error || "Failed to fetch shop data");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopData();
  }, [filters]);

  // Add product to shop
  const addToShop = async (product: AvailableProduct) => {
    try {
      const response = await fetch("/api/influencer/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          salePrice: product.basePrice,
        }),
      });

      const result = await response.json();
      if (result.ok) {
        toast.success("Product added to your shop!");
        fetchShopData();
      } else {
        toast.error(result.error || "Failed to add product");
      }
    } catch (err) {
      toast.error("Network error occurred");
    }
  };

  // Update shop product
  const updateShopProduct = async (
    productId: string,
    updates: Partial<ShopProduct>
  ) => {
    try {
      const response = await fetch(`/api/influencer/shop/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const result = await response.json();
      if (result.ok) {
        toast.success("Product updated successfully!");
        fetchShopData();
        setEditingProduct(null);
      } else {
        toast.error(result.error || "Failed to update product");
      }
    } catch (err) {
      toast.error("Network error occurred");
    }
  };

  // Remove from shop
  const removeFromShop = async (productId: string) => {
    try {
      const response = await fetch(`/api/influencer/shop/${productId}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (result.ok) {
        toast.success("Product removed from shop!");
        fetchShopData();
      } else {
        toast.error(result.error || "Failed to remove product");
      }
    } catch (err) {
      toast.error("Network error occurred");
    }
  };

  // Handle drag and drop reordering
  const handleDragEnd = (result: {
    destination?: { index: number } | null;
    source: { index: number };
  }) => {
    if (!result.destination) return;

    const items = Array.from(shopProducts);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update display orders
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index,
    }));

    setShopProducts(updatedItems);

    // Update in backend
    updatedItems.forEach((item, index) => {
      if (item.order !== index) {
        updateShopProduct(item.id, { order: index });
      }
    });
  };

  // Get unique values for filters
  useEffect(() => {
    const categories = [...new Set(availableProducts.map((p) => p.category))];
    const regions = [...new Set(availableProducts.flatMap((p) => p.region))];
    const suppliers = [...new Set(availableProducts.map((p) => p.supplier))];
    setCategories(categories);
    setRegions(regions);
    setSuppliers(suppliers);
  }, [availableProducts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-white p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">My Shop Builder</h1>
            <p className="text-gray-600">
              Curate products for your shop and set custom pricing
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowAnalytics(!showAnalytics)}
              variant="outline"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              {showAnalytics ? "Hide Analytics" : "Show Analytics"}
            </Button>
            <Button onClick={fetchShopData} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedProducts.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">
              {selectedProducts.length} product
              {selectedProducts.length > 1 ? "s" : ""} selected
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBulkAction("publish")}
              >
                Publish Selected
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBulkAction("unpublish")}
              >
                Unpublish Selected
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setBulkAction("delete")}
              >
                Remove Selected
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedProducts([])}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        )}

        {/* Analytics Panel */}
        {showAnalytics && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {shopProducts.length}
                </div>
                <p className="text-sm text-gray-600">Products in Shop</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {shopProducts.filter((p) => p.published).length}
                </div>
                <p className="text-sm text-gray-600">Published</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-600">
                  $
                  {shopProducts
                    .reduce((sum, p) => sum + (p.salePrice || 0), 0)
                    .toFixed(2)}
                </div>
                <p className="text-sm text-gray-600">Total Value</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(
                    shopProducts.reduce(
                      (sum, p) => sum + (p.salePrice || 0),
                      0
                    ) / shopProducts.length || 0
                  )}
                </div>
                <p className="text-sm text-gray-600">Avg. Price</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane - Available Products */}
        <div className="w-1/2 border-r bg-gray-50 flex flex-col">
          <div className="p-4 border-b bg-white">
            <h2 className="text-lg font-semibold mb-4">Available Products</h2>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={filters.search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-3 gap-2">
                <Select
                  value={filters.category || "ALL"}
                  onValueChange={(value: string) =>
                    setFilters({
                      ...filters,
                      category: value === "ALL" ? "" : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.region || "ALL"}
                  onValueChange={(value: string) =>
                    setFilters({
                      ...filters,
                      region: value === "ALL" ? "" : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Regions</SelectItem>
                    {regions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.supplier || "ALL"}
                  onValueChange={(value: string) =>
                    setFilters({
                      ...filters,
                      supplier: value === "ALL" ? "" : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Suppliers</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier} value={supplier}>
                        {supplier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div className="flex gap-2 mt-4">
                <Input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFilters({
                      ...filters,
                      minPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="Min Price"
                />
                <Input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFilters({
                      ...filters,
                      maxPrice: parseFloat(e.target.value) || 1000,
                    })
                  }
                  placeholder="Max Price"
                />
              </div>
            </div>

            {/* Available Products List */}
            <div className="space-y-3">
              {availableProducts.map((product: AvailableProduct) => (
                <Card
                  key={product.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">
                          {product.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {product.supplier}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">{product.category}</Badge>
                          <Badge variant="outline">
                            <Percent className="w-3 h-3 mr-1" />
                            {product.commission}%
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="font-semibold">
                            ${product.basePrice}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => addToShop(product)}
                            disabled={!product.inStock}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Right Pane - My Shop */}
        <div className="w-1/2 flex flex-col">
          <div className="p-4 border-b bg-white">
            <h2 className="text-lg font-semibold">
              My Shop ({shopProducts.length} products)
            </h2>
            <p className="text-sm text-gray-600">
              Drag to reorder, click to edit
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="shop-products">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-3"
                  >
                    {shopProducts.map((product, index) => (
                      <Draggable
                        key={product.id}
                        draggableId={product.id}
                        index={index}
                      >
                        {(provided) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="hover:shadow-md transition-shadow"
                          >
                            <CardContent className="p-4">
                              <div className="flex gap-3">
                                <div
                                  {...provided.dragHandleProps}
                                  className="flex items-center"
                                >
                                  <GripVertical className="w-4 h-4 text-gray-400" />
                                </div>
                                <img
                                  src={product.image}
                                  alt={product.title}
                                  className="w-16 h-16 object-cover rounded"
                                />
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium truncate">
                                    {product.customTitle || product.title}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    {product.supplier}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary">
                                      {product.category}
                                    </Badge>
                                    <Badge variant="outline">
                                      <DollarSign className="w-3 h-3 mr-1" />$
                                      {product.expectedCommission.toFixed(2)}{" "}
                                      commission
                                    </Badge>
                                  </div>
                                  <div className="flex justify-between items-center mt-2">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold">
                                        ${product.salePrice}
                                      </span>
                                      {product.salePrice !==
                                        product.basePrice && (
                                        <span className="text-sm text-gray-500 line-through">
                                          ${product.basePrice}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          updateShopProduct(product.id, {
                                            published: !product.published,
                                          })
                                        }
                                      >
                                        {product.published ? (
                                          <Eye className="w-4 h-4" />
                                        ) : (
                                          <EyeOff className="w-4 h-4" />
                                        )}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          setEditingProduct(product)
                                        }
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          removeFromShop(product.id)
                                        }
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Edit Product</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Custom Title</label>
                <Input
                  value={editingProduct.customTitle || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditingProduct({
                      ...editingProduct,
                      customTitle: e.target.value,
                    })
                  }
                  placeholder={editingProduct.title}
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Custom Description
                </label>
                <Textarea
                  value={editingProduct.customDescription || ""}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditingProduct({
                      ...editingProduct,
                      customDescription: e.target.value,
                    })
                  }
                  placeholder="Add your personal description..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Sale Price</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingProduct.salePrice}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditingProduct({
                      ...editingProduct,
                      salePrice: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-gray-600 mt-1">
                  Base price: ${editingProduct.basePrice} | Commission: $
                  {(
                    (editingProduct.salePrice * editingProduct.commission) /
                    100
                  ).toFixed(2)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() =>
                    updateShopProduct(editingProduct.id, {
                      customTitle: editingProduct.customTitle,
                      customDescription: editingProduct.customDescription,
                      salePrice: editingProduct.salePrice,
                    })
                  }
                  className="flex-1"
                >
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingProduct(null)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
