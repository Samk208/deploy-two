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

    // 3) Check if we're in dry-run mode (freeze protection)
    const isDryRun =
      process.env.DRY_RUN_ONBOARDING === "true" ||
      process.env.CORE_FREEZE === "true";

    // 3) Admin check
    const { data: currentProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = currentProfile?.role === "admin";

    if (isAdmin) {
      // Dry-run mode for admin onboarding
      if (isDryRun) {
        return NextResponse.json({
          ok: true,
          dryRun: true,
          role: "admin",
          redirectPath: "/admin/dashboard",
          message: "DRY RUN: Would finalize admin onboarding and redirect to /admin/dashboard",
        });
      }

      const { error: adminOnboardingError } = await (supabaseAdmin as any)
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
    // Verify email before document checks
    const { data: profileRow, error: profileCheckError } = await supabaseAdmin
      .from('profiles' as any)
      .select('email_verified')
      .eq('id', user.id)
      .maybeSingle();
    if (profileCheckError) {
      console.warn('profiles.email_verified check error:', profileCheckError);
    }
    if (!((profileRow as any)?.email_verified === true)) {
      return NextResponse.json(
        { ok: false, error: 'Email verification required', message: '이메일 인증이 필요합니다' },
        { status: 400 }
      );
    }

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

      const uploadedRaw = (verificationRequest.verification_documents || []).map(
        (d: any) => String(d.doc_type)
      );

      // Alias map to tolerate legacy names
      const aliasMap: Record<string, string[]> = {
        // canonical: [legacy aliases]
        bank_account_book: ["bank_verification"],
        bank_book: ["bank_statement", "proof_of_address"],
        government_id: ["id_document", "selfie_photo", "selfie_verification"],
        mail_order_sales_report: ["business_license"],
      };

      const uploadedExpanded = new Set<string>();
      for (const u of uploadedRaw) {
        uploadedExpanded.add(u);
        // if this uploaded type is a legacy alias of a new one, also add the new name
        for (const [canonical, aliases] of Object.entries(aliasMap)) {
          if (aliases.includes(u)) uploadedExpanded.add(canonical);
        }
        // also add all aliases of the uploaded canonical type
        if (aliasMap[u]) {
          for (const a of aliasMap[u]) uploadedExpanded.add(a);
        }
      }

      const missing = requiredDocs.filter((req) => !uploadedExpanded.has(req));
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
      // Supplier requires 3 physical documents
      const check = await validateRequiredDocuments(user.id, [
        "business_registration",
        "bank_account_book",
        "mail_order_sales_report",
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
      // Influencer requires 2 physical documents (3rd optional)
      const check = await validateRequiredDocuments(user.id, [
        "government_id",
        "bank_book",
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

    // 6) Dry-run mode: Skip all writes and return "would do" response
    const redirectPath =
      dbRole === "influencer" ? "/dashboard/influencer" : "/dashboard/supplier";

    if (isDryRun) {
      return NextResponse.json({
        ok: true,
        dryRun: true,
        role: dbRole,
        redirectPath,
        message: `DRY RUN: Would update role to '${dbRole}', mark onboarding complete, and redirect to ${redirectPath}. Validation passed for all required documents.`,
      });
    }

    // 7) Update profiles.role
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

    // 8) Mark verification request submitted (non-fatal)
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

    // 9) Complete onboarding (fatal on error)
    const { error: onboardingError } = await (supabaseAdmin as any)
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

    // 10) Return success with redirect
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
