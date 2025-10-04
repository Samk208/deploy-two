"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { uploadProductImage, ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/storage/upload";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  DollarSign,
  Eye,
  Globe,
  GripVertical,
  Package,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";

const categories = ["Clothing", "Beauty", "Jewelry", "Home", "Electronics"];
const regions = ["Global", "KR", "JP", "CN"];

interface ProductFormData {
  id?: string;
  title: string;
  description: string;
  category: string;
  basePrice: number;
  commissionPct: number;
  inventory: number;
  regions: string[];
  active: boolean;
  images: string[];
}

interface EditProductClientProps {
  product: ProductFormData;
}

export function EditProductClient({
  product: initialProduct,
}: EditProductClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<ProductFormData>(initialProduct);
  const [draggedImage, setDraggedImage] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0); // 0-100

  const updateField = (field: keyof ProductFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = "Product title is required";
    if (!formData.description.trim())
      newErrors.description = "Product description is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (formData.basePrice <= 0)
      newErrors.basePrice = "Base price must be greater than 0";
    if (formData.inventory < 0)
      newErrors.inventory = "Inventory cannot be negative";
    if (formData.regions.length === 0)
      newErrors.regions = "At least one region must be selected";
    if (formData.images.length === 0)
      newErrors.images = "At least one product image is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    setSuccessMessage("");
    setErrorMessage("");
    try {
      const id = (initialProduct?.id || formData?.id || "").toString().trim();
      if (!id) {
        setErrorMessage("Missing product id. Please refresh and try again.");
        setIsLoading(false);
        return;
      }
      const payload = {
        title: formData.title,
        description: formData.description,
        price: formData.basePrice,
        commission: formData.commissionPct,
        stockCount: formData.inventory,
        category: formData.category,
        region: formData.regions,
        images: formData.images,
      };
      const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to update product");
      }
      setSuccessMessage("Product updated successfully");
    } catch (e: any) {
      setErrorMessage(e?.message || "Failed to update product");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const id = (initialProduct?.id || formData?.id || "").toString().trim();
      if (!id) {
        throw new Error("Missing product id. Please refresh and try again.");
      }

      const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to delete product");
      }

      router.push("/dashboard/supplier/products");
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to delete product");
      setIsLoading(false);
    }
  };

  

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Validate (centralized in lib/storage/upload)
    const valid = files.filter((f) => ALLOWED_MIME_TYPES.has(f.type) && f.size <= MAX_FILE_SIZE_BYTES);
    if (valid.length !== files.length) {
      const maxMb = Math.floor(MAX_FILE_SIZE_BYTES / 1024 / 1024);
      setErrorMessage(`Some files were skipped (invalid type or >${maxMb}MB)`);
    }

    setIsUploading(true);
    setUploadProgress(0);
    try {
      const rawId = initialProduct?.id ?? formData?.id;
      if (!rawId) {
        throw new Error(
          "Missing product id. Save the product first or refresh before uploading images."
        );
      }
      const productId = String(rawId);
      const uploadedUrls: string[] = [];
      for (let i = 0; i < valid.length; i++) {
        const file = valid[i];
        let fileProgress = 0;
        const { url } = await uploadProductImage(file, {
          productId,
          onProgress: (fraction) => {
            // fraction 0..1 for this file → aggregate across all files
            fileProgress = Math.max(0, Math.min(1, fraction || 0));
            const aggregate = ((i + fileProgress) / valid.length) * 100;
            setUploadProgress(Math.max(0, Math.min(100, Math.round(aggregate))));
          },
        });
        // ensure progress reaches next bucket after each file
        const aggregateDone = ((i + 1) / valid.length) * 100;
        setUploadProgress(Math.max(0, Math.min(100, Math.round(aggregateDone))));
        uploadedUrls.push(url);
      }
      if (uploadedUrls.length) {
        updateField("images", [...formData.images, ...uploadedUrls]);
      }
      setSuccessMessage("Images uploaded successfully");
      setUploadProgress(100);
    } catch (err: any) {
      setErrorMessage(err?.message || "Image upload failed");
    } finally {
      setIsUploading(false);
      // slight reset after completion for UX
      setTimeout(() => setUploadProgress(0), 500);
    }
  };

  const removeImage = (index: number) => {
    updateField(
      "images",
      formData.images.filter((_, i) => i !== index)
    );
  };

  const reorderImages = (fromIndex: number, toIndex: number) => {
    const newImages = [...formData.images];
    const [removed] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, removed);
    updateField("images", newImages);
  };

  const toggleRegion = (region: string) => {
    const newRegions = formData.regions.includes(region)
      ? formData.regions.filter((r) => r !== region)
      : [...formData.regions, region];
    updateField("regions", newRegions);
  };

  const finalPrice = formData.basePrice * (1 + formData.commissionPct / 100);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/supplier/products">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-gray-600 mt-1">Update your product information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Form - Same as new product form */}
        <div className="lg:col-span-3 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Product Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="Enter product title"
                  className={errors.title ? "border-red-500" : ""}
                  data-testid="product-title"
                />
                {errors.title && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.title}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Describe your product in detail..."
                  rows={4}
                  className={errors.description ? "border-red-500" : ""}
                  data-testid="product-description"
                />
                {errors.description && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.description}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => updateField("category", value)}
                >
                  <SelectTrigger
                    className={errors.category ? "border-red-500" : ""}
                    data-testid="product-category"
                  >
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.category}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Product Images */}
          <Card>
            <CardHeader>
              <CardTitle>Product Images *</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-indigo-600">
                        {isUploading
                          ? `Uploading... ${uploadProgress}%`
                          : "Click to upload"}
                      </span>{" "}
                      or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      JPG/PNG/WebP, up to 5MB
                    </p>
                  </label>
                </div>

                {/* Image Grid */}
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {formData.images.map((image, index) => (
                      <div
                        key={index}
                        className="relative group aspect-square border rounded-lg overflow-hidden bg-gray-100"
                        draggable
                        onDragStart={() => setDraggedImage(index)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedImage !== null) {
                            reorderImages(draggedImage, index);
                            setDraggedImage(null);
                          }
                        }}
                      >
                        <Image
                          src={image || "/placeholder.svg"}
                          alt={`Product image ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all">
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <div className="absolute top-2 left-2 p-1 bg-gray-800 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
                            <GripVertical className="h-3 w-3" />
                          </div>
                        </div>
                        {index === 0 && (
                          <Badge className="absolute bottom-2 left-2 bg-indigo-600">
                            Primary
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {errors.images && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.images}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Inventory */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="basePrice">Base Price ($) *</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.basePrice || ""}
                    onChange={(e) =>
                      updateField(
                        "basePrice",
                        Number.parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="0.00"
                    className={errors.basePrice ? "border-red-500" : ""}
                    data-testid="product-price"
                  />
                  {errors.basePrice && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.basePrice}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="inventory">Inventory *</Label>
                  <Input
                    id="inventory"
                    type="number"
                    min="0"
                    value={formData.inventory || ""}
                    onChange={(e) =>
                      updateField(
                        "inventory",
                        Number.parseInt(e.target.value) || 0
                      )
                    }
                    placeholder="0"
                    className={errors.inventory ? "border-red-500" : ""}
                    data-testid="product-stock"
                  />
                  {errors.inventory && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.inventory}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label>Commission Percentage: {formData.commissionPct}%</Label>
                <div className="mt-2">
                  <Input
                    type="number"
                    min={0}
                    max={95}
                    value={formData.commissionPct}
                    onChange={(e) =>
                      updateField(
                        "commissionPct",
                        Number.parseInt(e.target.value) || 0
                      )
                    }
                    className="w-28"
                    data-testid="product-commission"
                  />
                </div>
                <div className="mt-2">
                  <Slider
                    value={[formData.commissionPct]}
                    onValueChange={([value]) =>
                      updateField("commissionPct", value)
                    }
                    max={95}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>95%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Regions & Availability */}
          <Card>
            <CardHeader>
              <CardTitle>Regions & Availability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Available Regions *</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {regions.map((region) => (
                    <button
                      key={region}
                      onClick={() => toggleRegion(region)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                        formData.regions.includes(region)
                          ? "bg-indigo-100 border-indigo-300 text-indigo-700"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {region === "Global" && <Globe className="h-4 w-4" />}
                      {region}
                    </button>
                  ))}
                </div>
                {errors.regions && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.regions}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="active">Product Status</Label>
                  <p className="text-sm text-gray-600">
                    {formData.active
                      ? "Active - visible to influencers"
                      : "Inactive - hidden from influencers"}
                  </p>
                </div>
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => updateField("active", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Validation Panel - Same as new product */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-4">
            {/* Validation Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Validation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  {formData.title ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-gray-400" />
                  )}
                  <span
                    className={`text-sm ${formData.title ? "text-green-600" : "text-gray-500"}`}
                  >
                    Product title
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {formData.description ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-gray-400" />
                  )}
                  <span
                    className={`text-sm ${formData.description ? "text-green-600" : "text-gray-500"}`}
                  >
                    Description
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {formData.images.length > 0 ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-gray-400" />
                  )}
                  <span
                    className={`text-sm ${formData.images.length > 0 ? "text-green-600" : "text-gray-500"}`}
                  >
                    Product images
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {formData.basePrice > 0 ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-gray-400" />
                  )}
                  <span
                    className={`text-sm ${formData.basePrice > 0 ? "text-green-600" : "text-gray-500"}`}
                  >
                    Base price
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {formData.regions.length > 0 ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-gray-400" />
                  )}
                  <span
                    className={`text-sm ${formData.regions.length > 0 ? "text-green-600" : "text-gray-500"}`}
                  >
                    Regions selected
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Price Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Price Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Base Price:</span>
                  <span>${formData.basePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Commission ({formData.commissionPct}%):</span>
                  <span>
                    $
                    {(
                      (formData.basePrice * formData.commissionPct) /
                      100
                    ).toFixed(2)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Final Price:</span>
                  <span className="text-indigo-600">
                    ${finalPrice.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Inventory Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Inventory
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {formData.inventory}
                  </div>
                  <div className="text-sm text-gray-600">units available</div>
                  {formData.inventory <= 10 && formData.inventory > 0 && (
                    <Badge variant="destructive" className="mt-2">
                      Low Stock
                    </Badge>
                  )}
                  {formData.inventory === 0 && (
                    <Badge variant="secondary" className="mt-2">
                      Out of Stock
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 mt-8">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Package className="h-4 w-4" />
            <span>Remember to click 'Save Changes' to persist your edits</span>
          </div>
          <div className="flex items-center gap-3">
            {errorMessage && (
              <span
                className="text-red-600 text-sm"
                data-testid="error-message"
              >
                {errorMessage}
              </span>
            )}
            {successMessage && (
              <span
                className="text-green-600 text-sm"
                data-testid="success-message"
              >
                {successMessage}
              </span>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isLoading}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Product</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this product? This action
                    cannot be undone and will remove the product from all
                    influencer shops.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete Product
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="outline" disabled={isLoading}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading || isUploading}
              className="bg-indigo-600 hover:bg-indigo-700"
              data-testid="save-product"
            >
              {isLoading
                ? "Saving..."
                : isUploading
                  ? `Uploading ${uploadProgress}%`
                  : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
