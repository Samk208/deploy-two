import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth-helpers"
import { brandDetailsSchema } from "@/lib/validators"
import { type OnboardingApiResponse, type BrandDetails } from "@/lib/types"
import { type Inserts } from "@/lib/supabase/server"

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get current user
    const user = await getCurrentUser(supabase)
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate input
    const validation = brandDetailsSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          ok: false, 
          error: "Invalid brand data",
          fieldErrors: validation.error.flatten().fieldErrors 
        },
        { status: 400 }
      )
    }

    // Persistence is behind an experimental feature flag until migrations are applied
    if (process.env.EXPERIMENTAL_BRAND_PERSIST === 'true') {
      try {
        const payload = { ...validation.data, user_id: user.id, created_at: new Date().toISOString() }
        const { error: insertError } = await supabase
          .from('brand_details' as any)
          .insert(payload as any)

        if (insertError) {
          console.error('Brand details insert error:', insertError)
          return NextResponse.json(
            { ok: false, error: 'Failed to persist brand details' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          ok: true,
          data: null,
          message: "Brand information submitted successfully"
        } as OnboardingApiResponse<BrandDetails | null>)
      } catch (e) {
        console.error('Brand details persistence exception:', e)
        return NextResponse.json(
          { ok: false, error: 'Unexpected error while saving brand details' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { ok: false, error: 'Brand details persistence is disabled. Enable EXPERIMENTAL_BRAND_PERSIST to store data.' },
      { status: 503 }
    )
  } catch (error) {
    console.error('Brand details error:', error)
    return NextResponse.json(
      { ok: false, error: "Something went wrong" },
      { status: 500 }
    )
  }
}
