import { type NextRequest, NextResponse } from "next/server"

const simulateNetworkDelay = () => new Promise((resolve) => setTimeout(resolve, Math.random() * 1000 + 300))

export async function POST(request: NextRequest) {
  try {
    await simulateNetworkDelay()

    const body = await request.json()
    const { role } = body

    if (role === "influencer") {
      const { socialLinks, audienceSize, nicheTags, bio } = body

      // Validate influencer-specific fields
      if (!socialLinks || (!socialLinks.youtube && !socialLinks.instagram && !socialLinks.tiktok)) {
        return NextResponse.json(
          {
            success: false,
            error: "Please provide at least one social media link",
          },
          { status: 400 },
        )
      }

      if (!audienceSize || !nicheTags || nicheTags.length === 0 || !bio) {
        return NextResponse.json(
          {
            success: false,
            error: "Please fill in all required fields",
          },
          { status: 400 },
        )
      }

      return NextResponse.json({
        success: true,
        message: "Influencer profile saved successfully",
        step: 2,
        data: { socialLinks, audienceSize, nicheTags, bio },
      })
    } else if (role === "brand") {
      const { legalEntityName, tradeName, website, supportEmail, businessAddress, businessPhone, taxCountry } = body

      // Validate brand-specific fields
      if (
        !legalEntityName ||
        !tradeName ||
        !website ||
        !supportEmail ||
        !businessAddress ||
        !businessPhone ||
        !taxCountry
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Please fill in all required fields",
          },
          { status: 400 },
        )
      }

      return NextResponse.json({
        success: true,
        message: "Brand profile saved successfully",
        step: 2,
        data: {
          legalEntityName,
          tradeName,
          website,
          supportEmail,
          businessAddress,
          businessPhone,
          taxCountry,
        },
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
        error: "Failed to save step data",
      },
      { status: 500 },
    )
  }
}
