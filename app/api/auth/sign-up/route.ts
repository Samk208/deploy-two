import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { signUpSchema } from "@/lib/validators"
import { createAuthErrorResponse, createAuthSuccessResponse, createUserProfile, getUserByEmail } from "@/lib/auth-helpers"
import { type AuthResponse } from "@/lib/types"

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Test Supabase connection first
    console.log('Testing Supabase connection...')
    console.log('Environment variables check:')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING')
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING')
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING')

    // Test supabaseAdmin connection
    try {
      const { data, error } = await supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true })
      if (error) {
        console.error('Supabase admin connection test failed:', error)
        return NextResponse.json(
          createAuthErrorResponse("Database connection failed. Please check configuration."),
          { status: 500 }
        )
      }
      console.log('Supabase admin connection test successful')
    } catch (connError) {
      console.error('Supabase admin connection error:', connError)
      return NextResponse.json(
        createAuthErrorResponse("Database connection error. Please check configuration."),
        { status: 500 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch (e) {
      console.error('Failed to parse request body:', e)
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 })
    }

    console.log('Sign-up request body:', { ...body, password: '[REDACTED]', confirmPassword: '[REDACTED]' })

    const validation = signUpSchema.safeParse(body)

    if (!validation.success) {
      console.error('Validation failed:', validation.error.flatten())
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid input. Please check your details and try again.",
          fieldErrors: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      )
    }

    const { email, password, role, firstName, lastName } = validation.data
    const name = `${firstName} ${lastName}`

    console.log('Processing sign-up for:', { email, role, name })

    // Check if user already exists
    console.log('Checking if user exists...')
    const { data: existingUser, error: existingUserError } = await getUserByEmail(email)

    if (existingUserError) {
      console.error('Error checking existing user:', existingUserError)
      return NextResponse.json(
        createAuthErrorResponse("Something went wrong. Please try again."),
        { status: 500 }
      )
    }

    if (existingUser) {
      console.log('User already exists')
      return NextResponse.json(
        createAuthErrorResponse("A user with this email already exists."),
        { status: 409 }
      )
    }

    // Try using supabaseAdmin for auth operations to bypass client issues
    console.log('Creating Supabase auth user with admin client...')
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        name,
        role,
      }
    })

    if (authError) {
      console.error('Supabase admin auth error:', authError)
      return NextResponse.json(
        createAuthErrorResponse(`Unable to create account: ${authError.message}`),
        { status: 400 }
      )
    }

    if (!authData.user) {
      console.error('No user returned from Supabase admin auth')
      return NextResponse.json(
        createAuthErrorResponse("Account creation failed. Please try again."),
        { status: 400 }
      )
    }

    console.log('Auth user created with admin client, creating profile...')
    // Create user profile in database
    const user = await createUserProfile(authData.user.id, email, name, role)
    if (!user) {
      console.error('Failed to create user profile')
      // Clean up auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        createAuthErrorResponse("Account creation failed. Please try again."),
        { status: 500 }
      )
    }

    console.log('User profile created successfully')
    return NextResponse.json(
      createAuthSuccessResponse(user, "Account created successfully! You can now sign in.")
    )
  } catch (error) {
    console.error('Unexpected sign-up error:', error)
    return NextResponse.json(
      createAuthErrorResponse("Something went wrong. Please try again."),
      { status: 500 }
    )
  }
}
