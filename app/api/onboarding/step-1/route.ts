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
    const { name, displayName, country, phone, preferredLanguage, marketingOptIn } = body

    // Authenticate user
    const supabase = await createServerSupabaseClient(request)
    const user = await getCurrentUser(supabase)
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      )
    }

    // Validate required fields
    if (!name || !displayName || !country || !phone || !preferredLanguage) {
      return NextResponse.json(
        {
          success: false,
          error: "Please fill in all required fields",
          fieldErrors: {
            name: !name ? "Name is required" : undefined,
            displayName: !displayName ? "Display name is required" : undefined,
            country: !country ? "Country is required" : undefined,
            phone: !phone ? "Phone number is required" : undefined,
            preferredLanguage: !preferredLanguage ? "Preferred language is required" : undefined,
          },
        },
        { status: 400 },
      )
    }

    // Simulate occasional validation errors
    if (Math.random() < 0.1) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          fieldErrors: {
            displayName: "This display name is not allowed",
          },
        },
        { status: 400 },
      )
    }

    // Map onboarding role to database role and update profiles.role immediately
    const dbRole = mapOnboardingRoleToDbRole(body.role)
    try {
      await supabaseAdmin
        .from("profiles")
        .update({ role: dbRole })
        .eq("id", user.id)
    } catch (e) {
      console.error("Error updating profile role in step-1:", e)
    }

    // Persist partial progress (non-breaking; also keep localStorage behavior on frontend)
    try {
      const safeData = {
        name,
        displayName,
        country,
        phone,
        preferredLanguage,
        marketingOptIn: Boolean(marketingOptIn),
        phoneVerified: Boolean(body.phoneVerified),
        role: body.role,
      }

      // Determine current/completed steps from body if present
      const currentStep = Number(body.currentStep) || 1
      const completedSteps: number[] = Array.isArray(body.completedSteps) ? body.completedSteps : []

      // Upsert into onboarding_progress (unique per user_id + step)
      const { error: upsertError } = await (supabaseAdmin
        .from("onboarding_progress" as any)
        .upsert(
          {
            user_id: user.id,
            role: dbRole, // Use the mapped database role
            step: 1,
            current_step: currentStep,
            completed_steps: completedSteps,
            data: safeData as any,
            status: "draft",
            updated_at: new Date().toISOString(),
          } as any,
          { onConflict: "user_id,step" } as any,
        ))

      if (upsertError) {
        // Log but do not break UX
        console.error("onboarding_progress upsert error (step-1):", upsertError)
      }
    } catch (e) {
      console.error("Unexpected error saving onboarding progress (step-1):", e)
    }

    return NextResponse.json({
      success: true,
      message: "Step 1 data saved successfully",
      step: 1,
      data: {
        name,
        displayName,
        country,
        phone,
        preferredLanguage,
        marketingOptIn: marketingOptIn || false,
      },
    })
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
