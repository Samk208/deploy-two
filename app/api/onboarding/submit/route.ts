import { type NextRequest, NextResponse } from "next/server"

const simulateNetworkDelay = () => new Promise((resolve) => setTimeout(resolve, Math.random() * 2000 + 1000))

export async function POST(request: NextRequest) {
  try {
    await simulateNetworkDelay()

    const body = await request.json()
    const { role, name, displayName, email } = body

    // Simulate occasional submission failures
    if (Math.random() < 0.05) {
      return NextResponse.json(
        {
          success: false,
          error: "Submission failed due to server error. Please try again.",
        },
        { status: 500 },
      )
    }

    // Generate mock application ID
    const applicationId = `APP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully",
      applicationId,
      status: "under_review",
      estimatedReviewTime: "2-3 business days",
      data: {
        role,
        name,
        displayName,
        submittedAt: new Date().toISOString(),
        reviewStatus: "pending",
      },
      nextSteps: [
        "Your application is now under review",
        "You'll receive an email notification once approved",
        "Check your email for further instructions",
        role === "influencer"
          ? "Start planning your first product collaborations"
          : "Prepare your product catalog for upload",
      ],
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to submit application. Please try again.",
      },
      { status: 500 },
    )
  }
}
