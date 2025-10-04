import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth-helpers"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { mapOnboardingRoleToDbRole } from "@/lib/role-mapper"

const simulateNetworkDelay = () => new Promise((resolve) => setTimeout(resolve, Math.random() * 1000 + 300))

export async function POST(request: NextRequest) {
  try {
    await simulateNetworkDelay()

    const body = await request.json()
    const { role } = body

    // Authenticate user
    const supabase = await createServerSupabaseClient(request)
    const user = await getCurrentUser(supabase)
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      )
    }

    if (role === "influencer") {
      const { bankAccountHolder, bankAccount } = body

      // Validate KYC fields
      if (!bankAccountHolder || !bankAccount) {
        return NextResponse.json(
          {
            success: false,
            error: "Please provide bank account information",
            fieldErrors: {
              bankAccountHolder: !bankAccountHolder ? "Account holder name is required" : undefined,
              bankAccount: !bankAccount ? "Account number is required" : undefined,
            },
          },
          { status: 400 },
        )
      }

      // Persist partial progress
      try {
        const safeData = { bankAccountHolder, bankAccount, role }
        const currentStep = Number(body.currentStep) || 3
        const completedSteps: number[] = Array.isArray(body.completedSteps) ? body.completedSteps : []
        const dbRole = mapOnboardingRoleToDbRole(role)
        const { error: upsertError } = await (supabaseAdmin
          .from("onboarding_progress" as any)
          .upsert(
            {
              user_id: user.id,
              role: dbRole,
              step: 3,
              current_step: currentStep,
              completed_steps: completedSteps,
              data: safeData as any,
              status: "draft",
              updated_at: new Date().toISOString(),
            } as any,
            { onConflict: "user_id,step" } as any,
          ))
        if (upsertError) console.error("onboarding_progress upsert error (step-3 influencer):", upsertError)
      } catch (e) {
        console.error("Unexpected error saving onboarding progress (step-3 influencer):", e)
      }

      return NextResponse.json({
        success: true,
        message: "KYC information saved successfully",
        step: 3,
        data: { bankAccountHolder, bankAccount },
        verificationStatus: "submitted",
      })
    } else if (role === "brand") {
      const { businessId } = body

      // Validate KYB fields
      if (!businessId) {
        return NextResponse.json(
          {
            success: false,
            error: "Business ID is required",
            fieldErrors: {
              businessId: "Business ID is required",
            },
          },
          { status: 400 },
        )
      }

      // Persist partial progress
      try {
        const safeData = { businessId, role }
        const currentStep = Number(body.currentStep) || 3
        const completedSteps: number[] = Array.isArray(body.completedSteps) ? body.completedSteps : []
        const dbRole = mapOnboardingRoleToDbRole(role)
        const { error: upsertError } = await (supabaseAdmin
          .from("onboarding_progress" as any)
          .upsert(
            {
              user_id: user.id,
              role: dbRole,
              step: 3,
              current_step: currentStep,
              completed_steps: completedSteps,
              data: safeData as any,
              status: "draft",
              updated_at: new Date().toISOString(),
            } as any,
            { onConflict: "user_id,step" } as any,
          ))
        if (upsertError) console.error("onboarding_progress upsert error (step-3 brand):", upsertError)
      } catch (e) {
        console.error("Unexpected error saving onboarding progress (step-3 brand):", e)
      }

      return NextResponse.json({
        success: true,
        message: "KYB information saved successfully",
        step: 3,
        data: { businessId },
        verificationStatus: "submitted",
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid role specified",
      },
      { status: 400 },
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to save verification data",
      },
      { status: 500 },
    )
  }
}
