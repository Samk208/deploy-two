import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth-helpers"
import { supabaseAdmin } from "@/lib/supabase/admin"

const simulateNetworkDelay = () => new Promise((resolve) => setTimeout(resolve, Math.random() * 1000 + 300))

export async function POST(request: NextRequest) {
  try {
    await simulateNetworkDelay()

    const body = await request.json()
    const { role, defaultCommission } = body

    // Authenticate user
    const supabase = createServerSupabaseClient(request)
    const user = await getCurrentUser(supabase)
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      )
    }

    if (!defaultCommission || defaultCommission < 5 || defaultCommission > 95) {
      return NextResponse.json(
        {
          success: false,
          error: "Please set a valid commission rate",
        },
        { status: 400 },
      )
    }

    if (role === "influencer") {
      // Persist partial progress
      try {
        const safeData = { defaultCommission, role }
        const currentStep = Number(body.currentStep) || 4
        const completedSteps: number[] = Array.isArray(body.completedSteps) ? body.completedSteps : []
        const { error: upsertError } = await (supabaseAdmin
          .from("onboarding_progress" as any)
          .upsert(
            {
              user_id: user.id,
              role: role === "brand" ? "brand" : "influencer",
              step: 4,
              current_step: currentStep,
              completed_steps: completedSteps,
              data: safeData as any,
              status: "draft",
              updated_at: new Date().toISOString(),
            } as any,
            { onConflict: "user_id,step" } as any,
          ))
        if (upsertError) console.error("onboarding_progress upsert error (step-4 influencer):", upsertError)
      } catch (e) {
        console.error("Unexpected error saving onboarding progress (step-4 influencer):", e)
      }

      return NextResponse.json({
        success: true,
        message: "Commission preferences saved successfully",
        step: 4,
        data: { defaultCommission },
      })
    } else if (role === "brand") {
      const { minCommission, maxCommission, currency } = body

      if (!minCommission || !maxCommission || !currency) {
        return NextResponse.json(
          {
            success: false,
            error: "Please fill in all commission settings",
          },
          { status: 400 },
        )
      }

      if (minCommission >= maxCommission) {
        return NextResponse.json(
          {
            success: false,
            error: "Maximum commission must be higher than minimum commission",
          },
          { status: 400 },
        )
      }

      // Persist partial progress
      try {
        const safeData = { defaultCommission, minCommission, maxCommission, currency, role }
        const currentStep = Number(body.currentStep) || 4
        const completedSteps: number[] = Array.isArray(body.completedSteps) ? body.completedSteps : []
        const { error: upsertError } = await (supabaseAdmin
          .from("onboarding_progress" as any)
          .upsert(
            {
              user_id: user.id,
              role: role === "brand" ? "brand" : "influencer",
              step: 4,
              current_step: currentStep,
              completed_steps: completedSteps,
              data: safeData as any,
              status: "draft",
              updated_at: new Date().toISOString(),
            } as any,
            { onConflict: "user_id,step" } as any,
          ))
        if (upsertError) console.error("onboarding_progress upsert error (step-4 brand):", upsertError)
      } catch (e) {
        console.error("Unexpected error saving onboarding progress (step-4 brand):", e)
      }

      return NextResponse.json({
        success: true,
        message: "Commission settings saved successfully",
        step: 4,
        data: { defaultCommission, minCommission, maxCommission, currency },
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
        error: "Failed to save commission settings",
      },
      { status: 500 },
    )
  }
}
