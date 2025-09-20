import { type NextRequest, NextResponse } from "next/server"

const simulateNetworkDelay = () => new Promise((resolve) => setTimeout(resolve, Math.random() * 1000 + 500))

export async function POST(request: NextRequest) {
  try {
    await simulateNetworkDelay()

    const body = await request.json()
    const { phone } = body

    if (!phone || phone.length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid phone number",
        },
        { status: 400 },
      )
    }

    // Simulate rate limiting
    if (Math.random() < 0.1) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many OTP requests. Please try again in 5 minutes.",
        },
        { status: 429 },
      )
    }

    // Generate mock OTP (in real app, this would be sent via SMS)
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    console.log(`[Mock OTP] Phone: ${phone}, Code: ${otp}`)

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      // In development, return the OTP for testing
      ...(process.env.NODE_ENV === "development" && { otp }),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send OTP",
      },
      { status: 500 },
    )
  }
}
