import type React from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { VerificationBannerWrapper } from "@/components/ui/verification-banner"
import {
  LayoutDashboard,
  Package,
  BarChart3,
  Settings,
  Bell,
  Search,
  Menu,
  LogOut,
  Store,
  ShoppingBag,
  TrendingUp,
  DollarSign,
} from "lucide-react"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Dashboard - One-Link",
  description: "Manage your One-Link account and products",
}

const supplierNavItems = [
  { href: "/dashboard/supplier", icon: LayoutDashboard, label: "Overview", badge: null },
  { href: "/dashboard/supplier/products", icon: Package, label: "Products", badge: null },
  { href: "/dashboard/supplier/orders", icon: ShoppingBag, label: "Orders", badge: "3" },
  { href: "/dashboard/supplier/analytics", icon: BarChart3, label: "Analytics", badge: null },
  { href: "/dashboard/supplier/commissions", icon: DollarSign, label: "Commissions", badge: null },
  { href: "/dashboard/supplier/settings", icon: Settings, label: "Settings", badge: null },
]

const influencerNavItems = [
  { href: "/dashboard/influencer", icon: LayoutDashboard, label: "Overview", badge: null },
  { href: "/dashboard/influencer/shop", icon: Store, label: "My Shop", badge: null },
  { href: "/dashboard/influencer/products", icon: Package, label: "Curated Products", badge: null },
  { href: "/dashboard/influencer/analytics", icon: TrendingUp, label: "Analytics", badge: null },
  { href: "/dashboard/influencer/earnings", icon: DollarSign, label: "Earnings", badge: null },
  { href: "/dashboard/influencer/settings", icon: Settings, label: "Settings", badge: null },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Mock user data - in a real app, this would come from authentication
  const user = {
    name: "Sarah Kim",
    email: "sarah@example.com",
    role: "supplier" as const,
    avatar: "/fashion-influencer-avatar.png",
    verified: false,
    verificationStatus: "pending" as const, // pending | verified | rejected
  }

  const navItems = user.role === "supplier" ? supplierNavItems : influencerNavItems

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="min-h-screen bg-gray-50">
        {/* Top Navigation */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
            {/* Mobile menu button */}
            <Button variant="ghost" size="sm" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">OL</span>
              </div>
              <span className="font-bold text-gray-900 hidden sm:block">One-Link</span>
            </Link>

            {/* Search */}
            <div className="flex-1 max-w-md mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 bg-red-500 text-white text-xs">2</Badge>
              </Button>

              {/* User menu */}
              <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>
                <div className="relative">
                  <img
                    src={user.avatar || "/placeholder.svg"}
                    alt={user.name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  {user.verified && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)]">
            <nav className="p-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  <item.icon className="h-5 w-5" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              ))}

              <Separator className="my-4" />

              <Link
                href="/shop/sarah_style"
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <Store className="h-5 w-5" />
                <span className="flex-1">View Shop</span>
              </Link>

              <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors w-full">
                <LogOut className="h-5 w-5" />
                <span className="flex-1 text-left">Sign Out</span>
              </button>
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <VerificationBannerWrapper
              userRole={user.role === "supplier" ? "brand" : "influencer"}
              verificationStatus={user.verificationStatus}
            />
            {children}
          </main>
        </div>
      </div>
    </Suspense>
  )
}
