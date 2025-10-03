import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export default async function InfluencerDashboard() {
  const supabase = await createServerSupabaseClient()
  let session = null as null | { user: { id: string } }
  try {
    const res = await supabase.auth.getSession()
    session = res?.data?.session ? { user: { id: res.data.session.user.id } } : null
  } catch (e) {
    console.error("Failed to read session in influencer dashboard:", e)
    session = null
  }
  let shopHandle: string | null = null
  if (session?.user) {
    type ShopRow = { handle: string | null }
    const { data, error } = await supabase
      .from("shops")
      .select("handle")
      .eq("influencer_id", session.user.id)
      .maybeSingle<ShopRow>()
    if (error) {
      console.error("Failed to fetch influencer shop handle:", error)
    } else if (data?.handle) {
      shopHandle = data.handle
    }
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Welcome back, Sarah! Here's your shop overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">24</div>
            <p className="text-xs text-green-600">+2 from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">18</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">6 drafts remaining</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              This Month's Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">$1,247</div>
            <p className="text-xs text-green-600">+15% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Shop Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">3,421</div>
            <p className="text-xs text-green-600">+8% from last week</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/influencer/shop">
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Manage My Shop
              </Button>
            </Link>
            {shopHandle && (
            <Link href={`/shop/${shopHandle}`}>
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                Preview My Shop
              </Button>
            </Link>
            )}
            <Link href="/dashboard/influencer/analytics">
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                View Analytics
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Product published</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Premium Cotton T-Shirt went live</p>
              </div>
              <Badge variant="secondary">2h ago</Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">New sale</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Gold Chain Necklace - $99.99</p>
              </div>
              <Badge variant="secondary">4h ago</Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Price updated</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Skincare Set price changed to $159.99</p>
              </div>
              <Badge variant="secondary">1d ago</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
