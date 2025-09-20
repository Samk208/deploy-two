# 🔧 ONBOARDING WORKFLOW FIX - COMPLETE INTEGRATION GUIDE

## 🚨 CRITICAL ISSUE IDENTIFIED

The enhanced onboarding workflow with document upload is **partially implemented** but **NOT integrated**. Here's what's happening:

### Current State:
1. ✅ **Sign-up page** correctly redirects to `/auth/onboarding?role=brand` or `role=influencer`
2. ✅ **Onboarding page** exists with all steps
3. ✅ **DocumentUploader component** exists and is functional
4. ❌ **KYC/KYB steps** are using SIMULATED uploads instead of real DocumentUploader
5. ❌ **Document upload API** exists but isn't connected to the frontend

## 📝 FILES THAT NEED UPDATING

### 1. **Fix InfluencerKYCStep.tsx**
Replace the simulated upload with real DocumentUploader:

```typescript
// app/auth/onboarding/components/InfluencerKYCStep.tsx

import { DocumentUploader } from "@/components/ui/document-uploader"

// Remove all the simulated upload code and FileUploadState interfaces

// In the component, replace the file upload sections with:
return (
  <div className="space-y-6">
    {/* ... existing form fields ... */}
    
    {/* Document Upload Section */}
    <Card>
      <CardHeader>
        <CardTitle>Identity Verification Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <DocumentUploader
          userType="influencer"
          onDocumentUpdate={(docId, state) => {
            // Update the onboarding data with document status
            updateData({
              [`${docId}_status`]: state.status,
              [`${docId}_id`]: state.uploadId
            })
          }}
          onAllComplete={(allDocs) => {
            // Check if all required docs are uploaded
            const allVerified = Object.values(allDocs).every(
              doc => doc.status === 'verified' || doc.status === 'submitted'
            )
            if (allVerified) {
              toast({
                title: "Documents uploaded successfully",
                description: "Your documents are being reviewed"
              })
            }
          }}
        />
      </CardContent>
    </Card>
    
    {/* ... rest of the component ... */}
  </div>
)
```

### 2. **Fix BrandKYBStep.tsx**
Similarly, replace simulated upload with real DocumentUploader:

```typescript
// app/auth/onboarding/components/BrandKYBStep.tsx

import { DocumentUploader } from "@/components/ui/document-uploader"

// Remove all the simulated upload code

// In the component:
return (
  <div className="space-y-6">
    {/* ... existing form fields ... */}
    
    {/* Document Upload Section */}
    <Card>
      <CardHeader>
        <CardTitle>Business Verification Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <DocumentUploader
          userType="brand"
          onDocumentUpdate={(docId, state) => {
            updateData({
              [`${docId}_status`]: state.status,
              [`${docId}_id`]: state.uploadId
            })
          }}
          onAllComplete={(allDocs) => {
            const allVerified = Object.values(allDocs).every(
              doc => doc.status === 'verified' || doc.status === 'submitted'
            )
            if (allVerified) {
              toast({
                title: "Business documents uploaded",
                description: "Your documents are under review"
              })
            }
          }}
        />
      </CardContent>
    </Card>
    
    {/* ... rest of the component ... */}
  </div>
)
```

### 3. **Fix DocumentUploader Component**
Update the upload function to use the real API:

```typescript
// components/ui/document-uploader.tsx

// Line 255 - Fix the upload function:
const uploadDocument = async (documentId: string, file: File): Promise<void> => {
  try {
    // Update progress
    setDocumentStates((prev) => ({
      ...prev,
      [documentId]: {
        ...prev[documentId],
        status: "submitted",
        progress: 20,
      }
    }))

    // Create FormData
    const formData = new FormData()
    formData.append('file', file)
    formData.append('documentType', documentId)

    // Upload to API
    const response = await fetch("/api/onboarding/docs", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Upload failed")
    }

    const result = await response.json()

    // Update state with success
    const newState: DocumentUploadState = {
      file,
      fileName: file.name,
      fileSize: formatFileSize(file.size),
      status: "submitted", // Will be "verified" after review
      progress: 100,
      uploadId: result.data.id,
    }

    setDocumentStates((prev) => ({
      ...prev,
      [documentId]: newState,
    }))

    onDocumentUpdate?.(documentId, newState)
    
    // Check if all documents are complete
    checkAllDocumentsComplete()
    
  } catch (error) {
    const errorState: DocumentUploadState = {
      file,
      fileName: file.name,
      fileSize: formatFileSize(file.size),
      status: "rejected",
      progress: 0,
      error: error instanceof Error ? error.message : "Upload failed",
    }

    setDocumentStates((prev) => ({
      ...prev,
      [documentId]: errorState,
    }))

    onDocumentUpdate?.(documentId, errorState)
  }
}
```

## 🚀 QUICK FIX IMPLEMENTATION

### Step 1: Create Fixed KYC Step Component
Save this as `app/auth/onboarding/components/InfluencerKYCStep.fixed.tsx`:

```typescript
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "@/hooks/use-toast"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DocumentUploader } from "@/components/ui/document-uploader"
import type { OnboardingData } from "../page"

const schema = z.object({
  bankAccountHolder: z.string().min(2, "Account holder name is required"),
  bankAccount: z.string().min(8, "Please enter a valid account number"),
})

type FormData = z.infer<typeof schema>

interface Props {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
  onNext: (stepData: Partial<OnboardingData>) => void
  onPrev: () => void
}

export default function InfluencerKYCStep({ data, updateData, onNext, onPrev }: Props) {
  const [documentsComplete, setDocumentsComplete] = useState(false)
  
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      bankAccountHolder: data.bankAccountHolder || "",
      bankAccount: data.bankAccount || "",
    },
  })

  const handleSubmit = (values: FormData) => {
    if (!documentsComplete) {
      toast({
        title: "Documents Required",
        description: "Please upload all required verification documents",
        variant: "destructive",
      })
      return
    }
    
    onNext(values)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Identity Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentUploader
            userType="influencer"
            onAllComplete={(docs) => {
              const allUploaded = Object.values(docs).every(
                d => d.status === 'submitted' || d.status === 'verified'
              )
              setDocumentsComplete(allUploaded)
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bank Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="bankAccountHolder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Holder Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Full name as on bank account" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bankAccount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number / IBAN</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter account number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={onPrev}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                <Button type="submit">
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
```

### Step 2: Create Fixed KYB Step Component
Save this as `app/auth/onboarding/components/BrandKYBStep.fixed.tsx`:

```typescript
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "@/hooks/use-toast"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DocumentUploader } from "@/components/ui/document-uploader"
import type { OnboardingData } from "../page"

const schema = z.object({
  businessId: z.string().min(5, "Business ID is required"),
})

type FormData = z.infer<typeof schema>

interface Props {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
  onNext: (stepData: Partial<OnboardingData>) => void
  onPrev: () => void
}

export default function BrandKYBStep({ data, updateData, onNext, onPrev }: Props) {
  const [documentsComplete, setDocumentsComplete] = useState(false)
  
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      businessId: data.businessId || "",
    },
  })

  const handleSubmit = (values: FormData) => {
    if (!documentsComplete) {
      toast({
        title: "Documents Required",
        description: "Please upload all required business documents",
        variant: "destructive",
      })
      return
    }
    
    onNext(values)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Business Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentUploader
            userType="brand"
            onAllComplete={(docs) => {
              const allUploaded = Object.values(docs).every(
                d => d.status === 'submitted' || d.status === 'verified'
              )
              setDocumentsComplete(allUploaded)
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="businessId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Registration Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter your business ID" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={onPrev}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                <Button type="submit">
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
```

## 📋 IMPLEMENTATION STEPS

### Quick Fix (5 minutes):
1. Create the two fixed component files above
2. Update the imports in `app/auth/onboarding/page.tsx`:
   ```typescript
   // Replace these imports:
   import InfluencerKYCStep from "./components/InfluencerKYCStep.fixed"
   import BrandKYBStep from "./components/BrandKYBStep.fixed"
   ```

### Full Fix (15 minutes):
1. Update the existing KYC/KYB components to use DocumentUploader
2. Remove all simulated upload code
3. Test the complete flow

## 🧪 TESTING THE FLOW

1. **Sign up as Influencer**:
   - Go to `/sign-up`
   - Select "Influencer" role
   - Complete sign up
   - Should redirect to `/auth/onboarding?role=influencer`
   - Should see document upload in Step 3

2. **Sign up as Brand**:
   - Go to `/sign-up`
   - Select "Supplier" role
   - Complete sign up
   - Should redirect to `/auth/onboarding?role=brand`
   - Should see business document upload in Step 3

## ✅ VERIFICATION CHECKLIST

- [ ] Sign-up redirects to onboarding with correct role
- [ ] Onboarding page loads without errors
- [ ] Document uploader appears in KYC/KYB steps
- [ ] Files upload to Supabase storage
- [ ] Upload progress shows correctly
- [ ] Documents are saved in database
- [ ] Can proceed to next step after uploads

## 🎯 FINAL STATUS

**Current Issues:**
1. DocumentUploader component exists but isn't integrated
2. KYC/KYB steps use simulated uploads
3. API endpoint exists but isn't connected

**After Fix:**
1. ✅ Real document upload working
2. ✅ Files saved to Supabase storage
3. ✅ Verification workflow complete
4. ✅ Separate flows for Brand vs Influencer

The onboarding workflow is **90% complete** - it just needs the DocumentUploader properly integrated into the KYC/KYB steps. Use the fixed components provided above for immediate deployment.
