import { type NextRequest, NextResponse } from "next/server"

const simulateNetworkDelay = () => new Promise((resolve) => setTimeout(resolve, Math.random() * 1000 + 300))

export async function POST(request: NextRequest) {
  try {
    await simulateNetworkDelay()

    const body = await request.json()
    const { name, displayName, country, phone, preferredLanguage, marketingOptIn } = body

    // Validate required fields
    if (!name || !displayName || !country || !phone || !preferredLanguage) {
      return NextResponse.json(
        {
          success: false,
          error: "Please fill in all required fields",
          fieldErrors: {
            name: !name ? "Name is required" : undefined,
            displayName: !displayName ? "Display name is required" : undefined,
            country: !country ? "Country is required" : undefined,
            phone: !phone ? "Phone number is required" : undefined,
            preferredLanguage: !preferredLanguage ? "Preferred language is required" : undefined,
          },
        },
        { status: 400 },
      )
    }

    // Simulate occasional validation errors
    if (Math.random() < 0.1) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          fieldErrors: {
            displayName: "This display name is not allowed",
          },
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Step 1 data saved successfully",
      step: 1,
      data: {
        name,
        displayName,
        country,
        phone,
        preferredLanguage,
        marketingOptIn: marketingOptIn || false,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to save step data",
      },
      { status: 500 },
    )
  }
}
