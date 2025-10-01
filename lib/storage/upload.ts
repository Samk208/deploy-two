import { createClientSupabaseClient } from "@/lib/supabase/client";

// Max size aligned with products bucket in setup-auth-compatible.sql (5MB)
const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function sanitizeFilename(name: string): string {
  // Strip any path, keep alphanum, dash, underscore, dot; collapse spaces
  const base = name.split("/").pop()?.split("\\").pop() || "file";
  const cleaned = base
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
  return cleaned || "file";
}

export type UploadResult = { path: string; publicUrl: string };

/**
 * Upload a product image to Supabase Storage (bucket: products) and return its public URL.
 * - Enforces mime/size limits client-side; RLS still applies server-side.
 * - The object key is namespaced by userId and a UUID to avoid collisions.
 */
export async function uploadProductImage(file: File, opts?: { userId?: string }): Promise<UploadResult> {
  if (!file) throw new Error("No file provided");
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Unsupported file type. Allowed: JPEG, PNG, WebP");
  }
  if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
    throw new Error("File is too large. Max 5MB");
  }

  const supabase = createClientSupabaseClient();

  // Determine user id for namespacing (best-effort; RLS will still enforce)
  let userId = opts?.userId;
  if (!userId) {
    try {
      const { data } = await supabase.auth.getUser();
      userId = data?.user?.id || "anon";
    } catch {
      userId = "anon";
    }
  }

  const filename = sanitizeFilename(file.name || "image");
  const objectKey = `${userId}/${crypto.randomUUID()}-${filename}`;

  const { error } = await supabase.storage
    .from("products")
    .upload(objectKey, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    throw new Error("Upload failed: " + (error.message || "unknown error"));
  }

  const { data: pub } = supabase.storage.from("products").getPublicUrl(objectKey);
  return { path: objectKey, publicUrl: pub.publicUrl };
}
