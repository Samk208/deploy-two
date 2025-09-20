"use client"

import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { DocumentUploader } from "@/components/ui/document-uploader"
import { AlertTriangle, X, FileText } from "lucide-react"

interface VerificationBannerProps {
  userRole: "influencer" | "brand"
  verificationStatus: "pending" | "verified" | "rejected"
  onDismiss?: () => void
}

// Client Component wrapper that handles event handlers
export function VerificationBannerWrapper(props: VerificationBannerProps) {
  const handleDismiss = () => {
    console.log("[v0] Verification banner dismissed")
    if (props.onDismiss) {
      props.onDismiss()
    }
  }

  return <VerificationBanner {...props} onDismiss={handleDismiss} />
}

export function VerificationBanner({ userRole, verificationStatus, onDismiss }: VerificationBannerProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (verificationStatus === "verified") {
    return null
  }

  const getBannerContent = () => {
    switch (verificationStatus) {
      case "pending":
        return {
          title: "Verification in progress",
          description: "We're reviewing your submitted documents. This usually takes 1-2 business days.",
          variant: "default" as const,
          icon: AlertTriangle,
          actionText: "View documents",
          showAction: true,
        }
      case "rejected":
        return {
          title: "Verification required",
          description: "Some documents need to be resubmitted. Please review and upload new documents.",
          variant: "destructive" as const,
          icon: AlertTriangle,
          actionText: "Update documents",
          showAction: true,
        }
      default:
        return null
    }
  }

  const content = getBannerContent()
  if (!content) return null

  const Icon = content.icon

  return (
    <>
      <Alert variant={content.variant} className="mb-6">
        <Icon className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <strong className="font-medium">{content.title}</strong>
            <p className="text-sm mt-1">{content.description}</p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {content.showAction && (
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    {content.actionText}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[600px] lg:w-[800px] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Document Verification</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <DocumentUploader
                      userType={userRole}
                      onDocumentUpdate={(documentId, state) => {
                        console.log("[v0] Document updated:", documentId, state)
                      }}
                      onAllComplete={(allDocuments) => {
                        console.log("[v0] All documents complete:", allDocuments)
                        setIsOpen(false)
                      }}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            )}
            {onDismiss && (
              <Button variant="ghost" size="sm" onClick={onDismiss}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </>
  )
}
