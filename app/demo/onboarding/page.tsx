"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { Check } from "lucide-react"

// Import the document uploader
import { DocumentUploader } from "@/components/ui/document-uploader"

// Demo Step Components
import ProfileBasicsStep from "../../auth/onboarding/components/ProfileBasicsStep"
import InfluencerProfileStep from "../../auth/onboarding/components/InfluencerProfileStep"
import BrandProfileStep from "../../auth/onboarding/components/BrandProfileStep"
import CommissionStep from "../../auth/onboarding/components/CommissionStep"

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

  // Step 3: Document Upload
  documentsComplete?: boolean

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

const steps = [
  { id: 1, title: "Profile Basics", description: "Basic information" },
  { id: 2, title: "Profile Details", description: "Role-specific profile" },
  { id: 3, title: "Document Upload", description: "Inline document verification" },
  { id: 4, title: "Commission", description: "Payment preferences" },
  { id: 5, title: "Complete", description: "Setup complete!" },
]

export default function DemoOnboardingPage() {
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

  // Update data
  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }

  const nextStep = async (stepData?: Partial<OnboardingData>) => {
    if (stepData) {
      updateData(stepData)
    }

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

  const handleDocumentComplete = (allDocuments: any) => {
    updateData({ documentsComplete: true })
    toast({
      title: "Documents Uploaded",
      description: "All required documents have been uploaded successfully.",
    })
  }

  const submitOnboarding = async () => {
    setIsLoading(true)
    try {
      // Demo: just show success
      await new Promise(resolve => setTimeout(resolve, 2000))

      toast({
        title: "🎉 Demo Complete!",
        description: "This is a demonstration of the advanced onboarding process.",
      })

      updateData({ currentStep: 5, completedSteps: [1, 2, 3, 4] })
    } catch (error) {
      toast({
        title: "Demo Error",
        description: "This is just a demo - no real data is saved.",
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
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Document Verification</h2>
              <p className="text-gray-600">
                Upload your documents for {data.role} verification. This is a demo - no real files are uploaded.
              </p>
            </div>
            <DocumentUploader
              userType={data.role === "influencer" ? "influencer" : "brand"}
              onAllComplete={handleDocumentComplete}
            />
            {data.documentsComplete && (
              <div className="flex justify-between pt-6">
                <button
                  onClick={prevStep}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={() => nextStep()}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        )
      case 4:
        return <CommissionStep data={data} updateData={updateData} onNext={submitOnboarding} onPrev={prevStep} />
      case 5:
        return (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to One-Link!</h2>
            <p className="text-xl text-gray-600 mb-8">
              Your {data.role} profile has been successfully created.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-blue-800">
                🎯 This was a demonstration of the advanced onboarding process with inline document upload features.
                In the real application, users would be redirected to their dashboard.
              </p>
            </div>
          </div>
        )
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Advanced Onboarding Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Experience the complete {data.role} onboarding process with document upload
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Badge variant="secondary" className="capitalize">
              {data.role}
            </Badge>
            <Badge variant="outline">
              Demo Mode
            </Badge>
          </div>
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

        {/* Main Content */}
        <main id="main-content">{renderCurrentStep()}</main>
      </div>
    </div>
  )
}
