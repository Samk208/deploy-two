import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { resetPasswordSchema } from "@/lib/validators"
import { createAuthErrorResponse } from "@/lib/auth-helpers"
import type { AuthResponse } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validation = resetPasswordSchema.safeParse(body)
    if (!validation.success) {
      const errors: Record<string, string> = {}
      validation.error.errors.forEach((error) => {
        errors[error.path[0] as string] = error.message
      })
      
      return NextResponse.json(
        createAuthErrorResponse("Please enter a valid email address.", errors),
        { status: 400 }
      )
    }

    const { email } = validation.data
    const supabase = await createServerSupabaseClient()

    // Send password reset email via Supabase
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    })

    if (error) {
      console.error('Password reset error:', error)
      // Don't reveal if email exists or not for security
    }

    // Always return success message for security (don't reveal if email exists)
    return NextResponse.json({
      ok: true,
      message: "If an account with this email exists, you will receive a password reset link shortly.",
    } as AuthResponse)
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      createAuthErrorResponse("Something went wrong. Please try again."),
      { status: 500 }
    )
  }
}
