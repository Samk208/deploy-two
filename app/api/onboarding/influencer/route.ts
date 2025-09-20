import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getCurrentUser, hasRole } from "@/lib/auth-helpers"
import { UserRole } from "@/lib/types"
import { encryptSensitiveData } from '@/lib/encryption';
import { type Inserts } from "@/lib/supabase/server"
import { z } from "zod"

const influencerPayoutSchema = z.object({
  bank_name: z.string().min(1, 'Bank name is required'),
  account_holder_name: z.string().min(1, 'Account holder name is required'),
  account_number: z.string().min(1, 'Account number is required'),
  routing_number: z.string().optional(),
  swift_code: z.string().optional(),
  tax_id: z.string().optional(),
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postal_code: z.string().min(1, 'Postal code is required'),
    country: z.string().min(1, 'Country is required')
  })
})

export async function POST(request: NextRequest) {
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

    // Check if user is an influencer
    if (!hasRole(user, [UserRole.INFLUENCER])) {
      return NextResponse.json(
        { ok: false, error: "Influencer access required" },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = influencerPayoutSchema.parse(body)

    // Encrypt sensitive financial data
    const encryptedAccountNumber = encryptSensitiveData(validatedData.account_number)
    const encryptedRoutingNumber = validatedData.routing_number ? encryptSensitiveData(validatedData.routing_number) : null
    const encryptedSwiftCode = validatedData.swift_code ? encryptSensitiveData(validatedData.swift_code) : null
    const encryptedTaxId = validatedData.tax_id ? encryptSensitiveData(validatedData.tax_id) : null

    // For now, just log the payout details since influencer_payouts table doesn't exist
    // TODO: Create influencer_payouts table or store in users table
    console.log(`💰 [AUDIT] User ${user.id} submitted payout details:`, {
      bank_name: validatedData.bank_name,
      account_holder_name: validatedData.account_holder_name,
      // Don't log sensitive data
      has_account_number: !!validatedData.account_number,
      has_routing_number: !!validatedData.routing_number,
      has_swift_code: !!validatedData.swift_code,
      has_tax_id: !!validatedData.tax_id,
      address: validatedData.address
    })

    return NextResponse.json({
      ok: true,
      message: 'Influencer payout details submitted successfully'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: "Invalid input data", details: error.issues },
        { status: 400 }
      )
    }

    console.error('Influencer payout error:', error)
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
