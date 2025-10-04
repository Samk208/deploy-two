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
      const { socialLinks, audienceSize, nicheTags, bio } = body

      // Validate influencer-specific fields
      if (!socialLinks || (!socialLinks.youtube && !socialLinks.instagram && !socialLinks.tiktok)) {
        return NextResponse.json(
          {
            success: false,
            error: "Please provide at least one social media link",
          },
          { status: 400 },
        )
      }

      if (!audienceSize || !nicheTags || nicheTags.length === 0 || !bio) {
        return NextResponse.json(
          {
            success: false,
            error: "Please fill in all required fields",
          },
          { status: 400 },
        )
      }

      // Persist partial progress
      try {
        const safeData = { socialLinks, audienceSize, nicheTags, bio, role }
        const currentStep = Number(body.currentStep) || 2
        const completedSteps: number[] = Array.isArray(body.completedSteps) ? body.completedSteps : []
        const dbRole = mapOnboardingRoleToDbRole(role)
        const { error: upsertError } = await (supabaseAdmin
          .from("onboarding_progress" as any)
          .upsert(
            {
              user_id: user.id,
              role: dbRole,
              step: 2,
              current_step: currentStep,
              completed_steps: completedSteps,
              data: safeData as any,
              status: "draft",
              updated_at: new Date().toISOString(),
            } as any,
            { onConflict: "user_id,step" } as any,
          ))
        if (upsertError) console.error("onboarding_progress upsert error (step-2 influencer):", upsertError)
      } catch (e) {
        console.error("Unexpected error saving onboarding progress (step-2 influencer):", e)
      }

      return NextResponse.json({
        success: true,
        message: "Influencer profile saved successfully",
        step: 2,
        data: { socialLinks, audienceSize, nicheTags, bio },
      })
    } else if (role === "brand") {
      const { legalEntityName, tradeName, website, supportEmail, businessAddress, businessPhone, taxCountry } = body

      // Validate brand-specific fields
      if (
        !legalEntityName ||
        !tradeName ||
        !website ||
        !supportEmail ||
        !businessAddress ||
        !businessPhone ||
        !taxCountry
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Please fill in all required fields",
          },
          { status: 400 },
        )
      }

      // Persist partial progress
      try {
        const safeData = {
          legalEntityName,
          tradeName,
          website,
          supportEmail,
          businessAddress,
          businessPhone,
          taxCountry,
          role,
        }
        const currentStep = Number(body.currentStep) || 2
        const completedSteps: number[] = Array.isArray(body.completedSteps) ? body.completedSteps : []
        const dbRole = mapOnboardingRoleToDbRole(role)
        const { error: upsertError } = await (supabaseAdmin
          .from("onboarding_progress" as any)
          .upsert(
            {
              user_id: user.id,
              role: dbRole,
              step: 2,
              current_step: currentStep,
              completed_steps: completedSteps,
              data: safeData as any,
              status: "draft",
              updated_at: new Date().toISOString(),
            } as any,
            { onConflict: "user_id,step" } as any,
          ))
        if (upsertError) console.error("onboarding_progress upsert error (step-2 brand):", upsertError)
      } catch (e) {
        console.error("Unexpected error saving onboarding progress (step-2 brand):", e)
      }

      return NextResponse.json({
        success: true,
        message: "Brand profile saved successfully",
        step: 2,
        data: {
          legalEntityName,
          tradeName,
          website,
          supportEmail,
          businessAddress,
          businessPhone,
          taxCountry,
        },
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
        error: "Failed to save step data",
      },
      { status: 500 },
    )
  }
}
