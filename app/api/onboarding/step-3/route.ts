import { type NextRequest, NextResponse } from "next/server"

const simulateNetworkDelay = () => new Promise((resolve) => setTimeout(resolve, Math.random() * 1000 + 300))

export async function POST(request: NextRequest) {
  try {
    await simulateNetworkDelay()

    const body = await request.json()
    const { role } = body

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
