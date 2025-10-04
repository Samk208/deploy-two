import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth-helpers"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { mapOnboardingRoleToDbRole } from "@/lib/role-mapper"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createServerSupabaseClient(request)
    const user = await getCurrentUser(supabase)
    
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    // 2. Parse and validate request body
    const body = await request.json()
    const { role } = body

    // Check if user is already an admin (bypass onboarding validation)
    const { data: currentProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
    
    const isAdmin = currentProfile?.role === "admin"

    // Admins can skip onboarding validation
    if (isAdmin) {
      // Mark onboarding as completed for admin
      await supabaseAdmin
        .from("onboarding_progress")
        .update({ 
          status: "completed",
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id)

      return NextResponse.json({
        ok: true,
        role: "admin",
        redirectPath: "/admin/dashboard",
        message: "Admin access confirmed"
      })
    }

    if (!role || (role !== "brand" && role !== "influencer")) {
      return NextResponse.json(
        { ok: false, error: "Invalid role specified" },
        { status: 400 }
      )
    }

    // 3. Map onboarding role to database role
    const dbRole = mapOnboardingRoleToDbRole(role)

    // 4. Verify required documents are uploaded (for brands/suppliers)
    if (dbRole === "supplier") {
      // Check if verification request exists and has required documents
      const { data: verificationRequest } = await supabaseAdmin
        .from("verification_requests")
        .select(`
          id,
          status,
          verification_documents!inner (id, doc_type, status)
        `)
        .eq("user_id", user.id)
        .in("status", ["draft", "submitted"])
        .maybeSingle()

      // Define required document types for brands/suppliers
      const requiredDocs = [
        "business_registration",
        "authorized_rep_id",
        "bank_account_book"
      ]

      if (verificationRequest) {
        const uploadedDocTypes = (verificationRequest.verification_documents || []).map(
          (doc: any) => doc.doc_type
        )
        const missingDocs = requiredDocs.filter(docType => !uploadedDocTypes.includes(docType))
        
        if (missingDocs.length > 0) {
          return NextResponse.json(
            { 
              ok: false, 
              error: "Please upload all required verification documents before submitting",
              missingDocuments: missingDocs
            },
            { status: 400 }
          )
        }
      } else {
        return NextResponse.json(
          { 
            ok: false, 
            error: "Please upload verification documents before submitting"
          },
          { status: 400 }
        )
      }
    }
    
    // For influencers, check basic KYC documents
    if (dbRole === "influencer") {
      const { data: verificationRequest } = await supabaseAdmin
        .from("verification_requests")
        .select(`
          id,
          status,
          verification_documents!inner (id, doc_type, status)
        `)
        .eq("user_id", user.id)
        .in("status", ["draft", "submitted"])
        .maybeSingle()

      const requiredDocs = ["id_document", "selfie_photo"]

      if (verificationRequest) {
        const uploadedDocTypes = (verificationRequest.verification_documents || []).map(
          (doc: any) => doc.doc_type
        )
        const missingDocs = requiredDocs.filter(docType => !uploadedDocTypes.includes(docType))
        
        if (missingDocs.length > 0) {
          return NextResponse.json(
            { 
              ok: false, 
              error: "Please upload all required verification documents before submitting",
              missingDocuments: missingDocs
            },
            { status: 400 }
          )
        }
      } else {
        return NextResponse.json(
          { 
            ok: false, 
            error: "Please upload verification documents before submitting"
          },
          { status: 400 }
        )
      }
    }

    // 5. Update profiles.role
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ 
        role: dbRole,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id)

    if (profileError) {
      console.error("Error updating profile role:", profileError)
      return NextResponse.json(
        { ok: false, error: "Failed to update user profile" },
        { status: 500 }
      )
    }

    // 6. Mark verification request as submitted
    const { error: verificationError } = await supabaseAdmin
      .from("verification_requests")
      .update({ 
        status: "submitted",
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("user_id", user.id)
      .in("status", ["draft"]) // Only update draft requests

    // Note: verificationError is non-fatal (user might not have uploaded docs yet)
    if (verificationError) {
      console.warn("Could not update verification request:", verificationError)
    }

    // 7. Mark onboarding progress as completed
    await supabaseAdmin
      .from("onboarding_progress")
      .update({ 
        status: "completed",
        updated_at: new Date().toISOString()
      })
      .eq("user_id", user.id)

    // 8. Determine redirect path based on role
    const redirectPath = dbRole === "influencer" 
      ? "/dashboard/influencer" 
      : "/dashboard/supplier"

    return NextResponse.json({
      ok: true,
      role: dbRole,
      redirectPath,
      message: "Onboarding completed successfully"
    })
  } catch (error) {
    console.error("Onboarding submit error:", error)
    return NextResponse.json(
      { ok: false, error: "Failed to submit onboarding" },
      { status: 500 }
    )
  }
}
