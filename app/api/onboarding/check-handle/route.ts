import { type NextRequest, NextResponse } from "next/server"

const simulateNetworkDelay = () => new Promise((resolve) => setTimeout(resolve, Math.random() * 1000 + 500))

// Mock taken handles for testing
const takenHandles = ["admin", "support", "onelink", "test", "demo", "api", "www", "mail", "ftp", "blog"]

export async function POST(request: NextRequest) {
  try {
    await simulateNetworkDelay()

    const body = await request.json()
    const { displayName } = body

    if (!displayName || displayName.length < 2) {
      return NextResponse.json(
        {
          available: false,
          error: "Display name must be at least 2 characters",
        },
        { status: 400 },
      )
    }

    // Check if handle is taken (case-insensitive)
    const isAvailable = !takenHandles.includes(displayName.toLowerCase())

    // Simulate some random unavailability for testing
    const randomUnavailable = Math.random() < 0.2

    return NextResponse.json({
      available: isAvailable && !randomUnavailable,
      displayName,
    })
  } catch (error) {
    return NextResponse.json(
      {
        available: false,
        error: "Failed to check availability",
      },
      { status: 500 },
    )
  }
}
