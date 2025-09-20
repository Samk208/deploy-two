"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { ChevronLeft, ChevronRight, Building, Globe, Mail, MapPin, Phone } from "lucide-react"
import type { OnboardingData } from "../page"

const brandProfileSchema = z.object({
  legalEntityName: z.string().min(2, "Legal entity name is required"),
  tradeName: z.string().min(2, "Trade name is required"),
  website: z.string().url("Please enter a valid website URL"),
  supportEmail: z.string().email("Please enter a valid email address"),
  businessAddress: z.string().min(10, "Please enter your complete business address"),
  businessPhone: z.string().min(10, "Please enter a valid phone number"),
  taxCountry: z.string().min(1, "Please select your tax country"),
})

type BrandProfileForm = z.infer<typeof brandProfileSchema>

interface BrandProfileStepProps {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
  onNext: (stepData: Partial<OnboardingData>) => void
  onPrev: () => void
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
  { value: "IN", label: "India" },
  { value: "SG", label: "Singapore" },
  { value: "HK", label: "Hong Kong" },
  { value: "NL", label: "Netherlands" },
  { value: "SE", label: "Sweden" },
]

export default function BrandProfileStep({ data, updateData, onNext, onPrev }: BrandProfileStepProps) {
  const form = useForm<BrandProfileForm>({
    resolver: zodResolver(brandProfileSchema),
    defaultValues: {
      legalEntityName: data.legalEntityName || "",
      tradeName: data.tradeName || "",
      website: data.website || "",
      supportEmail: data.supportEmail || "",
      businessAddress: data.businessAddress || "",
      businessPhone: data.businessPhone || "",
      taxCountry: data.taxCountry || "",
    },
  })

  const onSubmit = (formData: BrandProfileForm) => {
    onNext(formData)
  }

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Brand Profile</CardTitle>
        <p className="text-center text-gray-600 dark:text-gray-400">
          Tell us about your business and how customers can reach you
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Business Names */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="legalEntityName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Legal Entity Name *
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="ABC Corporation Ltd."
                        className="h-11"
                        onChange={(e) => {
                          field.onChange(e)
                          updateData({ legalEntityName: e.target.value })
                        }}
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500">The official registered name of your business</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tradeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Trade Name *
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="ABC Store"
                        className="h-11"
                        onChange={(e) => {
                          field.onChange(e)
                          updateData({ tradeName: e.target.value })
                        }}
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500">The name customers know your business by</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Website and Support Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Website *
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="https://www.yourstore.com"
                        className="h-11"
                        onChange={(e) => {
                          field.onChange(e)
                          updateData({ website: e.target.value })
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supportEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Support Email *
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="support@yourstore.com"
                        className="h-11"
                        onChange={(e) => {
                          field.onChange(e)
                          updateData({ supportEmail: e.target.value })
                        }}
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500">Where customers can reach you for support</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Business Address */}
            <FormField
              control={form.control}
              name="businessAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Business Address *
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="123 Business Street, Suite 100, City, State/Province, Postal Code, Country"
                      className="min-h-[80px] resize-none"
                      onChange={(e) => {
                        field.onChange(e)
                        updateData({ businessAddress: e.target.value })
                      }}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">
                    Your complete business address for legal and shipping purposes
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Business Phone and Tax Country */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="businessPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Business Phone *
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="+1 (555) 123-4567"
                        className="h-11"
                        onChange={(e) => {
                          field.onChange(e)
                          updateData({ businessPhone: e.target.value })
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taxCountry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Country *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        updateData({ taxCountry: value })
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select tax country" />
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
                    <p className="text-xs text-gray-500">Country where your business is registered for tax purposes</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Information Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Why do we need this information?</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Legal compliance and tax reporting requirements</li>
                <li>• Customer support and communication</li>
                <li>• Shipping and logistics coordination</li>
                <li>• Building trust with influencers and customers</li>
              </ul>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-6">
              <Button type="button" variant="outline" onClick={onPrev}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8">
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
