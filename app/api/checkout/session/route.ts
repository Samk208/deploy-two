import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Server-side enforcement: never allow mock checkout in production
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Mock checkout is disabled in production' },
        { status: 403 }
      )
    }

    // Optional server-only flag to explicitly enable mock sessions in non-prod
    if (process.env.USE_MOCK_CHECKOUT !== 'true') {
      return NextResponse.json(
        { error: 'Mock checkout is disabled by server configuration' },
        { status: 403 }
      )
    }

    // Parse the request body to get cart items and customer info
    const body = await request.json()
    const { items, customerInfo, shippingAddress } = body

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mock Stripe session creation
    // In production, this would create a real Stripe checkout session
    const mockSession = {
      id: `cs_${Math.random().toString(36).substr(2, 9)}`,
      url: "/order/success?session_id=" + `cs_${Math.random().toString(36).substr(2, 9)}`,
      payment_status: "pending",
    }

    return NextResponse.json({
      url: mockSession.url,
      sessionId: mockSession.id,
    })
  } catch (error) {
    console.error("Checkout session creation failed:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
