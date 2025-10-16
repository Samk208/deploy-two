"use client";

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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  DollarSign,
  Eye,
  Globe,
  GripVertical,
  Package,
  Save,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const categories = ["Clothing", "Beauty", "Jewelry", "Home", "Electronics"];
const regions = ["Global", "KR", "JP", "CN"];

interface ProductFormData {
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

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string>("");

  const [formData, setFormData] = useState<ProductFormData>({
    title: "",
    description: "",
    category: "",
    basePrice: 0,
    commissionPct: 20,
    inventory: 0,
    regions: [],
    active: true,
    images: [],
  });

  const [draggedImage, setDraggedImage] = useState<number | null>(null);

  const updateField = (
    field: keyof ProductFormData,
    value: string | number | boolean | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
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

  const handleSaveDraft = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);

    // Show success toast and redirect
    router.push("/dashboard/supplier/products");
  };

  const handlePublish = async () => {
    if (!validateForm()) return;

    if (formData.commissionPct < 0 || formData.commissionPct > 95) {
      // surface validation error
      return;
    }

    setIsLoading(true);
    try {
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
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 423) {
        toast({
          title: "Frozen (read-only)",
          description:
            "Product creation is disabled while the freeze is active. You can continue drafting locally.",
          variant: "destructive",
        });
        return;
      }
      if (!res.ok) throw new Error("Failed to create product");
      setSuccessMessage("Product created successfully");
    } catch (e) {
      setErrors((prev) => ({ ...prev, submit: "Failed to create product" }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // In real app, upload to storage and get URLs
    const newImages = files.map(
      (file, index) =>
        `/placeholder.svg?height=300&width=300&text=Image${formData.images.length + index + 1}`
    );
    updateField("images", [...formData.images, ...newImages]);
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
          <h1 className="text-3xl font-bold text-gray-900">New Product</h1>
          <p className="text-gray-600 mt-1">
            Create a new product for your catalog
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Form */}
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
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer"
                    data-testid="product-images"
                  >
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-indigo-600">
                        Click to upload
                      </span>{" "}
                      or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, GIF up to 10MB
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
                {formData.commissionPct < 0 || formData.commissionPct > 95 ? (
                  <p
                    className="text-sm text-red-600 mt-1"
                    data-testid="commission-error"
                  >
                    Commission must be between 0-95%
                  </p>
                ) : null}
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
                    <label
                      key={region}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.regions.includes(region)}
                        onChange={() => toggleRegion(region)}
                        className="accent-indigo-600"
                        data-testid={`region-${region.toLowerCase()}`}
                      />
                      {region === "Global" && <Globe className="h-4 w-4" />}
                      {region}
                    </label>
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

        {/* Validation Panel */}
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
            <span>Draft saved automatically</span>
          </div>
          <div className="flex items-center gap-3">
            {successMessage && (
              <span
                className="text-green-600 text-sm"
                data-testid="success-message"
              >
                {successMessage}
              </span>
            )}
            <Button variant="outline" disabled={isLoading}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button
              onClick={handlePublish}
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700"
              data-testid="submit-product"
            >
              {isLoading ? "Publishing..." : "Publish Product"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
