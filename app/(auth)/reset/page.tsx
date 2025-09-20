"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail } from "lucide-react"
import { createClientSupabaseClient } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"

const resetPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
})

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

const MailIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
)

const ArrowLeftIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
)

const CheckCircleIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

const AlertCircleIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const supabase = createClientSupabaseClient()

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (data: ResetPasswordForm) => {
    setIsLoading(true)
    setError("")

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${location.origin}/update-password`,
    })

    setIsLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setIsSuccess(true)
      toast({
        title: "Reset link sent!",
        description: "If an account exists, you'll receive reset instructions via email.",
      })
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-indigo-600 text-white px-4 py-2 rounded-lg"
        >
          Skip to main content
        </a>

        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link href="/" className="inline-block">
              <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">One-Link</h1>
            </Link>
          </div>

          <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
            <CardContent className="pt-6" id="main-content">
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <CheckCircleIcon />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Check your email</h2>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    If an account exists for{" "}
                    <span className="font-medium text-gray-900 dark:text-white">{form.getValues("email")}</span>, you'll
                    receive password reset instructions shortly.
                  </p>
                </div>
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Didn't receive the email? Check your spam folder or{" "}
                    <button
                      onClick={() => {
                        setIsSuccess(false)
                        form.reset()
                      }}
                      className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 underline focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
                    >
                      try again
                    </button>
                  </p>
                  <Link
                    href="/sign-in"
                    className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
                  >
                    <ArrowLeftIcon />
                    <span className="ml-1">Back to sign in</span>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-indigo-600 text-white px-4 py-2 rounded-lg"
      >
        Skip to main content
      </a>

      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">One-Link</h1>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">Reset your password</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            No worries! Enter your email and we'll help you get back into your account.
          </p>
        </div>

        <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-xl font-semibold text-center">Password Reset</CardTitle>
            <CardDescription className="text-center">
              We'll email you instructions to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6" id="main-content">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Reset Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Email address</FormLabel>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        The email address you used to create your One-Link account
                      </p>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                            <MailIcon />
                          </div>
                          <Input
                            {...field}
                            type="email"
                            placeholder="Enter your email"
                            className="pl-10 h-11 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            autoComplete="email"
                            aria-describedby="email-error email-hint"
                          />
                        </div>
                      </FormControl>
                      <FormMessage id="email-error" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-white font-medium transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending reset link..." : "Send reset link"}
                </Button>
              </form>
            </Form>

            {/* Back to Sign In */}
            <div className="text-center">
              <Link
                href="/sign-in"
                className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
              >
                <ArrowLeftIcon />
                <span className="ml-1">Back to sign in</span>
              </Link>
            </div>

            {/* Terms */}
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              By continuing, you agree to our{" "}
              <Link
                href="/terms"
                className="underline hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="underline hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
              >
                Privacy Policy
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
