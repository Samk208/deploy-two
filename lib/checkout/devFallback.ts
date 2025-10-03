export type ClientProductCandidate = {
  id?: string;
  title?: unknown;
  name?: unknown;
  description?: unknown;
  price?: unknown;
  effectivePrice?: unknown;
  images?: unknown;
  image?: unknown;
  supplierId?: unknown;
  commission?: unknown;
  stock_count?: unknown;
};

export function isDevFallbackAllowed(env = process.env): boolean {
  return env.NODE_ENV !== "production" && env.DEV_FALLBACK === "true";
}

export function validateClientProduct(candidate: any): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const rawSupplier = typeof candidate?.supplier_id === "string" ? candidate.supplier_id : undefined;
  const trimmedSupplierId = rawSupplier?.trim();
  const supplierOk = typeof trimmedSupplierId === "string" && trimmedSupplierId.length > 0;
  // Normalize value to trimmed form if present
  if (supplierOk) candidate.supplier_id = trimmedSupplierId;
  if (!supplierOk) errors.push("supplier_id: must be non-empty string");

  const priceNumber = Number(candidate?.price);
  const priceOk = typeof priceNumber === "number" && Number.isFinite(priceNumber) && priceNumber >= 0;
  if (!priceOk) errors.push("price: must be a finite number >= 0");

  const stockOk =
    Number.isInteger(candidate?.stock_count) &&
    candidate.stock_count >= 0 &&
    candidate.stock_count <= 1000;
  if (!stockOk) errors.push("stock_count: must be an integer 0..1000");

  const imagesOk =
    Array.isArray(candidate?.images) && candidate.images.every((u: any) => typeof u === "string");
  if (!imagesOk) errors.push("images: must be an array of strings");

  const commissionOk =
    candidate?.commission === undefined ||
    candidate?.commission === null ||
    (typeof candidate?.commission === "number" &&
      Number.isFinite(candidate.commission) &&
      candidate.commission >= 0 &&
      candidate.commission <= 100);
  if (!commissionOk) errors.push("commission: must be numeric within 0..100");

  const titleOk = typeof candidate?.title === "string";
  if (!titleOk) errors.push("title: must be string");

  const descOk = typeof candidate?.description === "string";
  if (!descOk) errors.push("description: must be string");

  return { ok: errors.length === 0, errors };
}
