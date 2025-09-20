import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { stripe, formatAmountForStripe } from "@/lib/stripe"
import { checkoutSchema } from "@/lib/validators"
import { getCurrentUser, hasRole } from "@/lib/auth-helpers"
import { UserRole, type ApiResponse } from "@/lib/types"

// Declare runtime for Node.js-specific imports (Stripe)
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getCurrentUser(supabase)
    if (!user || !hasRole(user, [UserRole.CUSTOMER])) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = checkoutSchema.safeParse(body)
    
    if (!validation.success) {
      const errors: Record<string, string> = {}
      validation.error.errors.forEach((error) => {
        errors[error.path.join('.')] = error.message
      })
      
      return NextResponse.json(
        { ok: false, message: "Invalid checkout data", errors },
        { status: 400 }
      )
    }

    const { items, shippingAddress, billingAddress } = validation.data

    // Fetch product details and calculate total
    const productIds = items.map(item => item.productId)
    const query = supabase
      .from('products')
      .select('*')
      .in('id', productIds)
      .eq('active', true)
      .eq('in_stock', true)
    
    const { data: products, error: productsError } = await query

    if (productsError || !products || products.length !== items.length) {
      return NextResponse.json(
        { ok: false, message: "Some products are not available" },
        { status: 400 }
      )
    }

    // Calculate total and prepare line items
    let total = 0
    const lineItems: any[] = []
    const orderItems: any[] = []

    for (const item of items) {
      const product = products.find((p: any) => p.id === item.productId) as any
      if (!product) {
        return NextResponse.json(
          { ok: false, message: `Product ${item.productId} not found` },
          { status: 400 }
        )
      }

      if (product.stock_count < item.quantity) {
        return NextResponse.json(
          { ok: false, message: `Insufficient stock for ${product.title}` },
          { status: 400 }
        )
      }

      const itemTotal = product.price * item.quantity
      total += itemTotal

      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.title,
            description: product.description,
            images: product.images.slice(0, 1), // Stripe allows max 8 images
          },
          unit_amount: formatAmountForStripe(product.price),
        },
        quantity: item.quantity,
      })

      orderItems.push({
        productId: product.id,
        title: product.title,
        price: product.price,
        quantity: item.quantity,
        image: product.images[0] || '',
        supplierId: product.supplier_id,
        commission: product.commission,
      })
    }

    // Create Stripe Checkout Session
    const sessionPayload: any = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
      // Only include customer_email if available
      ...(user.email ? { customer_email: user.email } : {}),
      metadata: {
        userId: user.id,
        orderData: JSON.stringify({
          items: orderItems,
          total,
          shippingAddress,
          billingAddress,
        }),
      },
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'JP', 'KR'],
      },
    }
    const session = await stripe.checkout.sessions.create(sessionPayload)

    return NextResponse.json({
      ok: true,
      data: {
        sessionId: session.id,
        url: session.url,
      },
      message: "Checkout session created successfully",
    } as ApiResponse)
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { ok: false, message: "Something went wrong during checkout" },
      { status: 500 }
    )
  }
}
