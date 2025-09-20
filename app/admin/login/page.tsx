import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UserRole } from '@/lib/types'

interface AdminLoginProps {
  searchParams: Promise<{ error?: string }>
}

export default async function AdminLogin({ searchParams }: AdminLoginProps) {
  const params = await searchParams
  async function signIn(formData: FormData) {
    'use server'
    
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    
    if (!email || !password) {
      redirect('/admin/login?error=Please fill in all fields')
    }
    
    const supabase = await createServerSupabaseClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      redirect('/admin/login?error=Invalid credentials')
    }
    
    if (data.user) {
      // Check if user is admin (profiles extends auth.users)
      const { data: userData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle<{ role: UserRole | null }>()
      
      if (userData?.role !== UserRole.ADMIN) {
        await supabase.auth.signOut()
        redirect('/admin/login?error=Unauthorized access')
      }
      
      redirect('/admin/dashboard')
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-indigo-600 text-white px-4 py-2 rounded-lg z-50"
        >
          Skip to main content
        </a>

        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">One-Link</h1>
          </Link>
          <h2 id="main-content" className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Admin Access
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sign in to access the admin dashboard
          </p>
        </div>

        <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-xl font-semibold text-center">Admin Login</CardTitle>
            <CardDescription className="text-center">
              Enter your admin credentials to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {params.error && (
              <Alert variant="destructive" role="alert">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.85-1.83-1.51-2.95-1.42-.15-1.15.41-2.35 1.05-3.11z"
                  />
                </svg>
                <AlertDescription>{params.error}</AlertDescription>
              </Alert>
            )}

            <form action={signIn} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email address
                </label>
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@onelink.com"
                    className="pl-10 h-11"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 01-8 0v4h8z"
                    />
                  </svg>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    className="pl-10 h-11"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-white font-medium"
              >
                Sign in to Admin
              </Button>
            </form>

            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Not an admin?{" "}
                <Link
                  href="/sign-in"
                  className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
                >
                  Regular sign in
                </Link>
              </p>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 01-8 0v4h8z"
                  />
                </svg>
                <span>Secure admin access</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
