import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UserRole } from '@/lib/types'

interface AdminNavProps {
  userRole: UserRole
  userName?: string
  userEmail?: string
}

export function AdminNav({ userRole, userName, userEmail }: AdminNavProps) {
  if (userRole !== UserRole.ADMIN) {
    return null
  }

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/admin/dashboard" className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
              One-Link Admin
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <Link 
                href="/admin/dashboard" 
                className="text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
              >
                Dashboard
              </Link>
              <Link 
                href="/admin/users" 
                className="text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
              >
                Users
              </Link>
              <Link 
                href="/admin/products" 
                className="text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
              >
                Products
              </Link>
              <Link 
                href="/admin/orders" 
                className="text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
              >
                Orders
              </Link>
              <Link 
                href="/admin/settings" 
                className="text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
              >
                Settings
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {userName || userEmail}
            </span>
            <Link href="/">
              <Button variant="outline" size="sm">
                Back to Site
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
