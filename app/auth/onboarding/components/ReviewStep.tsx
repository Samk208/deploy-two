"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import {
  ChevronLeft,
  User,
  Building,
  FileText,
  DollarSign,
  Edit,
  Check,
  AlertCircle,
  Shield,
  Globe,
  Mail,
  Phone,
  MapPin,
} from "lucide-react"
import type { OnboardingData } from "../page"

interface ReviewStepProps {
  data: OnboardingData
  onSubmit: () => void
  onPrev: () => void
  isLoading: boolean
}

export default function ReviewStep({ data, onSubmit, onPrev, isLoading }: ReviewStepProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false)
  const [agreedToAgreement, setAgreedToAgreement] = useState(false)
  const [captchaCompleted, setCaptchaCompleted] = useState(false)

  const isInfluencer = data.role === "influencer"

  const handleSubmit = () => {
    if (!agreedToTerms || !agreedToPrivacy || !agreedToAgreement) {
      toast({
        title: "Agreement Required",
        description: "Please agree to all terms and conditions to continue.",
        variant: "destructive",
      })
      return
    }

    if (!captchaCompleted) {
      toast({
        title: "Verification Required",
        description: "Please complete the security verification.",
        variant: "destructive",
      })
      return
    }

    onSubmit()
  }

  const simulateCaptcha = () => {
    // Simulate reCAPTCHA completion
    setTimeout(() => {
      setCaptchaCompleted(true)
      toast({
        title: "Verification Complete",
        description: "Security check passed successfully.",
      })
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Review & Submit</CardTitle>
          <p className="text-center text-gray-600 dark:text-gray-400">
            Please review your information before submitting your application
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Basics Summary */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Basics
              </h3>
              <Button variant="ghost" size="sm">
                <Edit className="w-4 h-4" />
              </Button>
            </div>
            <Card className="bg-gray-50 dark:bg-gray-800">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {data.name}
                  </div>
                  <div>
                    <span className="font-medium">Handle:</span> @{data.displayName}
                  </div>
                  <div>
                    <span className="font-medium">Country:</span> {data.country}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Phone:</span> {data.phone}
                    {data.phoneVerified && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <Check className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Role-Specific Profile Summary */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {isInfluencer ? <User className="w-5 h-5" /> : <Building className="w-5 h-5" />}
                {isInfluencer ? "Influencer Profile" : "Brand Profile"}
              </h3>
              <Button variant="ghost" size="sm">
                <Edit className="w-4 h-4" />
              </Button>
            </div>
            <Card className="bg-gray-50 dark:bg-gray-800">
              <CardContent className="p-4">
                {isInfluencer ? (
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium">Social Links:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {data.socialLinks?.youtube && (
                          <Badge variant="outline" className="text-red-600">
                            YouTube
                          </Badge>
                        )}
                        {data.socialLinks?.instagram && (
                          <Badge variant="outline" className="text-pink-600">
                            Instagram
                          </Badge>
                        )}
                        {data.socialLinks?.tiktok && (
                          <Badge variant="outline" className="text-black">
                            TikTok
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Audience Size:</span> {data.audienceSize}
                    </div>
                    <div>
                      <span className="font-medium">Niches:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {data.nicheTags?.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Bio:</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{data.bio}</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Legal Name:</span> {data.legalEntityName}
                    </div>
                    <div>
                      <span className="font-medium">Trade Name:</span> {data.tradeName}
                    </div>
                    <div className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      <span className="font-medium">Website:</span> {data.website}
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      <span className="font-medium">Support:</span> {data.supportEmail}
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      <span className="font-medium">Phone:</span> {data.businessPhone}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span className="font-medium">Tax Country:</span> {data.taxCountry}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Verification Status */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Verification Documents
              </h3>
              <Button variant="ghost" size="sm">
                <Edit className="w-4 h-4" />
              </Button>
            </div>
            <Card className="bg-gray-50 dark:bg-gray-800">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {isInfluencer ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">ID Document</span>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Submitted
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Selfie Photo</span>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Submitted
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Proof of Address</span>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Submitted
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Bank Statement</span>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Submitted
                        </Badge>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Business Registration</span>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Submitted
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Bank Account Book</span>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Submitted
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Authorized Rep ID</span>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Submitted
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Business ID</span>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {data.businessId}
                        </Badge>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Commission Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Commission Settings
              </h3>
              <Button variant="ghost" size="sm">
                <Edit className="w-4 h-4" />
              </Button>
            </div>
            <Card className="bg-gray-50 dark:bg-gray-800">
              <CardContent className="p-4">
                {isInfluencer ? (
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-2">
                      <div className="text-lg font-bold text-indigo-600">{data.defaultCommission}%</div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Preferred Commission Rate</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Currency</div>
                      <div className="text-lg font-bold text-indigo-600">{data.currency}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Default</div>
                      <div className="text-lg font-bold text-indigo-600">{data.defaultCommission}%</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Minimum</div>
                      <div className="text-lg font-bold text-red-600">{data.minCommission}%</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Maximum</div>
                      <div className="text-lg font-bold text-green-600">{data.maxCommission}%</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Terms and Agreements */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Terms & Agreements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox 
                checked={agreedToTerms} 
                onCheckedChange={(checked) => setAgreedToTerms(checked === true)} 
                className="mt-1" 
              />
              <div className="space-y-1 leading-none">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  I agree to the{" "}
                  <a
                    href="/terms"
                    className="text-indigo-600 hover:underline"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Terms of Service
                  </a>
                </label>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox 
                checked={agreedToPrivacy} 
                onCheckedChange={(checked) => setAgreedToPrivacy(checked === true)} 
                className="mt-1" 
              />
              <div className="space-y-1 leading-none">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  I agree to the{" "}
                  <a
                    href="/privacy"
                    className="text-indigo-600 hover:underline"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Privacy Policy
                  </a>
                </label>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox 
                checked={agreedToAgreement} 
                onCheckedChange={(checked) => setAgreedToAgreement(checked === true)} 
                className="mt-1" 
              />
              <div className="space-y-1 leading-none">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  I agree to the{" "}
                  <a
                    href={isInfluencer ? "/creator-agreement" : "/brand-agreement"}
                    className="text-indigo-600 hover:underline"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {isInfluencer ? "Creator Agreement" : "Brand Agreement"}
                  </a>
                </label>
              </div>
            </div>
          </div>

          {/* reCAPTCHA Simulation */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-gray-300 rounded flex items-center justify-center">
                  {captchaCompleted ? <Check className="w-4 h-4 text-green-600" /> : null}
                </div>
                <span className="text-sm">I'm not a robot</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-gray-400" />
                <span className="text-xs text-gray-500">reCAPTCHA</span>
              </div>
            </div>
            {!captchaCompleted && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 bg-transparent"
                onClick={simulateCaptcha}
              >
                Complete Verification
              </Button>
            )}
          </div>

          {/* Security Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Application Review Process</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Your application will be reviewed within 2-3 business days. You'll receive an email notification once
                  your account is approved and ready to use.
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button type="button" variant="outline" onClick={onPrev}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !agreedToTerms || !agreedToPrivacy || !agreedToAgreement || !captchaCompleted}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8"
            >
              {isLoading ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
