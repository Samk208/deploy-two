"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { Check } from "lucide-react"

// Step Components (will be created in subsequent tasks)
import ProfileBasicsStep from "./components/ProfileBasicsStep"
import InfluencerProfileStep from "./components/InfluencerProfileStep"
import BrandProfileStep from "./components/BrandProfileStep"
import InfluencerKYCStep from "./components/InfluencerKYCStep"
import BrandKYBStep from "./components/BrandKYBStep"
import CommissionStep from "./components/CommissionStep"
import ReviewStep from "./components/ReviewStep"

export type UserRole = "influencer" | "brand"

export interface OnboardingData {
  // Step 1: Profile Basics
  name: string
  displayName: string
  country: string
  phone: string
  phoneVerified: boolean
  preferredLanguage: string
  marketingOptIn: boolean

  // Step 2A: Influencer Profile
  socialLinks: {
    youtube?: string
    tiktok?: string
    instagram?: string
  }
  audienceSize: string
  nicheTags: string[]
  bio: string
  avatar?: File
  banner?: File

  // Step 2B: Brand Profile
  legalEntityName?: string
  tradeName?: string
  website?: string
  supportEmail?: string
  businessAddress?: string
  businessPhone?: string
  taxCountry?: string

  // Step 3A: Influencer KYC
  idDocument?: File
  selfiePhoto?: File
  proofOfAddress?: File
  bankAccountHolder?: string
  bankAccount?: string
  bankStatement?: File

  // Step 3B: Brand KYB
  businessRegistration?: File
  retailPermit?: File
  businessId?: string
  bankAccountBook?: File
  authorizedRepId?: File

  // Step 4: Commission
  defaultCommission?: number
  minCommission?: number
  maxCommission?: number
  currency?: string

  // Meta
  role: UserRole
  currentStep: number
  completedSteps: number[]
}

const STORAGE_KEY = "onelink-onboarding"

const steps = [
  { id: 1, title: "Profile Basics", description: "Basic information" },
  { id: 2, title: "Profile Details", description: "Role-specific profile" },
  { id: 3, title: "Verification", description: "Identity verification" },
  { id: 4, title: "Commission", description: "Payment preferences" },
  { id: 5, title: "Review", description: "Review and submit" },
]

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roleParam = searchParams.get("role") as UserRole | null

  const [data, setData] = useState<OnboardingData>({
    name: "",
    displayName: "",
    country: "",
    phone: "",
    phoneVerified: false,
    preferredLanguage: "en",
    marketingOptIn: false,
    socialLinks: {},
    audienceSize: "",
    nicheTags: [],
    bio: "",
    role: roleParam || "influencer",
    currentStep: 1,
    completedSteps: [],
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Load saved data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsedData = JSON.parse(saved)
        setData((prev) => ({ ...prev, ...parsedData }))
      } catch (error) {
        console.error("Failed to load saved onboarding data:", error)
      }
    }
  }, [])

  // Also try to restore progress from backend if available (non-blocking, merges with local state)
  useEffect(() => {
    let cancelled = false
    const loadServerProgress = async () => {
      try {
        const res = await fetch("/api/onboarding/progress", { cache: "no-store" })
        if (!res.ok) return
        const json = await res.json()
        if (!json?.ok || cancelled) return

        // Merge step data in order, latest wins
        const serverSteps: Array<{ step: number; data: Record<string, any> }> = json.data?.steps || []
        const merged: Partial<OnboardingData> = {}
        for (const s of serverSteps) {
          Object.assign(merged, s.data || {})
        }

        const serverRole = json.data?.role as UserRole | undefined
        const serverCurrent = Number(json.data?.currentStep) || undefined
        const serverCompleted: number[] = Array.isArray(json.data?.completedSteps) ? json.data.completedSteps : []

        setData((prev) => {
          const next = {
            ...prev,
            ...merged,
            ...(serverRole ? { role: serverRole } : {}),
            ...(serverCurrent ? { currentStep: serverCurrent } : {}),
            ...(serverCompleted.length ? { completedSteps: serverCompleted } : {}),
          }
          // Persist merged data locally to preserve offline UX
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
          } catch {}
          return next
        })
      } catch (e) {
        // Silent failure to avoid breaking UX
        console.debug("onboarding: no server progress or fetch failed", e)
      }
    }
    loadServerProgress()
    return () => {
      cancelled = true
    }
  }, [])

  // Save data to localStorage (debounced)
  const saveToStorage = useCallback((newData: OnboardingData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData))
  }, [])

  // Auto-save with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveToStorage(data)
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [data, saveToStorage])

  // API call to save step data
  const saveStepData = async (stepData: Partial<OnboardingData>) => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/onboarding/step-${data.currentStep}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, ...stepData }),
      })

      if (!response.ok) {
        throw new Error("Failed to save step data")
      }

      return await response.json()
    } catch (error) {
      console.error("Failed to save step:", error)
      toast({
        title: "Save Error",
        description: "Failed to save your progress. Please try again.",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }

  const nextStep = async (stepData?: Partial<OnboardingData>) => {
    if (stepData) {
      updateData(stepData)
    }

    try {
      await saveStepData(stepData || {})

      const newCompletedSteps = [...data.completedSteps]
      if (!newCompletedSteps.includes(data.currentStep)) {
        newCompletedSteps.push(data.currentStep)
      }

      const newStep = Math.min(data.currentStep + 1, steps.length)
      updateData({
        currentStep: newStep,
        completedSteps: newCompletedSteps,
        ...stepData,
      })

      toast({
        title: "Progress Saved",
        description: "Your information has been saved successfully.",
      })
    } catch (error) {
      // Error already handled in saveStepData
    }
  }

  const prevStep = () => {
    const newStep = Math.max(data.currentStep - 1, 1)
    updateData({ currentStep: newStep })
  }

  const goToStep = (stepNumber: number) => {
    if (data.completedSteps.includes(stepNumber - 1) || stepNumber === 1) {
      updateData({ currentStep: stepNumber })
    }
  }

  const submitOnboarding = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/onboarding/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to submit onboarding")
      }

      // Clear saved data
      localStorage.removeItem(STORAGE_KEY)

      toast({
        title: "Welcome to One-Link!",
        description: "Your profile has been submitted for review.",
      })

      // Redirect based on role
      const redirectPath = data.role === "influencer" ? "/dashboard/influencer" : "/dashboard/supplier/products"

      router.push(redirectPath)
    } catch (error) {
      toast({
        title: "Submission Error",
        description: "Failed to submit your profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderCurrentStep = () => {
    switch (data.currentStep) {
      case 1:
        return <ProfileBasicsStep data={data} updateData={updateData} onNext={nextStep} />
      case 2:
        return data.role === "influencer" ? (
          <InfluencerProfileStep data={data} updateData={updateData} onNext={nextStep} onPrev={prevStep} />
        ) : (
          <BrandProfileStep data={data} updateData={updateData} onNext={nextStep} onPrev={prevStep} />
        )
      case 3:
        return data.role === "influencer" ? (
          <InfluencerKYCStep data={data} updateData={updateData} onNext={nextStep} onPrev={prevStep} />
        ) : (
          <BrandKYBStep data={data} updateData={updateData} onNext={nextStep} onPrev={prevStep} />
        )
      case 4:
        return <CommissionStep data={data} updateData={updateData} onNext={nextStep} onPrev={prevStep} />
      case 5:
        return <ReviewStep data={data} onSubmit={submitOnboarding} onPrev={prevStep} isLoading={isLoading} />
      default:
        return null
    }
  }

  const progressPercentage = ((data.currentStep - 1) / (steps.length - 1)) * 100

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      {/* Skip to main content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-indigo-600 text-white px-4 py-2 rounded-lg z-50"
      >
        Skip to main content
      </a>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome to One-Link</h1>
          <p className="text-gray-600 dark:text-gray-400">Let's set up your {data.role} profile</p>
          <Badge variant="secondary" className="mt-2 capitalize">
            {data.role}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Step {data.currentStep} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">{Math.round(progressPercentage)}% complete</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />

          {/* Step indicators */}
          <div className="flex justify-between mt-4">
            {steps.map((step) => (
              <button
                key={step.id}
                onClick={() => goToStep(step.id)}
                disabled={!data.completedSteps.includes(step.id - 1) && step.id !== 1}
                className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                  step.id === data.currentStep
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
                    : data.completedSteps.includes(step.id)
                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      : "text-gray-400 cursor-not-allowed"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                    step.id === data.currentStep
                      ? "bg-indigo-600 text-white"
                      : data.completedSteps.includes(step.id)
                        ? "bg-green-600 text-white"
                        : "bg-gray-300 text-gray-500"
                  }`}
                >
                  {data.completedSteps.includes(step.id) ? <Check className="w-4 h-4" /> : step.id}
                </div>
                <span className="text-xs font-medium hidden sm:block">{step.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Auto-save indicator */}
        {isSaving && (
          <div className="fixed top-4 right-4 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Saving...</div>
        )}

        {/* Main Content */}
        <main id="main-content">{renderCurrentStep()}</main>
      </div>
    </div>
  )
}
