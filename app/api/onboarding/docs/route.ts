import { getCurrentUser } from "@/lib/auth-helpers";
import { supabaseAdmin, type Inserts } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import path from "path";
import { z } from "zod";

// Force Node.js runtime
export const runtime = "nodejs";

// Canonical allowed document types (must match lib/types DocumentType)
const ALLOWED_DOC_TYPES = [
  "government_id",
  "bank_book",
  "business_registration_optional",
  "business_registration",
  "bank_account_book",
  "mail_order_sales_report",
] as const;

// Schema for FormData document upload
const documentUploadSchema = z.object({
  documentType: z.enum(ALLOWED_DOC_TYPES),
});

// File validation schema
const fileValidationSchema = z.object({
  size: z.number().max(10 * 1024 * 1024, "File size must be less than 10MB"),
  type: z
    .string()
    .regex(
      /^(image\/.*|application\/pdf)$/,
      "Only images and PDFs are allowed"
    ),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(request);

    // Get current user
    const user = await getCurrentUser(supabase);
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse FormData
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const documentType = formData.get("documentType") as string;

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "File is required" },
        { status: 400 }
      );
    }

    // Validate document type
    const typeValidation = documentUploadSchema.safeParse({ documentType });
    if (!typeValidation.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid document type",
          fieldErrors: typeValidation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Validate file
    const fileValidation = fileValidationSchema.safeParse({
      size: file.size,
      type: file.type,
    });

    if (!fileValidation.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid file",
          fieldErrors: fileValidation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Sandbox mode: when CHECKOUT_SANDBOX=true, do not create or mutate DB rows
    const sandbox =
      String(process.env.CHECKOUT_SANDBOX || "").toLowerCase() === "true";

    // Get or create verification request (skipped in sandbox)
    let verificationRequestId: string | null = null;
    if (!sandbox) {
      const { data: existingRequest } = await supabaseAdmin
        .from("verification_requests")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["draft", "submitted"])
        .maybeSingle();

      if (existingRequest) {
        verificationRequestId = existingRequest.id;
      } else {
        // Create new verification request
        const requestInsert: Inserts<"verification_requests"> = {
          user_id: user.id,
          role: user.role.toLowerCase(),
          status: "draft",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: newRequest, error: createError } = await supabaseAdmin
          .from("verification_requests")
          .insert(requestInsert)
          .select()
          .maybeSingle();

        if (createError || !newRequest) {
          console.error("Error creating verification request:", createError);
          return NextResponse.json(
            { ok: false, error: "Failed to create verification request" },
            { status: 500 }
          );
        }
        verificationRequestId = newRequest.id;
      }
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename to prevent path traversal and unsafe characters
    const sanitizeFilename = (filename: string): string => {
      // Get basename to remove any path separators
      const basename = path.basename(filename);
      // Remove or replace unsafe characters, keep only alphanumeric, dots, dashes, underscores
      const sanitized = basename.replace(/[^a-zA-Z0-9._-]/g, "_");
      // Truncate to reasonable length
      return sanitized.substring(0, 100);
    };

    // Validate and sanitize inputs
    const sanitizedDocumentType = documentType.replace(/[^a-zA-Z0-9_-]/g, "_");
    const sanitizedOriginalName = sanitizeFilename(file.name);

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${user.id}/${sanitizedDocumentType}_${timestamp}_${sanitizedOriginalName}`;
    // In sandbox, prefix uploads to a safe folder; otherwise use production path
    const storagePath = sandbox
      ? `sandbox/verification-documents/${filename}`
      : `verification-documents/${filename}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("documents")
      .upload(storagePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { ok: false, error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Create document record (skipped in sandbox)
    let documentRecord: any = null;
    if (!sandbox) {
      const documentInsert: Inserts<"verification_documents"> = {
        request_id: verificationRequestId!,
        doc_type: documentType,
        storage_path: storagePath,
        mime_type: file.type,
        size_bytes: file.size,
        original_filename: file.name,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: inserted, error: docError } = await supabaseAdmin
        .from("verification_documents")
        .insert(documentInsert)
        .select()
        .maybeSingle();

      if (docError || !inserted) {
        // Clean up uploaded file on error
        await supabaseAdmin.storage.from("documents").remove([storagePath]);

        console.error("Error creating document record:", docError);
        return NextResponse.json(
          { ok: false, error: "Failed to save document record" },
          { status: 500 }
        );
      }
      documentRecord = inserted;
    }

    // Get public URL for the uploaded file
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from("documents").getPublicUrl(storagePath);

    return NextResponse.json({
      ok: true,
      data: sandbox
        ? {
            id: "sandbox",
            request_id: null,
            doc_type: documentType,
            url: publicUrl,
            status: "pending",
            created_at: new Date().toISOString(),
          }
        : {
            id: documentRecord.id,
            request_id: verificationRequestId,
            doc_type: documentType,
            url: publicUrl,
            status: documentRecord.status,
            created_at: documentRecord.created_at,
          },
      message: sandbox
        ? "Document uploaded successfully (sandbox, no DB writes)"
        : "Document uploaded successfully",
    });
  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json(
      { ok: false, error: "Something went wrong" },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch user's documents
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(request);

    // Get current user
    const user = await getCurrentUser(supabase);
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Fetch verification request and documents
    const { data: verificationRequest } = await supabaseAdmin
      .from("verification_requests")
      .select(
        `
        *,
        verification_documents (*)
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!verificationRequest) {
      return NextResponse.json({
        ok: true,
        data: {
          request: null,
          documents: [],
        },
      });
    }

    // Get public URLs for documents
    const documentsWithUrls =
      verificationRequest.verification_documents?.map((doc: any) => {
        const {
          data: { publicUrl },
        } = supabaseAdmin.storage
          .from("documents")
          .getPublicUrl(doc.storage_path);

        return {
          ...doc,
          url: publicUrl,
        };
      }) || [];

    return NextResponse.json({
      ok: true,
      data: {
        request: {
          id: verificationRequest.id,
          status: verificationRequest.status,
          created_at: verificationRequest.created_at,
          submitted_at: verificationRequest.submitted_at,
          reviewed_at: verificationRequest.reviewed_at,
          rejection_reason: verificationRequest.rejection_reason,
        },
        documents: documentsWithUrls,
      },
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}
