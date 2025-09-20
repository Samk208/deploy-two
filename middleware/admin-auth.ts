import { createServerSupabaseClient } from '@/lib/supabase/server'
import { UserRole } from '@/lib/types'
import { NextRequest, NextResponse } from 'next/server'

export async function adminAuthMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Only protect admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }
  
  // Allow access to login page
  if (pathname === '/admin/login') {
    return NextResponse.next()
  }
  
  try {
    const supabase = await createServerSupabaseClient(request)
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    
    // Check if user has admin role (profiles extends auth.users)
    const { data: userData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle<{ role: UserRole | null }>()
    
    if (!userData || userData.role !== UserRole.ADMIN) {
      return NextResponse.redirect(new URL('/admin/login?error=Unauthorized access', request.url))
    }
    
    return NextResponse.next()
  } catch (error) {
    console.error('Admin auth middleware error:', error)
    return NextResponse.redirect(new URL('/admin/login?error=Authentication failed', request.url))
  }
}
