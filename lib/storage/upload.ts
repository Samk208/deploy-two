import { createClientSupabaseClient } from "@/lib/supabase/client";

// Max size aligned with products bucket policy (5MB)
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/\.[^.]+$/, "") // drop extension
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80) || "image";
}

async function toWebP(file: File, quality = 0.9): Promise<Blob> {
  // Try OffscreenCanvas first
  try {
    // @ts-ignore - OffscreenCanvas is not in all TS lib targets
    const bmp = await createImageBitmap(file);
    // @ts-ignore
    const canvas = new OffscreenCanvas(bmp.width, bmp.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bmp, 0, 0);
    // @ts-ignore
    return await canvas.convertToBlob({ type: "image/webp", quality });
  } catch {
    // Fallback to HTMLCanvasElement
    return await new Promise<Blob>((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = () => {
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(file);
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/webp", quality);
        };
        img.onerror = () => resolve(file);
        img.src = reader.result as string;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  }
}

export type UploadResult = { key: string; url: string };

/**
 * Upload a product image to Supabase Storage (bucket: products), returning public URL.
 * - Validates type/size on client per OWASP allow-list.
 * - Converts to WebP client-side for optimization (with safe fallback).
 * - Object key: products/{productId}/{slug}-{uuid}.webp
 */
export async function uploadProductImage(file: File, opts: { productId: string }): Promise<UploadResult> {
  if (!file) throw new Error("No file provided");
  if (!ALLOWED.has(file.type)) throw new Error("Unsupported file type");
  if (file.size > MAX_BYTES) throw new Error("File too large (max 5MB)");
  if (!opts?.productId) throw new Error("productId is required");

  const supabase = createClientSupabaseClient();

  // Convert to WebP if needed
  const webpBlob = file.type === "image/webp" ? file : await toWebP(file, 0.9);
  const base = slugify(file.name || "image");
  const key = `products/${opts.productId}/${base}-${crypto.randomUUID()}.webp`;

  const { error } = await supabase.storage
    .from("products")
    .upload(key, webpBlob, {
      cacheControl: "31536000",
      upsert: false,
      contentType: "image/webp",
    });
  if (error) throw new Error(error.message || "Upload failed");

  const { data } = supabase.storage.from("products").getPublicUrl(key);
  return { key, url: data.publicUrl };
}
