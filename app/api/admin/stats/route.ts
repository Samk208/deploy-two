import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { UserRole } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(request)
    
    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // Verify admin role
    const { data: userData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle<{ role: UserRole | null }>()
    
    if (!userData || userData.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get platform statistics with per-query failure isolation
    const platformResults = await Promise.allSettled([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('shops').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('verified', true),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('active', true)
    ])

    const safeCount = (r: any): number => {
      if (!r) return 0
      // Supabase head count responses have shape { data: null, count: number, error?: PostgrestError }
      if (typeof r.count === 'number') return r.count
      if (r.data && typeof r.data.count === 'number') return r.data.count
      return 0
    }

    const [
      totalUsersRes,
      totalProductsRes,
      totalOrdersRes,
      totalShopsRes,
      activeUsersRes,
      activeProductsRes
    ] = platformResults

    const totalUsers = totalUsersRes.status === 'fulfilled' ? safeCount(totalUsersRes.value) : 0
    const totalProducts = totalProductsRes.status === 'fulfilled' ? safeCount(totalProductsRes.value) : 0
    const totalOrders = totalOrdersRes.status === 'fulfilled' ? safeCount(totalOrdersRes.value) : 0
    const totalShops = totalShopsRes.status === 'fulfilled' ? safeCount(totalShopsRes.value) : 0
    const activeUsers = activeUsersRes.status === 'fulfilled' ? safeCount(activeUsersRes.value) : 0
    const activeProducts = activeProductsRes.status === 'fulfilled' ? safeCount(activeProductsRes.value) : 0

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentResults = await Promise.allSettled([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo.toISOString()),
      supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo.toISOString()),
      supabase.from('products').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo.toISOString())
    ])

    const [recentUsersRes, recentOrdersRes, recentProductsRes] = recentResults
    const recentUsers = recentUsersRes.status === 'fulfilled' ? safeCount(recentUsersRes.value) : 0
    const recentOrders = recentOrdersRes.status === 'fulfilled' ? safeCount(recentOrdersRes.value) : 0
    const recentProducts = recentProductsRes.status === 'fulfilled' ? safeCount(recentProductsRes.value) : 0

    return NextResponse.json({
      stats: {
        totalUsers: totalUsers || 0,
        totalProducts: totalProducts || 0,
        totalOrders: totalOrders || 0,
        totalShops: totalShops || 0,
        activeUsers: activeUsers || 0,
        activeProducts: activeProducts || 0,
        sevenDayUsers: recentUsers || 0,
        sevenDayOrders: recentOrders || 0,
        sevenDayProducts: recentProducts || 0
      }
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
