import { type NextRequest, NextResponse } from "next/server"

const simulateNetworkDelay = () => new Promise((resolve) => setTimeout(resolve, Math.random() * 1000 + 300))

export async function POST(request: NextRequest) {
  try {
    await simulateNetworkDelay()

    const body = await request.json()
    const { role, defaultCommission } = body

    if (!defaultCommission || defaultCommission < 5 || defaultCommission > 95) {
      return NextResponse.json(
        {
          success: false,
          error: "Please set a valid commission rate",
        },
        { status: 400 },
      )
    }

    if (role === "influencer") {
      return NextResponse.json({
        success: true,
        message: "Commission preferences saved successfully",
        step: 4,
        data: { defaultCommission },
      })
    } else if (role === "brand") {
      const { minCommission, maxCommission, currency } = body

      if (!minCommission || !maxCommission || !currency) {
        return NextResponse.json(
          {
            success: false,
            error: "Please fill in all commission settings",
          },
          { status: 400 },
        )
      }

      if (minCommission >= maxCommission) {
        return NextResponse.json(
          {
            success: false,
            error: "Maximum commission must be higher than minimum commission",
          },
          { status: 400 },
        )
      }

      return NextResponse.json({
        success: true,
        message: "Commission settings saved successfully",
        step: 4,
        data: { defaultCommission, minCommission, maxCommission, currency },
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
        error: "Failed to save commission settings",
      },
      { status: 500 },
    )
  }
}
