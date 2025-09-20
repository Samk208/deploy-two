import { type NextRequest, NextResponse } from "next/server"

const simulateNetworkDelay = () => new Promise((resolve) => setTimeout(resolve, Math.random() * 1000 + 500))

export async function POST(request: NextRequest) {
  try {
    await simulateNetworkDelay()

    const body = await request.json()
    const { phone, code } = body

    if (!phone || !code) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone number and OTP code are required",
        },
        { status: 400 },
      )
    }

    if (code.length !== 6) {
      return NextResponse.json(
        {
          success: false,
          error: "OTP code must be 6 digits",
        },
        { status: 400 },
      )
    }

    // Mock verification - accept any 6-digit code ending in 0 or 1
    const isValid = code.endsWith("0") || code.endsWith("1") || code === "123456"

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid OTP code. Please try again.",
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Phone number verified successfully",
      verified: true,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to verify OTP",
      },
      { status: 500 },
    )
  }
}
