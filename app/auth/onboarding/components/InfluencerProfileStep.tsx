"use client"

import { useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { ChevronLeft, ChevronRight, Upload, X, Youtube, Instagram } from "lucide-react"
import type { OnboardingData } from "../page"

const influencerProfileSchema = z
  .object({
    socialLinks: z
      .object({
        youtube: z.string().url("Please enter a valid YouTube URL").optional().or(z.literal("")),
        tiktok: z.string().url("Please enter a valid TikTok URL").optional().or(z.literal("")),
        instagram: z.string().url("Please enter a valid Instagram URL").optional().or(z.literal("")),
      })
      .refine((data) => data.youtube || data.tiktok || data.instagram, "Please provide at least one social media link"),
    audienceSize: z.string().min(1, "Please select your audience size"),
    customAudienceSize: z.string().optional(),
    nicheTags: z.array(z.string()).min(1, "Please select at least one niche"),
    bio: z.string().min(50, "Bio must be at least 50 characters").max(500, "Bio must be less than 500 characters"),
  })
  .refine(
    (data) => {
      if (data.audienceSize === "custom") {
        return data.customAudienceSize && data.customAudienceSize.length > 0
      }
      return true
    },
    {
      message: "Please specify your custom audience size",
      path: ["customAudienceSize"],
    },
  )

type InfluencerProfileForm = z.infer<typeof influencerProfileSchema>

interface InfluencerProfileStepProps {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
  onNext: (stepData: Partial<OnboardingData>) => void
  onPrev: () => void
}

const audienceSizes = [
  { value: "1k-10k", label: "1K - 10K followers" },
  { value: "10k-50k", label: "10K - 50K followers" },
  { value: "50k-100k", label: "50K - 100K followers" },
  { value: "100k-500k", label: "100K - 500K followers" },
  { value: "500k-1m", label: "500K - 1M followers" },
  { value: "1m+", label: "1M+ followers" },
  { value: "custom", label: "Custom (specify below)" },
]

const availableNiches = [
  "Fashion",
  "Beauty",
  "Lifestyle",
  "Fitness",
  "Food",
  "Travel",
  "Technology",
  "Gaming",
  "Music",
  "Art",
  "Photography",
  "Business",
  "Education",
  "Health",
  "Parenting",
  "Home & Garden",
  "Sports",
  "Entertainment",
]

export default function InfluencerProfileStep({ data, updateData, onNext, onPrev }: InfluencerProfileStepProps) {
  const [selectedNiches, setSelectedNiches] = useState<string[]>(data.nicheTags || [])
  const [newNiche, setNewNiche] = useState("")
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)

  const form = useForm<InfluencerProfileForm>({
    resolver: zodResolver(influencerProfileSchema),
    defaultValues: {
      socialLinks: data.socialLinks || {},
      audienceSize: data.audienceSize || "",
      customAudienceSize: "",
      nicheTags: data.nicheTags || [],
      bio: data.bio || "",
    },
  })

  const watchAudienceSize = form.watch("audienceSize")

  const handleFileUpload = useCallback(
    (file: File, type: "avatar" | "banner") => {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 5MB",
          variant: "destructive",
        })
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const preview = e.target?.result as string
        if (type === "avatar") {
          setAvatarPreview(preview)
          updateData({ avatar: file })
        } else {
          setBannerPreview(preview)
          updateData({ banner: file })
        }
      }
      reader.readAsDataURL(file)
    },
    [updateData],
  )

  const addNiche = (niche: string) => {
    if (niche && !selectedNiches.includes(niche)) {
      const newNiches = [...selectedNiches, niche]
      setSelectedNiches(newNiches)
      form.setValue("nicheTags", newNiches)
      updateData({ nicheTags: newNiches })
      setNewNiche("")
    }
  }

  const removeNiche = (niche: string) => {
    const newNiches = selectedNiches.filter((n) => n !== niche)
    setSelectedNiches(newNiches)
    form.setValue("nicheTags", newNiches)
    updateData({ nicheTags: newNiches })
  }

  const onSubmit = (formData: InfluencerProfileForm) => {
    const stepData = {
      ...formData,
      nicheTags: selectedNiches,
    }
    onNext(stepData)
  }

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Influencer Profile</CardTitle>
        <p className="text-center text-gray-600 dark:text-gray-400">Tell us about your social presence and audience</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Social Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Social Media Links *</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Provide at least one social media profile where you create content
              </p>

              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="socialLinks.youtube"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Youtube className="w-4 h-4 text-red-600" />
                        YouTube Channel
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://youtube.com/@yourchannel"
                          className="h-11"
                          onChange={(e) => {
                            field.onChange(e)
                            updateData({
                              socialLinks: { ...data.socialLinks, youtube: e.target.value },
                            })
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="socialLinks.tiktok"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-black rounded-sm flex items-center justify-center">
                          <span className="text-white text-xs font-bold">T</span>
                        </div>
                        TikTok Profile
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://tiktok.com/@yourusername"
                          className="h-11"
                          onChange={(e) => {
                            field.onChange(e)
                            updateData({
                              socialLinks: { ...data.socialLinks, tiktok: e.target.value },
                            })
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="socialLinks.instagram"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Instagram className="w-4 h-4 text-pink-600" />
                        Instagram Profile
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://instagram.com/yourusername"
                          className="h-11"
                          onChange={(e) => {
                            field.onChange(e)
                            updateData({
                              socialLinks: { ...data.socialLinks, instagram: e.target.value },
                            })
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Audience Size */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="audienceSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audience Size *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        updateData({ audienceSize: value })
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select your audience size" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {audienceSizes.map((size) => (
                          <SelectItem key={size.value} value={size.value}>
                            {size.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchAudienceSize === "custom" && (
                <FormField
                  control={form.control}
                  name="customAudienceSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Audience Size</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., 750K followers across platforms" className="h-11" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Niche Tags */}
            <div className="space-y-4">
              <FormLabel>Content Niches *</FormLabel>
              <p className="text-sm text-gray-600 dark:text-gray-400">Select the topics you create content about</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {selectedNiches.map((niche) => (
                  <Badge key={niche} variant="secondary" className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200">
                    {niche}
                    <button type="button" onClick={() => removeNiche(niche)} className="ml-2 hover:text-indigo-600">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {availableNiches
                  .filter((niche) => !selectedNiches.includes(niche))
                  .map((niche) => (
                    <Button
                      key={niche}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addNiche(niche)}
                      className="justify-start"
                    >
                      {niche}
                    </Button>
                  ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Add custom niche"
                  value={newNiche}
                  onChange={(e) => setNewNiche(e.target.value)}
                  className="h-9"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addNiche(newNiche)
                    }
                  }}
                />
                <Button type="button" size="sm" onClick={() => addNiche(newNiche)}>
                  Add
                </Button>
              </div>

              {selectedNiches.length === 0 && <p className="text-sm text-red-600">Please select at least one niche</p>}
            </div>

            {/* Bio */}
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Tell us about yourself and your content. What makes you unique? What value do you provide to your audience?"
                      className="min-h-[120px] resize-none"
                      onChange={(e) => {
                        field.onChange(e)
                        updateData({ bio: e.target.value })
                      }}
                    />
                  </FormControl>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Minimum 50 characters</span>
                    <span>{field.value?.length || 0}/500</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Avatar Upload */}
              <div className="space-y-3">
                <FormLabel>Profile Picture</FormLabel>
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-indigo-400 transition-colors">
                  {avatarPreview ? (
                    <div className="relative">
                      <img
                        src={avatarPreview || "/placeholder.svg"}
                        alt="Avatar preview"
                        className="w-24 h-24 rounded-full mx-auto object-cover"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2 bg-transparent"
                        onClick={() => {
                          setAvatarPreview(null)
                          updateData({ avatar: undefined })
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Drop your profile picture here</p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileUpload(file, "avatar")
                        }}
                        className="hidden"
                        id="avatar-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2 bg-transparent"
                        onClick={() => document.getElementById("avatar-upload")?.click()}
                      >
                        Choose File
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Banner Upload */}
              <div className="space-y-3">
                <FormLabel>Banner Image</FormLabel>
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-indigo-400 transition-colors">
                  {bannerPreview ? (
                    <div className="relative">
                      <img
                        src={bannerPreview || "/placeholder.svg"}
                        alt="Banner preview"
                        className="w-full h-24 rounded-lg mx-auto object-cover"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2 bg-transparent"
                        onClick={() => {
                          setBannerPreview(null)
                          updateData({ banner: undefined })
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Drop your banner image here</p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileUpload(file, "banner")
                        }}
                        className="hidden"
                        id="banner-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2 bg-transparent"
                        onClick={() => document.getElementById("banner-upload")?.click()}
                      >
                        Choose File
                      </Button>
                    </div>
                  )}
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
