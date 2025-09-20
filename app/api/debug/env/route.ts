import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  const env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Present' : 'Missing',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing',
    NODE_ENV: process.env.NODE_ENV,
    // Show partial values for debugging (first 10 chars)
    URL_partial: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    ANON_partial: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30) + '...',
    SERVICE_partial: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 30) + '...'
  }

  return NextResponse.json(env)
}
