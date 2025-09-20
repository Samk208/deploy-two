"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { ChevronRight, Check, X } from "lucide-react"
import type { OnboardingData } from "../page"

const profileBasicsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  country: z.string().min(1, "Please select your country"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  preferredLanguage: z.string().min(1, "Please select your preferred language"),
  marketingOptIn: z.boolean(),
})

type ProfileBasicsForm = z.infer<typeof profileBasicsSchema>

interface ProfileBasicsStepProps {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
  onNext: (stepData: Partial<OnboardingData>) => void
}

const countries = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "GB", label: "United Kingdom" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "JP", label: "Japan" },
  { value: "KR", label: "South Korea" },
  { value: "CN", label: "China" },
  { value: "AU", label: "Australia" },
  { value: "BR", label: "Brazil" },
]

const languages = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "zh", label: "Chinese" },
  { value: "pt", label: "Portuguese" },
]

export default function ProfileBasicsStep({ data, updateData, onNext }: ProfileBasicsStepProps) {
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false)
  const [displayNameStatus, setDisplayNameStatus] = useState<"available" | "taken" | "checking" | null>(null)
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState("")

  const form = useForm<ProfileBasicsForm>({
    resolver: zodResolver(profileBasicsSchema),
    defaultValues: {
      name: data.name,
      displayName: data.displayName,
      country: data.country,
      phone: data.phone,
      preferredLanguage: data.preferredLanguage,
      marketingOptIn: data.marketingOptIn,
    },
  })

  const checkDisplayNameAvailability = async (displayName: string) => {
    if (displayName.length < 2) return

    setIsCheckingAvailability(true)
    setDisplayNameStatus("checking")

    try {
      const response = await fetch("/api/onboarding/check-handle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      })

      const result = await response.json()
      setDisplayNameStatus(result.available ? "available" : "taken")
    } catch (error) {
      console.error("Failed to check availability:", error)
      setDisplayNameStatus(null)
    } finally {
      setIsCheckingAvailability(false)
    }
  }

  const sendOTP = async (phone: string) => {
    try {
      const response = await fetch("/api/onboarding/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      })

      if (response.ok) {
        setOtpSent(true)
        toast({
          title: "OTP Sent",
          description: "Please check your phone for the verification code.",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send OTP. Please try again.",
        variant: "destructive",
      })
    }
  }

  const verifyOTP = async () => {
    try {
      const response = await fetch("/api/onboarding/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.getValues("phone"), code: otpCode }),
      })

      if (response.ok) {
        updateData({ phoneVerified: true })
        toast({
          title: "Phone Verified",
          description: "Your phone number has been verified successfully.",
        })
      }
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Invalid OTP code. Please try again.",
        variant: "destructive",
      })
    }
  }

  const onSubmit = (formData: ProfileBasicsForm) => {
    if (displayNameStatus !== "available") {
      toast({
        title: "Display Name Required",
        description: "Please choose an available display name.",
        variant: "destructive",
      })
      return
    }

    onNext(formData)
  }

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Profile Basics</CardTitle>
        <p className="text-center text-gray-600 dark:text-gray-400">
          Let's start with some basic information about you
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter your full name"
                      className="h-11"
                      onChange={(e) => {
                        field.onChange(e)
                        updateData({ name: e.target.value })
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Display Name/Handle */}
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name/Handle *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        placeholder="Choose your unique handle"
                        className="h-11 pr-10"
                        onChange={(e) => {
                          field.onChange(e)
                          updateData({ displayName: e.target.value })
                          checkDisplayNameAvailability(e.target.value)
                        }}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {displayNameStatus === "checking" && (
                          <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full" />
                        )}
                        {displayNameStatus === "available" && <Check className="h-4 w-4 text-green-600" />}
                        {displayNameStatus === "taken" && <X className="h-4 w-4 text-red-600" />}
                      </div>
                    </div>
                  </FormControl>
                  {displayNameStatus === "available" && (
                    <p className="text-sm text-green-600">Great! This handle is available.</p>
                  )}
                  {displayNameStatus === "taken" && (
                    <p className="text-sm text-red-600">This handle is already taken. Please try another.</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Country and Language */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        updateData({ country: value })
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select your country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.value} value={country.value}>
                            {country.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferredLanguage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Language *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        updateData({ preferredLanguage: value })
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {languages.map((language) => (
                          <SelectItem key={language.value} value={language.value}>
                            {language.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Phone Number with OTP */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number *</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          {...field}
                          placeholder="+1 (555) 123-4567"
                          className="h-11 flex-1"
                          onChange={(e) => {
                            field.onChange(e)
                            updateData({ phone: e.target.value })
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => sendOTP(field.value)}
                          disabled={!field.value || field.value.length < 10}
                        >
                          {otpSent ? "Resend OTP" : "Send OTP"}
                        </Button>
                      </div>

                      {otpSent && !data.phoneVerified && (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter 6-digit code"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            className="h-11 flex-1"
                            maxLength={6}
                          />
                          <Button type="button" onClick={verifyOTP} disabled={otpCode.length !== 6}>
                            Verify
                          </Button>
                        </div>
                      )}

                      {data.phoneVerified && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <Check className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Marketing Opt-in */}
            <FormField
              control={form.control}
              name="marketingOptIn"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked)
                        updateData({ marketingOptIn: checked as boolean })
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal">
                      I'd like to receive marketing emails about new features and opportunities
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {/* Continue Button */}
            <div className="flex justify-end pt-6">
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8"
                disabled={displayNameStatus !== "available"}
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
