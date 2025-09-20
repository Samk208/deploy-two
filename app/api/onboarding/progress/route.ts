import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth-helpers"
import { supabaseAdmin } from "@/lib/supabase/admin"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request)
    const user = await getCurrentUser(supabase)
    if (!user) {
      return NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 })
    }

    const { data: rows, error } = await supabaseAdmin
      .from("onboarding_progress" as any)
      .select("step, current_step, completed_steps, data, role, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error fetching onboarding progress:", error)
      return NextResponse.json({ ok: false, error: "Failed to fetch progress" }, { status: 500 })
    }

    // Merge results by step, latest wins
    const byStep: Record<number, any> = {}
    let latestCurrentStep = 1
    const completedUnion = new Set<number>()
    let role: "influencer" | "brand" | undefined

    for (const row of ((rows as any[]) || [])) {
      const step = Number((row as any).step)
      byStep[step] = {
        step,
        data: (row as any).data || {},
        updated_at: (row as any).updated_at,
      }
      latestCurrentStep = Math.max(latestCurrentStep, Number((row as any).current_step || step))
      for (const s of (((row as any).completed_steps as number[] | null) || [])) {
        completedUnion.add(s)
      }
      role = ((row as any).role as any) || role
    }

    return NextResponse.json({
      ok: true,
      data: {
        role: role || user.role,
        currentStep: latestCurrentStep,
        completedSteps: Array.from(completedUnion).sort((a, b) => a - b),
        steps: Object.values(byStep).sort((a: any, b: any) => a.step - b.step),
      },
    })
  } catch (e) {
    console.error("Unexpected error in GET /api/onboarding/progress:", e)
    return NextResponse.json({ ok: false, error: "Something went wrong" }, { status: 500 })
  }
}
