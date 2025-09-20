import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { ensureTypedClient } from "@/lib/supabase/types"
import { getCurrentUser, hasRole } from "@/lib/auth-helpers"
import { verificationReviewSchema, uuidSchema } from "@/lib/validators"
import { UserRole, type OnboardingApiResponse, type VerificationRequest } from "@/lib/types"
import { QueryData } from '@supabase/supabase-js'
import { type Updates } from "@/lib/supabase/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params
    const supabase = ensureTypedClient(await createServerSupabaseClient())
    
    // Get current user and check admin permissions
    const user = await getCurrentUser(supabase)
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    if (!hasRole(user, [UserRole.ADMIN])) {
      return NextResponse.json(
        { ok: false, error: "Admin access required" },
        { status: 403 }
      )
    }

    // Validate request ID
    const requestIdValidation = uuidSchema.safeParse(requestId)
    if (!requestIdValidation.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid request ID" },
        { status: 400 }
      )
    }

    const body = await request.json()
    
    // Validate review data
    const validation = verificationReviewSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          ok: false, 
          error: "Invalid review data",
          fieldErrors: validation.error.flatten().fieldErrors 
        },
        { status: 400 }
      )
    }

    const { status, rejection_reason } = validation.data

    // Validate rejection reason is provided when rejecting
    if (status === 'rejected' && !rejection_reason) {
      return NextResponse.json(
        { 
          ok: false, 
          error: "Rejection reason is required when rejecting",
          fieldErrors: { rejection_reason: ["Rejection reason is required"] }
        },
        { status: 400 }
      )
    }

    // Get verification request to check it exists and is in correct state
    const query = supabase
      .from('verification_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle()
    
    type VerificationRequestRow = QueryData<typeof query>
    const { data: verificationRequest, error: fetchError } = await query

    if (fetchError || !verificationRequest) {
      console.error('Verification request fetch error:', fetchError)
      return NextResponse.json(
        { ok: false, error: "Verification request not found" },
        { status: 404 }
      )
    }

    // Check if request is in a reviewable state
    if (!['submitted', 'in_review'].includes(verificationRequest.status)) {
      return NextResponse.json(
        { 
          ok: false, 
          error: `Cannot review request with status: ${verificationRequest.status}`,
          fieldErrors: { status: [`Request must be submitted or in review to be reviewed`] }
        },
        { status: 400 }
      )
    }

    // Update verification request
    type VerificationRequestUpdate = Updates<'verification_requests'>
    const updateData: VerificationRequestUpdate = {
      status,
      rejection_reason: status === 'rejected' ? rejection_reason : null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      updated_at: new Date().toISOString(),
    }
    
    const updateQuery = supabase
      .from('verification_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .maybeSingle()
    
    type UpdatedVerificationRequestRow = QueryData<typeof updateQuery>
    const { data: updatedRequest, error: updateError } = await updateQuery

    if (updateError || !updatedRequest) {
      console.error('Verification request update error:', updateError)
      return NextResponse.json(
        { ok: false, error: "Failed to update verification request" },
        { status: 500 }
      )
    }

    // If verified, update user role (write to profiles table)
    if (status === 'verified') {
      type ProfileUpdate = Updates<'profiles'>
      const userUpdateData: ProfileUpdate = {
        role: verificationRequest.role,
        updated_at: new Date().toISOString(),
      }
      
      const { error: userError } = await supabase
        .from('profiles')
        .update(userUpdateData)
        .eq('id', verificationRequest.user_id)

      if (userError) {
        console.error('User update error:', userError)
        // Don't fail the request, but log the error
        console.warn(`Failed to update user role for user ${verificationRequest.user_id}`)
      }
    }

    console.log(`Verification request ${requestId} ${status} by admin ${user.id}`)

    return NextResponse.json({
      ok: true,
      data: updatedRequest,
      message: `Verification request ${status} successfully`
    } as OnboardingApiResponse<VerificationRequest>)
  } catch (error) {
    console.error('Verification review error:', error)
    return NextResponse.json(
      { ok: false, error: "Something went wrong" },
      { status: 500 }
    )
  }
}
