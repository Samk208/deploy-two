"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ChevronLeft, ChevronRight, Info, DollarSign, TrendingUp, Percent, Calculator, Lightbulb } from "lucide-react"
import type { OnboardingData } from "../page"

const influencerCommissionSchema = z.object({
  defaultCommission: z.number().min(5).max(50),
})

const brandCommissionSchema = z.object({
  defaultCommission: z.number().min(5).max(95),
  minCommission: z.number().min(5).max(95),
  maxCommission: z.number().min(5).max(95),
  currency: z.string().min(1, "Please select a currency"),
  commissionInput: z.string().optional(), // For number input field
})

type InfluencerCommissionForm = z.infer<typeof influencerCommissionSchema>
type BrandCommissionForm = z.infer<typeof brandCommissionSchema>

interface CommissionStepProps {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
  onNext: (stepData: Partial<OnboardingData>) => void
  onPrev: () => void
}

const currencies = [
  { value: "USD", label: "USD - US Dollar", symbol: "$" },
  { value: "EUR", label: "EUR - Euro", symbol: "€" },
  { value: "GBP", label: "GBP - British Pound", symbol: "£" },
  { value: "JPY", label: "JPY - Japanese Yen", symbol: "¥" },
  { value: "KRW", label: "KRW - Korean Won", symbol: "₩" },
  { value: "CNY", label: "CNY - Chinese Yuan", symbol: "¥" },
  { value: "CAD", label: "CAD - Canadian Dollar", symbol: "C$" },
  { value: "AUD", label: "AUD - Australian Dollar", symbol: "A$" },
]

export default function CommissionStep({ data, updateData, onNext, onPrev }: CommissionStepProps) {
  const isInfluencer = data.role === "influencer"

  const influencerForm = useForm<InfluencerCommissionForm>({
    resolver: zodResolver(influencerCommissionSchema),
    defaultValues: {
      defaultCommission: data.defaultCommission || 15,
    },
  })

  const brandForm = useForm<BrandCommissionForm>({
    resolver: zodResolver(brandCommissionSchema),
    defaultValues: {
      defaultCommission: data.defaultCommission || 15,
      minCommission: data.minCommission || 5,
      maxCommission: data.maxCommission || 30,
      currency: data.currency || "",
      commissionInput: (data.defaultCommission || 15).toString(),
    },
  })

  const watchInfluencerCommission = influencerForm.watch("defaultCommission")
  const watchBrandCommission = brandForm.watch("defaultCommission")
  const watchMinCommission = brandForm.watch("minCommission")
  const watchMaxCommission = brandForm.watch("maxCommission")
  const watchCurrency = brandForm.watch("currency")

  const getCurrencySymbol = (currencyCode: string) => {
    const currency = currencies.find((c) => c.value === currencyCode)
    return currency?.symbol || "$"
  }

  const onInfluencerSubmit = (formData: InfluencerCommissionForm) => {
    onNext(formData)
  }

  const onBrandSubmit = (formData: BrandCommissionForm) => {
    if (formData.minCommission >= formData.maxCommission) {
      brandForm.setError("maxCommission", {
        message: "Maximum commission must be higher than minimum commission",
      })
      return
    }

    if (formData.defaultCommission < formData.minCommission || formData.defaultCommission > formData.maxCommission) {
      brandForm.setError("defaultCommission", {
        message: "Default commission must be between minimum and maximum values",
      })
      return
    }

    onNext(formData)
  }

  if (isInfluencer) {
    return (
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Commission Preferences</CardTitle>
          <p className="text-center text-gray-600 dark:text-gray-400">Understanding how you'll earn with One-Link</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">How Earnings Work</h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="w-4 h-4 text-indigo-600" />
                    <span className="font-medium text-sm">Commission Structure</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Earn a percentage of every sale made through your shop. Rates vary by product and brand partnership.
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-sm">Payment Schedule</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Commissions are paid monthly, 30 days after the customer's return period expires.
                  </p>
                </div>
              </div>

              <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
                <Lightbulb className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  <strong>Pro Tip:</strong> Higher engagement and authentic product recommendations typically lead to
                  better commission rates from brands.
                </AlertDescription>
              </Alert>
            </div>
          </div>

          <Form {...influencerForm}>
            <form onSubmit={influencerForm.handleSubmit(onInfluencerSubmit)} className="space-y-6">
              {/* Commission Rate Display */}
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-indigo-100 rounded-full">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">{watchInfluencerCommission}%</div>
                    <div className="text-xs text-indigo-500">Preferred</div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This is your preferred commission rate. Brands may offer different rates based on their products and
                  campaigns.
                </p>
              </div>

              {/* Commission Slider */}
              <FormField
                control={influencerForm.control}
                name="defaultCommission"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Preferred Commission Rate</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-4 h-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              This is your preferred rate, but actual commissions will be negotiated with each brand
                              based on their products and campaign requirements.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <FormControl>
                      <div className="space-y-4">
                        <Slider
                          value={[field.value]}
                          onValueChange={(value) => {
                            field.onChange(value[0])
                            updateData({ defaultCommission: value[0] })
                          }}
                          min={5}
                          max={50}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>5%</span>
                          <span>25%</span>
                          <span>50%</span>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Commission Tiers Info */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Typical Commission Ranges</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <div className="font-medium">5-10%</div>
                    <div className="text-gray-500">Electronics, Tech</div>
                  </div>
                  <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
                    <Percent className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <div className="font-medium">10-20%</div>
                    <div className="text-gray-500">Fashion, Lifestyle</div>
                  </div>
                  <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
                    <DollarSign className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                    <div className="font-medium">20-50%</div>
                    <div className="text-gray-500">Beauty, Wellness</div>
                  </div>
                </div>
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

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Commission Settings</CardTitle>
        <p className="text-center text-gray-600 dark:text-gray-400">
          Configure your commission rates and payment preferences
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...brandForm}>
          <form onSubmit={brandForm.handleSubmit(onBrandSubmit)} className="space-y-6">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-amber-100 dark:border-amber-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center">
                  <Percent className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Brand Commission Settings</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Number Input for Default Commission */}
                <div className="space-y-3">
                  <FormField
                    control={brandForm.control}
                    name="commissionInput"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Default Commission Rate</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type="number"
                              min="5"
                              max="95"
                              step="1"
                              placeholder="15"
                              className="pr-8 h-11"
                              onChange={(e) => {
                                const value = Number.parseInt(e.target.value) || 15
                                field.onChange(e.target.value)
                                brandForm.setValue("defaultCommission", value)
                                updateData({ defaultCommission: value })
                              }}
                            />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                              %
                            </span>
                          </div>
                        </FormControl>
                        <p className="text-xs text-gray-600">Range: 5% - 95%</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Currency Selection */}
                <div className="space-y-3">
                  <FormField
                    control={brandForm.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Payment Currency</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value)
                            updateData({ currency: value })
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {currencies.map((currency) => (
                              <SelectItem key={currency.value} value={currency.value}>
                                {currency.symbol} {currency.value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Per-product Override Helper Text */}
              <Alert className="mt-4 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  <strong>Flexible Pricing:</strong> You can override these default settings for individual products or
                  specific influencer partnerships later in your dashboard.
                </AlertDescription>
              </Alert>
            </div>

            {/* Commission Rate Settings */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Commission Rate Configuration</h3>

              {/* Default Commission Slider */}
              <FormField
                control={brandForm.control}
                name="defaultCommission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Commission Rate (%)</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-2">
                            <div className="text-center">
                              <div className="text-xl font-bold text-indigo-600">{watchBrandCommission}%</div>
                            </div>
                          </div>
                        </div>
                        <Slider
                          value={[field.value]}
                          onValueChange={(value) => {
                            field.onChange(value[0])
                            brandForm.setValue("commissionInput", value[0].toString())
                            updateData({ defaultCommission: value[0] })
                          }}
                          min={5}
                          max={95}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>5%</span>
                          <span>50%</span>
                          <span>95%</span>
                        </div>
                      </div>
                    </FormControl>
                    <p className="text-xs text-gray-500">
                      This will be the default commission rate offered to influencers
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Min/Max Commission Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={brandForm.control}
                  name="minCommission"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Commission (%)</FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          <div className="text-center text-sm font-medium text-gray-700">{watchMinCommission}%</div>
                          <Slider
                            value={[field.value]}
                            onValueChange={(value) => {
                              field.onChange(value[0])
                              updateData({ minCommission: value[0] })
                            }}
                            min={5}
                            max={95}
                            step={1}
                            className="w-full"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={brandForm.control}
                  name="maxCommission"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Commission (%)</FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          <div className="text-center text-sm font-medium text-gray-700">{watchMaxCommission}%</div>
                          <Slider
                            value={[field.value]}
                            onValueChange={(value) => {
                              field.onChange(value[0])
                              updateData({ maxCommission: value[0] })
                            }}
                            min={5}
                            max={95}
                            step={1}
                            className="w-full"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400">
                Set the range of commission rates you're willing to offer. You can adjust these for specific products or
                campaigns later.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Commission Preview</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
                  <div className="font-medium text-gray-900 dark:text-white">Minimum</div>
                  <div className="text-lg font-bold text-red-600">{watchMinCommission}%</div>
                  <div className="text-xs text-gray-500">
                    {getCurrencySymbol(watchCurrency)}10 product = {getCurrencySymbol(watchCurrency)}
                    {((10 * watchMinCommission) / 100).toFixed(2)}
                  </div>
                </div>
                <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
                  <div className="font-medium text-gray-900 dark:text-white">Default</div>
                  <div className="text-lg font-bold text-indigo-600">{watchBrandCommission}%</div>
                  <div className="text-xs text-gray-500">
                    {getCurrencySymbol(watchCurrency)}10 product = {getCurrencySymbol(watchCurrency)}
                    {((10 * watchBrandCommission) / 100).toFixed(2)}
                  </div>
                </div>
                <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
                  <div className="font-medium text-gray-900 dark:text-white">Maximum</div>
                  <div className="text-lg font-bold text-green-600">{watchMaxCommission}%</div>
                  <div className="text-xs text-gray-500">
                    {getCurrencySymbol(watchCurrency)}10 product = {getCurrencySymbol(watchCurrency)}
                    {((10 * watchMaxCommission) / 100).toFixed(2)}
                  </div>
                </div>
              </div>
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
