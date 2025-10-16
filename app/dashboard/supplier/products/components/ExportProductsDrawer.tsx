"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Product } from "@/lib/types";
import {
  AlertCircle,
  CheckCircle,
  Download,
  FileText,
  Globe,
  X,
} from "lucide-react";
import { useState } from "react";

interface ExportProductsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products?: Product[];
}

const categories = [
  "All",
  "Clothing",
  "Beauty",
  "Jewelry",
  "Home",
  "Electronics",
];
const regions = ["All", "Global", "KR", "JP", "CN"];

export function ExportProductsDrawer({
  open,
  onOpenChange,
}: ExportProductsDrawerProps) {
  const [selectedStatus, setSelectedStatus] = useState<string[]>(["active"]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedRegions, setSelectedRegions] = useState<string[]>(["All"]);
  const [lowInventoryOnly, setLowInventoryOnly] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportComplete, setExportComplete] = useState(false);

  const handleStatusChange = (status: string, checked: boolean) => {
    if (checked) {
      setSelectedStatus((prev) => [...prev, status]);
    } else {
      setSelectedStatus((prev) => prev.filter((s) => s !== status));
    }
  };

  const handleRegionChange = (region: string, checked: boolean) => {
    if (region === "All") {
      setSelectedRegions(checked ? ["All"] : []);
    } else {
      setSelectedRegions((prev) => {
        const filtered = prev.filter((r) => r !== "All");
        return checked
          ? [...filtered, region]
          : filtered.filter((r) => r !== region);
      });
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportProgress(0);
      setExportComplete(false);

      // Build query params synchronously and trigger download immediately (within user gesture)
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== "All")
        params.set("category", selectedCategory);
      if (selectedStatus.length === 1) params.set("status", selectedStatus[0]);
      if (selectedRegions.length && !selectedRegions.includes("All"))
        params.set("regions", selectedRegions.join(","));
      if (lowInventoryOnly) params.set("lowInventory", "true");

      const downloadUrl = `/api/products/export?${params.toString()}`;
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `products-export-${new Date().toISOString().split("T")[0]}.csv`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cosmetic progress animation after triggering download
      const progressInterval = setInterval(() => {
        setExportProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setIsExporting(false);
            setExportComplete(true);
            return 100;
          }
          return prev + 10;
        });
      }, 100);

      // Auto-close drawer after short delay
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } catch (error) {
      console.error("Export failed:", error);
      setIsExporting(false);
      setExportProgress(0);
      setExportComplete(false);
    }
  };

  const handleCancel = () => {
    setIsExporting(false);
    setExportProgress(0);
    setExportComplete(false);
  };

  const handleDownloadTemplate = () => {
    const link = document.createElement("a");
    link.href = "/api/products/template";
    link.download = "product-import-template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getEstimatedCount = () => {
    // Mock calculation based on filters
    let count = 156; // Total products
    if (
      selectedStatus.includes("active") &&
      !selectedStatus.includes("inactive")
    )
      count = 142;
    if (
      selectedStatus.includes("inactive") &&
      !selectedStatus.includes("active")
    )
      count = 14;
    if (selectedCategory !== "All") count = Math.floor(count * 0.6);
    if (!selectedRegions.includes("All")) count = Math.floor(count * 0.8);
    if (lowInventoryOnly) count = Math.floor(count * 0.2);
    return count;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto max-h-svh">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-amber-600" />
            Export Products
          </SheetTitle>
          <SheetDescription>
            Configure your export settings and download a CSV file of your
            products.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Status Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Product Status</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="active"
                  checked={selectedStatus.includes("active")}
                  onCheckedChange={(checked) =>
                    handleStatusChange("active", checked as boolean)
                  }
                />
                <Label htmlFor="active" className="text-sm cursor-pointer">
                  Active Products
                </Label>
                <Badge variant="default" className="ml-auto">
                  142
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="inactive"
                  checked={selectedStatus.includes("inactive")}
                  onCheckedChange={(checked) =>
                    handleStatusChange("inactive", checked as boolean)
                  }
                />
                <Label htmlFor="inactive" className="text-sm cursor-pointer">
                  Inactive Products
                </Label>
                <Badge variant="secondary" className="ml-auto">
                  14
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Category Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Category</Label>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger>
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
          </div>

          <Separator />

          {/* Region Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Regions</Label>
            <div className="space-y-2">
              {regions.map((region) => (
                <div key={region} className="flex items-center space-x-2">
                  <Checkbox
                    id={`region-${region}`}
                    checked={selectedRegions.includes(region)}
                    onCheckedChange={(checked) =>
                      handleRegionChange(region, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`region-${region}`}
                    className="text-sm cursor-pointer flex items-center gap-1"
                  >
                    {region === "Global" && <Globe className="h-3 w-3" />}
                    {region}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Additional Filters */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Additional Filters</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="low-inventory"
                checked={lowInventoryOnly}
                onCheckedChange={(checked) =>
                  setLowInventoryOnly(checked as boolean)
                }
              />
              <Label htmlFor="low-inventory" className="text-sm cursor-pointer">
                Low inventory only (≤10 items)
              </Label>
            </div>
          </div>

          <Separator />

          {/* Export Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Estimated products:</span>
              <Badge variant="outline">{getEstimatedCount()} items</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">File format:</span>
              <span className="text-sm">CSV</span>
            </div>
          </div>

          {/* Export Progress */}
          {isExporting && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Exporting...</span>
                <span className="text-sm text-gray-600">
                  {Math.round(exportProgress)}%
                </span>
              </div>
              <Progress value={exportProgress} className="h-2" />
            </div>
          )}

          {/* Export Complete */}
          {exportComplete && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Export completed successfully!
                </span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Your CSV file has been downloaded to your device.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 pt-4">
            {!isExporting && !exportComplete && (
              <>
                <Button
                  onClick={handleExport}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  disabled={selectedStatus.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV ({getEstimatedCount()} products)
                </Button>

                <Button
                  variant="outline"
                  onClick={handleDownloadTemplate}
                  className="w-full bg-transparent"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Download Sample Template
                </Button>
              </>
            )}

            {isExporting && (
              <Button
                variant="outline"
                onClick={handleCancel}
                className="w-full bg-transparent"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel Export
              </Button>
            )}

            {exportComplete && (
              <Button
                variant="outline"
                onClick={() => {
                  setExportComplete(false);
                  setExportProgress(0);
                }}
                className="w-full"
              >
                Export Again
              </Button>
            )}
          </div>

          {/* Help Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Export includes:</p>
                <ul className="text-xs space-y-1 text-blue-700">
                  <li>• Product details (title, description, price)</li>
                  <li>• Inventory and commission data</li>
                  <li>• Regional availability settings</li>
                  <li>• Sales performance metrics</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
