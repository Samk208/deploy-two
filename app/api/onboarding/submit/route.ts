import { getCurrentUser } from "@/lib/auth-helpers";
import { mapOnboardingRoleToDbRole } from "@/lib/role-mapper";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // 1) Auth
    const supabase = await createServerSupabaseClient(request);
    const user = await getCurrentUser(supabase);

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // 2) Body
    const body = await request.json();
    const { role } = body;

    // 3) Admin check
    const { data: currentProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = currentProfile?.role === "admin";

    if (isAdmin) {
      const { error: adminOnboardingError } = (supabaseAdmin as any)
        .from("onboarding_progress")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (adminOnboardingError) {
        console.error(
          "Admin onboarding_progress update failed:",
          adminOnboardingError
        );
        return NextResponse.json(
          { ok: false, error: "Failed to finalize admin onboarding" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        role: "admin",
        redirectPath: "/admin/dashboard",
        message: "Admin access confirmed",
      });
    }

    // 4) Role validation
    if (!role || (role !== "brand" && role !== "influencer")) {
      return NextResponse.json(
        { ok: false, error: "Invalid role specified" },
        { status: 400 }
      );
    }
    const dbRole = mapOnboardingRoleToDbRole(role);

    // Helper
    async function validateRequiredDocuments(
      userId: string,
      requiredDocs: string[]
    ): Promise<
      { ok: true } | { ok: false; error: string; missingDocuments?: string[] }
    > {
      const { data: verificationRequest } = await supabaseAdmin
        .from("verification_requests")
        .select(
          `
          id,
          status,
          verification_documents!inner (id, doc_type, status)
        `
        )
        .eq("user_id", userId)
        .in("status", ["draft", "submitted"])
        .maybeSingle();

      if (!verificationRequest) {
        return {
          ok: false,
          error: "Please upload verification documents before submitting",
        };
      }

      const uploaded = (verificationRequest.verification_documents || []).map(
        (d: any) => d.doc_type
      );
      const missing = requiredDocs.filter((req) => !uploaded.includes(req));
      if (missing.length > 0) {
        return {
          ok: false,
          error:
            "Please upload all required verification documents before submitting",
          missingDocuments: missing,
        };
      }
      return { ok: true };
    }

    // 5) Validate docs
    if (dbRole === "supplier") {
      const check = await validateRequiredDocuments(user.id, [
        "business_registration",
        "authorized_rep_id",
        "bank_account_book",
      ]);
      if (!check.ok) {
        return NextResponse.json(
          {
            ok: false,
            error: (check as any).error,
            missingDocuments: (check as any).missingDocuments,
          },
          { status: 400 }
        );
      }
    } else if (dbRole === "influencer") {
      const check = await validateRequiredDocuments(user.id, [
        "id_document",
        "selfie_photo",
      ]);
      if (!check.ok) {
        return NextResponse.json(
          {
            ok: false,
            error: (check as any).error,
            missingDocuments: (check as any).missingDocuments,
          },
          { status: 400 }
        );
      }
    }

    // 6) Update profiles.role
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        role: dbRole,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileError) {
      console.error("Error updating profile role:", profileError);
      return NextResponse.json(
        { ok: false, error: "Failed to update user profile" },
        { status: 500 }
      );
    }

    // 7) Mark verification request submitted (non-fatal)
    const { error: verificationError } = await supabaseAdmin
      .from("verification_requests")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .in("status", ["draft"]);
    if (verificationError) {
      console.warn("Could not update verification request:", verificationError);
    }

    // 8) Complete onboarding (fatal on error)
    const { error: onboardingError } = (supabaseAdmin as any)
      .from("onboarding_progress")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);
    if (onboardingError) {
      console.error("Error updating onboarding_progress:", onboardingError);
      return NextResponse.json(
        { ok: false, error: "Failed to mark onboarding as completed" },
        { status: 500 }
      );
    }

    // 9) Redirect
    const redirectPath =
      dbRole === "influencer" ? "/dashboard/influencer" : "/dashboard/supplier";
    return NextResponse.json({
      ok: true,
      role: dbRole,
      redirectPath,
      message: "Onboarding completed successfully",
    });
  } catch (error) {
    console.error("Onboarding submit error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to submit onboarding" },
      { status: 500 }
    );
  }
}
