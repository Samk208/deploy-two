import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { ensureTypedClient } from "@/lib/supabase/types"
import { verifyUserSchema, uuidSchema } from "@/lib/validators"
import { getCurrentUser, hasRole } from "@/lib/auth-helpers"
import { UserRole, type ApiResponse } from "@/lib/types"
import { type Updates } from "@/lib/supabase/server"

// Declare runtime for Node.js-specific operations
export const runtime = 'nodejs'

interface VerifyUserResult {
  userId: string
  verified: boolean
  notes?: string
  updatedAt: string
}

// PUT /api/admin/users/[id]/verify - Verify or unverify a user (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = ensureTypedClient(await createServerSupabaseClient())
    const user = await getCurrentUser(supabase)
    if (!user || !hasRole(user, [UserRole.ADMIN])) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized" },
        { status: 403 }
      )
    }

    const { id } = await params
    const validation = uuidSchema.safeParse(id)
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, message: "Invalid user ID" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const verifyValidation = verifyUserSchema.safeParse(body)
    
    if (!verifyValidation.success) {
      const errors: Record<string, string> = {}
      verifyValidation.error.errors.forEach((error) => {
        errors[error.path[0] as string] = error.message
      })
      
      return NextResponse.json(
        { ok: false, message: "Invalid verification data", errors },
        { status: 400 }
      )
    }

    const { verified, notes } = verifyValidation.data

    // Check if user exists with proper type inference
    const fetchQuery = supabase
      .from('user_admin_view')
      .select('id, email, name, role')
      .eq('id', id)
      .maybeSingle()
    
    const { data: targetUser, error: fetchError } = await fetchQuery

    if (fetchError || !targetUser) {
      return NextResponse.json(
        { ok: false, message: "User not found" },
        { status: 404 }
      )
    }

    // Update user verification status in profiles table
    const updateData = {
      verified,
      updated_at: new Date().toISOString(),
    }
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select('id, verified, updated_at')
      .maybeSingle()
    


    if (updateError || !updatedProfile) {
      console.error('User verification error:', updateError)
      return NextResponse.json(
        { ok: false, message: "Failed to update user verification" },
        { status: 500 }
      )
    }

    // Log the verification action (optional - could be added to an audit table)
    console.log(`Admin ${user.email} ${verified ? 'verified' : 'unverified'} user ${targetUser.email}${notes ? ` with notes: ${notes}` : ''}`)

    const result: VerifyUserResult = {
      userId: updatedProfile.id,
      verified: updatedProfile.verified,
      notes,
      updatedAt: updatedProfile.updated_at,
    }

    return NextResponse.json({
      ok: true,
      data: result,
      message: `User ${verified ? 'verified' : 'unverified'} successfully`,
    } as ApiResponse<VerifyUserResult>)
  } catch (error) {
    console.error('User verification error:', error)
    return NextResponse.json(
      { ok: false, message: "Something went wrong" },
      { status: 500 }
    )
  }
}
