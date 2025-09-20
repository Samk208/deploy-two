import { type SupabaseClient } from "@supabase/supabase-js"

export const fileConfig = {
  brandLogo: {
    maxSize: 1024 * 1024 * 2, // 2MB
    allowedTypes: ["image/jpeg", "image/png", "image/webp"] as string[],
  },
  productImage: {
    maxSize: 1024 * 1024 * 4, // 4MB
    allowedTypes: ["image/jpeg", "image/png", "image/webp"] as string[],
  },
  verificationDocument: {
    maxSize: 1024 * 1024 * 10, // 10MB
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"] as string[],
  },
  digitalProduct: {
    maxSize: 1024 * 1024 * 100, // 100MB
    allowedTypes: [] as string[], // Allow any for now, can be restricted
  },
  importCsv: {
    maxSize: 1024 * 1024 * 5, // 5MB
    allowedTypes: ["text/csv"] as string[],
  },
}

export async function uploadBrandLogo(supabase: SupabaseClient, file: File, brandId: string) {
  if (!file || !brandId) {
    throw new Error("File and brand ID are required.")
  }

  const fileExt = file.name.split(".").pop()
  const fileName = `${brandId}.${fileExt}`
  const filePath = `public/${fileName}`

  const { error } = await supabase.storage.from("brand-logos").upload(filePath, file, { upsert: true })

  if (error) {
    console.error("Error uploading brand logo:", error)
    throw new Error(`Storage error: ${error.message}`)
  }

  const { data } = await supabase.storage.from("brand-logos").getPublicUrl(filePath)

  return data.publicUrl
}

/**
 * Uploads a product image to Supabase Storage.
 * @param supabase The Supabase client instance.
 * @param file The image file to upload.
 * @param productId The ID of the product.
 * @returns The public URL of the uploaded image.
 */
export async function uploadProductImage(supabase: SupabaseClient, file: File, productId: string): Promise<string> {
  if (!file || !productId) {
    throw new Error("File and product ID are required.")
  }

  const fileExt = file.name.split(".").pop()
  if (!fileExt) {
    throw new Error("File extension is missing.")
  }

  const validExtensions = ["png", "jpg", "jpeg", "webp"]
  if (!validExtensions.includes(fileExt.toLowerCase())) {
    throw new Error(`Invalid file type. Only ${validExtensions.join(", ")} are allowed.`)
  }

  const fileName = `${productId}-${Date.now()}.${fileExt}`
  const filePath = `products/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(filePath, file)

  if (uploadError) {
    console.error("Error uploading product image:", uploadError)
    throw new Error(`Storage error: ${uploadError.message}`)
  }

  const { data } = await supabase.storage.from("product-images").getPublicUrl(filePath)

  return data.publicUrl
}

/**
 * Deletes a product image from Supabase Storage.
 * @param supabase The Supabase client instance.
 * @param imageUrl The URL of the image to delete.
 */
export async function deleteProductImage(supabase: SupabaseClient, imageUrl: string): Promise<void> {
  if (!imageUrl) {
    return
  }

  const filePath = new URL(imageUrl).pathname.split("/product-images/")[1]

  if (!filePath) {
    console.warn("Could not determine file path from image URL.")
    return
  }

  const { error } = await supabase.storage.from("product-images").remove([filePath])

  if (error) {
    console.error("Error deleting product image:", error)
    // Don't throw here, just log the error
  }
}

/**
 * Uploads a verification document for KYC.
 * @param supabase The Supabase client instance.
 * @param file The document file to upload.
 * @param userId The ID of the user.
 * @param documentType The type of the document.
 * @returns The path of the uploaded file in the storage bucket.
 */
export async function uploadVerificationDocument(
  supabase: SupabaseClient,
  file: File,
  userId: string,
  documentType: string
): Promise<string> {
  const filePath = `kyc/${userId}/${documentType}/${file.name}`

  const { error } = await supabase.storage.from("verification-documents").upload(filePath, file, {
    upsert: true, // Replace if exists
  })

  if (error) {
    throw new Error(`Failed to upload verification document: ${error.message}`)
  }

  return filePath
}

/**
 * Creates a signed URL to access a verification document.
 * @param supabase The Supabase client instance.
 * @param filePath The path of the file in the storage bucket.
 * @returns A signed URL with a 15-minute expiration time.
 */
export async function getVerificationDocumentUrl(supabase: SupabaseClient, filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from("verification-documents")
    .createSignedUrl(filePath, 900) // 900 seconds = 15 minutes

  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`)
  }

  return data.signedUrl
}

/**
 * Uploads a file for a digital product.
 * @param supabase The Supabase client instance.
 * @param file The file to upload.
 * @param productId The ID of the product.
 * @returns The path of the uploaded file.
 */
export async function uploadDigitalProductFile(supabase: SupabaseClient, file: File, productId: string): Promise<string> {
  const filePath = `digital-products/${productId}/${file.name}`

  const { error } = await supabase.storage.from("digital-assets").upload(filePath, file, { upsert: true })

  if (error) {
    throw new Error(`Failed to upload digital product file: ${error.message}`)
  }

  return filePath
}

/**
 * Gets a secure, expiring download link for a digital product.
 * @param supabase The Supabase client instance.
 * @param filePath The path of the file in the storage bucket.
 * @returns A signed URL valid for a limited time.
 */
export async function getDigitalProductDownloadUrl(supabase: SupabaseClient, filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from("digital-assets")
    .createSignedUrl(filePath, 3600) // 1 hour expiration

  if (error) {
    throw new Error(`Failed to get download URL: ${error.message}`)
  }

  return data.signedUrl
}

/**
 * Uploads a CSV file for bulk product import.
 * @param supabase The Supabase client instance.
 * @param file The CSV file.
 * @param userId The ID of the user performing the import.
 * @returns The path of the uploaded CSV file.
 */
export async function uploadImportCsv(supabase: SupabaseClient, file: File, userId: string): Promise<string> {
  const filePath = `imports/${userId}/products-${Date.now()}.csv`

  const { error } = await supabase.storage.from("imports").upload(filePath, file)

  if (error) {
    throw new Error(`Failed to upload CSV: ${error.message}`)
  }

  return filePath
}

/**
 * Downloads and reads the content of a CSV file from storage.
 * @param supabase The Supabase client instance.
 * @param filePath The path of the CSV file in the storage bucket.
 * @returns The text content of the CSV file.
 */
export async function readCsvFromStorage(supabase: SupabaseClient, filePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from("imports").download(filePath)

  if (error) {
    throw new Error(`Failed to download CSV from storage: ${error.message}`)
  }

  return data.text()
}

/**
 * Validates a file against size and type constraints.
 * @param file The file to validate.
 * @param type The type of file from fileConfig.
 */
export function validateFileUpload(file: File, type: keyof typeof fileConfig) {
  const config = fileConfig[type]

  if (file.size > config.maxSize) {
    throw new Error(`File is too large. Max size is ${config.maxSize / 1024 / 1024}MB.`)
  }

  if (config.allowedTypes.length > 0 && !config.allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed types are: ${config.allowedTypes.join(", ")}.`)
  }
}

/**
 * Generates a secure, pre-signed URL for uploading a file.
 * This is useful for client-side uploads directly to Supabase Storage.
 * @param supabase The Supabase client instance.
 * @param bucket The storage bucket name.
 * @param path The path where the file will be stored.
 * @returns The pre-signed URL for the upload.
 */
export async function generateSecureUploadUrl(supabase: SupabaseClient, bucket: string, path: string) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path)

  if (error) {
    throw new Error(`Failed to create secure upload URL: ${error.message}`)
  }

  return data
}
