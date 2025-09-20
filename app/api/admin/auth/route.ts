import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { UserRole } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(request)
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ isAdmin: false, error: 'Not authenticated' }, { status: 401 })
    }
    
    // Check if user has admin role (profiles extends auth.users)
    const { data: userData } = await supabase
      .from('profiles')
      .select('role, name, email')
      .eq('id', user.id)
      .maybeSingle<{ role: UserRole | null; name?: string | null; email?: string | null }>()
    
    if (!userData || userData.role !== UserRole.ADMIN) {
      return NextResponse.json({ isAdmin: false, error: 'Not admin' }, { status: 403 })
    }
    
    return NextResponse.json({ 
      isAdmin: true, 
      user: {
        id: user.id,
        email: userData.email,
        name: userData.name,
        role: userData.role
      }
    })
  } catch (error) {
    console.error('Admin auth check error:', error)
    return NextResponse.json({ isAdmin: false, error: 'Internal server error' }, { status: 500 })
  }
}
