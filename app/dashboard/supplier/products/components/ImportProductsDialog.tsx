"use client";

import Papa from "papaparse";
import React, { ChangeEvent, useCallback, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  CheckCircle,
  Download,
  Eye,
  EyeOff,
  FileText,
  RefreshCw,
  Upload,
  XCircle,
} from "lucide-react";

interface ImportRow {
  row: number;
  operation: "insert" | "update" | "skip";
  status: "success" | "error" | "warning";
  message: string;
  data: {
    title?: string;
    price?: number;
    category?: string;
    stock?: number;
    regions?: string[];
  };
}

interface ImportSummary {
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
}

interface ImportProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ImportProductsDialog({
  open,
  onOpenChange,
}: ImportProductsDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<
    "upload" | "preview" | "processing" | "complete"
  >("upload");
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importData, setImportData] = useState<ImportRow[]>([]);
  const [showAllRows, setShowAllRows] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  // State for file upload handling
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  // Mock import results (commented out for now)
  /*
  const mockImportResults: ImportRow[] = [
    {
      row: 1,
      operation: "insert",
      status: "success",
      message: "Product will be created",
      data: { title: "Premium Cotton T-Shirt", price: 45, category: "Clothing", stock: 100, regions: ["Global", "KR"] },
    },
    {
      row: 2,
      operation: "update",
      status: "success",
      message: "Product will be updated",
      data: { title: "Organic Skincare Set", price: 120, category: "Beauty", stock: 50, regions: ["JP"] },
    },
    {
      row: 3,
      operation: "skip",
      status: "warning",
      message: "Product already exists with same data",
      data: { title: "Gold Necklace", price: 89, category: "Jewelry", stock: 25, regions: ["KR"] },
    },
    {
      row: 4,
      operation: "insert",
      status: "error",
      message: "Invalid price format",
      data: { title: "Wireless Headphones", category: "Electronics", stock: 30, regions: ["Global"] },
    },
    {
      row: 5,
      operation: "insert",
      status: "success",
      message: "Product will be created",
      data: { title: "Ceramic Coffee Mug", price: 28, category: "Home", stock: 75, regions: ["CN", "KR"] },
    },
    // Add more mock rows to test pagination
    ...Array.from({ length: 25 }, (_, i) => ({
      row: i + 6,
      operation: "insert" as const,
      status: "success" as const,
      message: "Product will be created",
      data: {
        title: `Sample Product ${i + 6}`,
        price: Math.floor(Math.random() * 100) + 20,
        category: "Clothing",
        stock: Math.floor(Math.random() * 100) + 10,
        regions: ["Global"],
      },
    })),
  ]
  */

  const summary: ImportSummary = useMemo(() => {
    return importData.reduce(
      (acc, row) => {
        acc.total++;
        if (row.status === "success") {
          if (row.operation === "insert") acc.inserted++;
          else if (row.operation === "update") acc.updated++;
          else acc.skipped++;
        } else if (row.status === "error") {
          acc.errors++;
        } else if (row.status === "warning") {
          acc.skipped++;
        }
        return acc;
      },
      { total: 0, inserted: 0, updated: 0, skipped: 0, errors: 0 }
    );
  }, [importData]);

  const displayedRows = showAllRows ? importData : importData.slice(0, 20);
  const hasErrors = summary.errors > 0;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      const csvFile = files.find(
        (file) => file.type === "text/csv" || file.name.endsWith(".csv")
      );

      if (csvFile) {
        setFile(csvFile);
        handleFileUpload(csvFile);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV file.",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      handleFileUpload(selectedFile);
    }
  };

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      setIsUploading(true);
      setUploadError(null);

      // Parse CSV safely in the browser
      const text = await file.text();
      const parsed = Papa.parse<string[]>(text, {
        header: true,
        skipEmptyLines: true,
      });

      if (parsed.errors?.length) {
        setUploadError("Failed to parse CSV. Please check the file format.");
        return;
      }

      // Validate headers against backend expectations
      const expectedHeaders = [
        "sku",
        "title",
        "description",
        "image_urls",
        "base_price",
        "commission_pct",
        "regions",
        "inventory",
        "active",
      ];

      const actualHeaders = (parsed.meta.fields || []).map((h: string) =>
        String(h).trim().toLowerCase()
      );
      const missing = expectedHeaders.filter((h) => !actualHeaders.includes(h));
      if (missing.length) {
        setUploadError(`Missing required columns: ${missing.join(", ")}`);
        return;
      }

      // Prepare preview rows for the UI
      const rows: ImportRow[] = (parsed.data as any[]).map(
        (row: any, idx: number) => {
          const price = row.base_price ? Number(row.base_price) : undefined;
          const stock = row.inventory ? Number(row.inventory) : undefined;
          const regions =
            typeof row.regions === "string" && row.regions.length
              ? row.regions
                  .split(/[,;]+/)
                  .map((r: string) => r.trim())
                  .filter(Boolean)
              : [];
          const hasBasic =
            row.title && price !== undefined && !Number.isNaN(price);
          return {
            row: idx + 1,
            operation: "insert",
            status: hasBasic ? "success" : "error",
            message: hasBasic
              ? "Ready to import"
              : "Missing or invalid required fields",
            data: {
              title: row.title,
              price,
              category: row.category || undefined,
              stock,
              regions,
            },
          };
        }
      );

      setImportData(rows);

      // Track uploaded file
      const newFile = {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        status: "uploaded" as const,
      };
      setUploadedFiles((prev) => [...prev, newFile]);
      setUploadSuccess(true);
      setStep("preview");
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError("Failed to process file");
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleImport = async () => {
    if (hasErrors && !dryRun) {
      toast({
        title: "Cannot import with errors",
        description: "Please fix all errors before importing.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setStep("processing");
    setProgress(0);

    // Smooth progress UI while waiting for API
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 5;
      });
    }, 300);

    try {
      // Send raw CSV lines to match backend contract (keeps validation server-side)
      const csvLines: string[] = [];
      if (file) {
        const text = await file.text();
        text.split(/\r?\n/).forEach((line) => {
          const trimmed = line.trim();
          if (trimmed.length > 0) csvLines.push(trimmed);
        });
      }

      const response = await fetch("/api/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dryRun,
          data: csvLines,
        }),
      });

      if (!response.ok) throw new Error("Import failed");

      // Optionally parse result to surface server-found row errors
      const json = await response.json();
      if (json?.data?.errors?.length) {
        // Map server errors into our preview table status/messages
        const serverErrors = new Map<number, string>(
          json.data.errors.map((e: any) => [
            e.row,
            Object.values(e.errors).join("; "),
          ])
        );
        setImportData((prev) =>
          prev.map((r) =>
            serverErrors.has(r.row)
              ? {
                  ...r,
                  status: "error",
                  message: serverErrors.get(r.row) as string,
                }
              : r
          )
        );
      }

      setProgress(100);
      setStep("complete");

      toast({
        title: dryRun ? "Dry run completed" : "Import completed",
        description: dryRun
          ? "Review the results and run again to commit changes."
          : `Successfully processed ${summary.total} products.`,
      });
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description: "An error occurred during import. Please try again.",
        variant: "destructive",
      });
      setStep("preview");
    } finally {
      setIsProcessing(false);
      clearInterval(progressInterval);
    }
  };

  const handleDownloadErrors = () => {
    const errorRows = importData.filter((row) => row.status === "error");
    const csvContent = [
      "Row,Title,Error",
      ...errorRows.map(
        (row) => `${row.row},"${row.data.title || "N/A"}","${row.message}"`
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "import-errors.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetDialog = () => {
    setStep("upload");
    setFile(null);
    setImportData([]);
    setProgress(0);
    setIsProcessing(false);
    setShowAllRows(false);
    setDryRun(true);
  };

  const getOperationBadge = (operation: string) => {
    switch (operation) {
      case "insert":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Insert
          </Badge>
        );
      case "update":
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            Update
          </Badge>
        );
      case "skip":
        return <Badge variant="secondary">Skip</Badge>;
      default:
        return <Badge variant="outline">{operation}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) resetDialog();
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Products
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import or update your products.
            {step === "preview" &&
              " Review the preview and run a dry-run first."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Upload Step */}
          {step === "upload" && (
            <div className="space-y-6">
              <div
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
                  isDragOver
                    ? "border-indigo-400 bg-indigo-50"
                    : "border-gray-300 hover:border-indigo-400"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Drop your CSV file here
                </h3>
                <p className="text-gray-600 mb-4">
                  or click to browse and select a file
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload">
                  <Button
                    variant="outline"
                    className="cursor-pointer bg-transparent"
                    asChild
                  >
                    <span>Choose File</span>
                  </Button>
                </label>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    CSV Format Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-600">
                  <p>
                    <strong>Required columns:</strong> sku, title, description,
                    image_urls, base_price, commission_pct, regions, inventory,
                    active
                  </p>
                  <p>
                    <strong>Regions format:</strong> Comma-separated (e.g.,
                    "Global,KR,JP")
                  </p>
                  <p>
                    <strong>Images:</strong> Pipe-separated URLs in one cell
                    (e.g., url1|url2)
                  </p>
                  <p>
                    <strong>Get template:</strong> Use "Download Sample
                    Template" in Export drawer or visit /api/products/template
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Processing Step */}
          {step === "processing" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <RefreshCw className="h-12 w-12 text-indigo-600 animate-spin" />
              <h3 className="text-lg font-medium text-gray-900">
                {isProcessing ? "Processing CSV..." : "Importing Products..."}
              </h3>
              <div className="w-full max-w-md">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-gray-600 text-center mt-2">
                  {progress}% complete
                </p>
              </div>
            </div>
          )}

          {/* Preview Step */}
          {step === "preview" && (
            <div className="space-y-4 h-full flex flex-col">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Card className="p-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {summary.total}
                    </p>
                    <p className="text-xs text-gray-600">Total</p>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {summary.inserted}
                    </p>
                    <p className="text-xs text-gray-600">Insert</p>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {summary.updated}
                    </p>
                    <p className="text-xs text-gray-600">Update</p>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-600">
                      {summary.skipped}
                    </p>
                    <p className="text-xs text-gray-600">Skip</p>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {summary.errors}
                    </p>
                    <p className="text-xs text-gray-600">Errors</p>
                  </div>
                </Card>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="dry-run"
                      checked={dryRun}
                      onCheckedChange={(checked) => setDryRun(checked === true)}
                    />
                    <label htmlFor="dry-run" className="text-sm font-medium">
                      Dry run (preview only)
                    </label>
                  </div>
                  {hasErrors && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadErrors}
                      className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Errors CSV
                    </Button>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllRows(!showAllRows)}
                >
                  {showAllRows ? (
                    <EyeOff className="h-4 w-4 mr-2" />
                  ) : (
                    <Eye className="h-4 w-4 mr-2" />
                  )}
                  {showAllRows
                    ? "Show First 20"
                    : `Show All ${importData.length}`}
                </Button>
              </div>

              {/* Preview Table */}
              <Card className="flex-1 overflow-hidden">
                <CardContent className="p-0 h-full">
                  <div className="overflow-auto h-full">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white z-10">
                        <TableRow>
                          <TableHead className="w-16">Row</TableHead>
                          <TableHead className="w-20">Op</TableHead>
                          <TableHead className="w-16">Status</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead className="w-20">Price</TableHead>
                          <TableHead className="w-16">Stock</TableHead>
                          <TableHead>Message</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayedRows.map((row) => (
                          <TableRow
                            key={row.row}
                            className={
                              row.status === "error" ? "bg-red-50" : ""
                            }
                          >
                            <TableCell className="font-mono text-sm">
                              {row.row}
                            </TableCell>
                            <TableCell>
                              {getOperationBadge(row.operation)}
                            </TableCell>
                            <TableCell>{getStatusIcon(row.status)}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{row.data.title}</p>
                                <p className="text-sm text-gray-500">
                                  {row.data.category}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {row.data.price ? `$${row.data.price}` : "-"}
                            </TableCell>
                            <TableCell>{row.data.stock || "-"}</TableCell>
                            <TableCell className="text-sm">
                              {row.message}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Complete Step */}
          {step === "complete" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
              <h3 className="text-xl font-medium text-gray-900">
                {dryRun ? "Dry Run Complete!" : "Import Complete!"}
              </h3>
              <p className="text-gray-600 text-center max-w-md">
                {dryRun
                  ? 'Review the results above. Uncheck "Dry run" and import again to commit the changes.'
                  : `Successfully processed ${summary.total} products. ${summary.inserted} inserted, ${summary.updated} updated, ${summary.skipped} skipped.`}
              </p>
              {dryRun && (
                <Button onClick={() => setStep("preview")} className="mt-4">
                  Review Results
                </Button>
              )}
            </div>
          )}
        </div>

        <Separator />

        <DialogFooter className="flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {file && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4" />
                  {file.name}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              {step === "preview" && (
                <Button
                  onClick={handleImport}
                  disabled={isProcessing || (hasErrors && !dryRun)}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : dryRun ? (
                    "Run Dry Run"
                  ) : (
                    "Commit Import"
                  )}
                </Button>
              )}
              {step === "complete" && dryRun && (
                <Button
                  onClick={() => {
                    setDryRun(false);
                    setStep("preview");
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Import for Real
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
