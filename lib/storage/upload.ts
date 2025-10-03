import { createClientSupabaseClient } from "@/lib/supabase/client";

// Max size aligned with products bucket policy (5MB)
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/\.[^.]+$/, "") // drop extension
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80) || "image";
}

type WebPResult = { blob: Blob; converted: boolean };

async function toWebP(file: File, quality = 0.9): Promise<WebPResult> {
  // Try OffscreenCanvas first
  try {
    const bmp = await createImageBitmap(file);
    const OC: any = (globalThis as any).OffscreenCanvas;
    if (!OC) throw new Error("OffscreenCanvas not available");
    const canvas = new OC(bmp.width, bmp.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return { blob: new Blob([file], { type: file.type }), converted: false };
    ctx.drawImage(bmp, 0, 0);
    const anyCanvas: any = canvas;
    if (typeof anyCanvas.convertToBlob === "function") {
      const blob: Blob = await anyCanvas.convertToBlob({ type: "image/webp", quality });
      return { blob, converted: true };
    }
    return { blob: new Blob([file], { type: file.type }), converted: false };
  } catch {
    // Fallback to HTMLCanvasElement
    return await new Promise<WebPResult>((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = () => {
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve({ blob: new Blob([file], { type: file.type }), converted: false });
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(
            (b) =>
              b
                ? resolve({ blob: b, converted: true })
                : resolve({ blob: new Blob([file], { type: file.type }), converted: false }),
            "image/webp",
            quality
          );
        };
        img.onerror = () => resolve({ blob: new Blob([file], { type: file.type }), converted: false });
        img.src = reader.result as string;
      };
      reader.onerror = () => resolve({ blob: new Blob([file], { type: file.type }), converted: false });
      reader.readAsDataURL(file);
    });
  }
}

export type UploadResult = { key: string; url: string };
export type UploadProgressFn = (fraction: number) => void; // 0..1

/**
 * Upload a product image to Supabase Storage (bucket: products), returning public URL.
 * - Validates type/size on client per OWASP allow-list.
 * - Converts to WebP client-side for optimization (with safe fallback).
 * - Object key: products/{productId}/{slug}-{uuid}.webp
 */
export async function uploadProductImage(
  file: File,
  opts: { productId: string; onProgress?: UploadProgressFn }
): Promise<UploadResult> {
  if (!file) throw new Error("No file provided");
  if (!ALLOWED_MIME_TYPES.has(file.type)) throw new Error("Unsupported file type");
  if (file.size > MAX_FILE_SIZE_BYTES) throw new Error("File too large (max 5MB)");
  if (!opts?.productId) throw new Error("productId is required");

  const supabase = createClientSupabaseClient();

  // Progress: start
  try { opts?.onProgress?.(0); } catch {}

  // Convert to WebP if needed
  const { blob, converted } = file.type === "image/webp" ? { blob: file as Blob, converted: false } : await toWebP(file, 0.9);
  const base = slugify(file.name || "image");
  const origExt = (file.name.split(".").pop() || "bin").toLowerCase();
  const ext = converted ? "webp" : origExt === "jpeg" ? "jpg" : origExt;
  const contentType = converted ? "image/webp" : file.type || "application/octet-stream";
  const key = `products/${opts.productId}/${base}-${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("products")
    .upload(key, blob, {
      cacheControl: "31536000",
      upsert: false,
      contentType,
    });
  if (error) throw new Error(error.message || "Upload failed");

  const { data } = supabase.storage.from("products").getPublicUrl(key);
  try { opts?.onProgress?.(1); } catch {}
  return { key, url: data.publicUrl };
}
