"use client"

import React, { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

// Document status types
type DocumentStatus = "pending" | "submitted" | "verified" | "rejected"

// Document upload state
interface DocumentUploadState {
  file: File | null
  fileName?: string
  fileSize?: string
  status: DocumentStatus
  progress: number
  error?: string
  rejectionReason?: string
  uploadId?: string
}

// Document configuration
interface DocumentConfig {
  id: string
  label: string
  helpText: string
  exampleUrl?: string
  required: boolean
  acceptedTypes: string[]
  maxSize: number // in MB
}

// Document sets for different user types
const DOCUMENT_SETS = {
  influencer: [
    {
      id: "id_document",
      label: "Government-issued ID",
      helpText: "Upload a clear photo of your passport, driver's license, or national ID card",
      exampleUrl: "/examples/id-example.jpg",
      required: true,
      acceptedTypes: ["image/*"],
      maxSize: 10,
    },
    {
      id: "selfie",
      label: "Selfie with ID",
      helpText: "Take a selfie holding your ID document next to your face",
      exampleUrl: "/examples/selfie-example.jpg",
      required: true,
      acceptedTypes: ["image/*"],
      maxSize: 10,
    },
    {
      id: "proof_of_address",
      label: "Proof of Address",
      helpText: "Upload a utility bill, bank statement, or lease agreement (within 3 months)",
      exampleUrl: "/examples/address-example.jpg",
      required: true,
      acceptedTypes: ["image/*", "application/pdf"],
      maxSize: 10,
    },
    {
      id: "bank_statement",
      label: "Bank Statement/Passbook",
      helpText: "Upload your bank statement or passbook showing account details",
      exampleUrl: "/examples/bank-example.jpg",
      required: true,
      acceptedTypes: ["image/*", "application/pdf"],
      maxSize: 10,
    },
  ],
  brand: [
    {
      id: "bank_passbook",
      label: "Bank Account Book/Passbook Image",
      helpText: "Upload a clear photo of your business bank account passbook or voided check",
      exampleUrl: "/examples/bank-passbook-example.jpg",
      required: true,
      acceptedTypes: ["image/*"],
      maxSize: 10,
    },
    {
      id: "business_registration",
      label: "Business Registration Certificate",
      helpText: "Upload your official business registration certificate or incorporation documents",
      exampleUrl: "/examples/business-reg-example.jpg",
      required: true,
      acceptedTypes: ["image/*", "application/pdf"],
      maxSize: 10,
    },
    {
      id: "retail_permit",
      label: "Mail-order/Online Retail Report/Permit",
      helpText: "Upload your e-commerce or mail-order business permit/license",
      exampleUrl: "/examples/retail-permit-example.jpg",
      required: true,
      acceptedTypes: ["image/*", "application/pdf"],
      maxSize: 10,
    },
    {
      id: "business_number",
      label: "National Business Number",
      helpText: "Enter your business registration number (will be masked for security)",
      required: true,
      acceptedTypes: [],
      maxSize: 0,
    },
    {
      id: "authorized_rep_id",
      label: "Authorized Representative ID",
      helpText: "Upload ID document of the person authorized to represent the business",
      exampleUrl: "/examples/rep-id-example.jpg",
      required: true,
      acceptedTypes: ["image/*"],
      maxSize: 10,
    },
  ],
}

interface DocumentUploaderProps {
  userType: "influencer" | "brand"
  onDocumentUpdate?: (documentId: string, state: DocumentUploadState) => void
  onAllComplete?: (allDocuments: Record<string, DocumentUploadState>) => void
  className?: string
}

const StatusIcon = ({ status }: { status: DocumentStatus }) => {
  const icons = {
    pending: (
      <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-gray-300" />
      </div>
    ),
    submitted: (
      <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    ),
    verified: (
      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    ),
    rejected: (
      <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    ),
  }
  return icons[status]
}

const StatusBadge = ({ status }: { status: DocumentStatus }) => {
  const variants = {
    pending: { variant: "secondary" as const, text: "Pending" },
    submitted: { variant: "default" as const, text: "Submitted" },
    verified: { variant: "default" as const, text: "Verified" },
    rejected: { variant: "destructive" as const, text: "Rejected" },
  }

  const { variant, text } = variants[status]
  return (
    <Badge
      variant={variant}
      className={cn(
        status === "verified" && "bg-green-500 hover:bg-green-600",
        status === "submitted" && "bg-amber-500 hover:bg-amber-600",
      )}
    >
      {text}
    </Badge>
  )
}

export function DocumentUploader({ userType, onDocumentUpdate, onAllComplete, className }: DocumentUploaderProps) {
  const documents = DOCUMENT_SETS[userType]
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Initialize document states
  const [documentStates, setDocumentStates] = useState<Record<string, DocumentUploadState>>(() => {
    const initialStates: Record<string, DocumentUploadState> = {}
    documents.forEach((doc) => {
      initialStates[doc.id] = {
        file: null,
        status: "pending",
        progress: 0,
      }
    })
    return initialStates
  })

  const [businessNumber, setBusinessNumber] = useState("")
  const [isUploading, setIsUploading] = useState(false)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const validateFile = (file: File, config: DocumentConfig): string | null => {
    // Check file size
    if (file.size > config.maxSize * 1024 * 1024) {
      return `File size must be less than ${config.maxSize}MB`
    }

    // Check file type
    const isValidType = config.acceptedTypes.some((type) => {
      if (type.endsWith("/*")) {
        return file.type.startsWith(type.replace("/*", "/"))
      }
      return file.type === type
    })

    if (!isValidType) {
      return `File type not supported. Accepted types: ${config.acceptedTypes.join(", ")}`
    }

    return null
  }

  const uploadDocument = async (documentId: string, file: File): Promise<void> => {
    try {
      // Create FormData for inline file upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', documentId)

      // Upload file directly to API
      const response = await fetch("/api/onboarding/docs", {
        method: "POST",
        body: formData, // Send FormData instead of JSON
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload document")
      }

      const result = await response.json()

      // Update final state
      const newState: DocumentUploadState = {
        file,
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        status: "verified", // Auto-approved for development
        progress: 100,
        uploadId: result.data.id,
      }

      setDocumentStates((prev) => ({
        ...prev,
        [documentId]: newState,
      }))

      onDocumentUpdate?.(documentId, newState)
    } catch (error) {
      const errorState: DocumentUploadState = {
        ...documentStates[documentId],
        status: "pending",
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

  const handleFileSelect = useCallback(
    async (documentId: string, file: File) => {
      const config = documents.find((d) => d.id === documentId)
      if (!config) return

      const validationError = validateFile(file, config)
      if (validationError) {
        setDocumentStates((prev) => ({
          ...prev,
          [documentId]: {
            ...prev[documentId],
            error: validationError,
          },
        }))
        return
      }

      // Clear any previous error
      setDocumentStates((prev) => ({
        ...prev,
        [documentId]: {
          ...prev[documentId],
          file,
          error: undefined,
          status: "pending",
          progress: 0,
        },
      }))

      await uploadDocument(documentId, file)
    },
    [documents],
  )

  const handleUploadClick = (documentId: string) => {
    fileInputRefs.current[documentId]?.click()
  }

  const handleBulkUpload = async () => {
    setIsUploading(true)

    for (const doc of documents) {
      const state = documentStates[doc.id]
      if (state.file && state.status === "pending") {
        await uploadDocument(doc.id, state.file)
      }
    }

    setIsUploading(false)
  }

  const allDocumentsComplete = documents.every((doc) => documentStates[doc.id]?.status === "verified")

  React.useEffect(() => {
    if (allDocumentsComplete) {
      onAllComplete?.(documentStates)
    }
  }, [allDocumentsComplete, documentStates, onAllComplete])

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with bulk upload */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Document Verification</h3>
          <p className="text-sm text-gray-600">Upload the required documents for identity verification</p>
        </div>
        <Button
          onClick={handleBulkUpload}
          disabled={isUploading || !documents.some((doc) => documentStates[doc.id]?.file)}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {isUploading ? "Uploading..." : "Upload All"}
        </Button>
      </div>

      {/* Document list */}
      <div className="space-y-4">
        {documents.map((doc) => {
          const state = documentStates[doc.id]
          const isBusinessNumber = doc.id === "business_number"

          return (
            <Card key={doc.id} className="p-4">
              <div className="flex items-start gap-4">
                {/* Status icon */}
                <div className="flex-shrink-0 mt-1">
                  <StatusIcon status={state.status} />
                </div>

                {/* Document info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">{doc.label}</h4>
                    {doc.required && (
                      <Badge variant="outline" className="text-xs">
                        Required
                      </Badge>
                    )}
                    <StatusBadge status={state.status} />
                  </div>

                  <p className="text-sm text-gray-600 mb-2">{doc.helpText}</p>

                  {doc.exampleUrl && (
                    <a
                      href={doc.exampleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:text-indigo-700 underline"
                    >
                      View example
                    </a>
                  )}

                  {/* File info */}
                  {state.fileName && (
                    <div className="mt-2 text-sm text-gray-700">
                      <span className="font-medium">{state.fileName}</span>
                      {state.fileSize && <span className="ml-2 text-gray-500">({state.fileSize})</span>}
                    </div>
                  )}

                  {/* Progress bar */}
                  {state.progress > 0 && state.progress < 100 && (
                    <div className="mt-2">
                      <Progress value={state.progress} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">Uploading... {state.progress}%</p>
                    </div>
                  )}

                  {/* Error message */}
                  {state.error && (
                    <Alert className="mt-2 border-red-200 bg-red-50">
                      <AlertDescription className="text-red-700">{state.error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Rejection reason */}
                  {state.status === "rejected" && state.rejectionReason && (
                    <Alert className="mt-2 border-red-200 bg-red-50">
                      <AlertDescription className="text-red-700">
                        <strong>Rejected:</strong> {state.rejectionReason}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Upload button */}
                <div className="flex-shrink-0">
                  {isBusinessNumber ? (
                    <div className="w-32">
                      <input
                        type="text"
                        value={businessNumber}
                        onChange={(e) => setBusinessNumber(e.target.value)}
                        placeholder="Enter number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  ) : (
                    <>
                      <input
                        ref={(el) => {
                          if (el) {
                            fileInputRefs.current[doc.id] = el
                          }
                        }}
                        type="file"
                        accept={doc.acceptedTypes.join(",")}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileSelect(doc.id, file)
                        }}
                        className="hidden"
                      />
                      <Button
                        onClick={() => handleUploadClick(doc.id)}
                        variant={state.status === "verified" ? "outline" : "default"}
                        size="sm"
                        className={cn(
                          state.status === "pending" && "bg-indigo-600 hover:bg-indigo-700",
                          state.status === "rejected" && "bg-red-600 hover:bg-red-700",
                        )}
                      >
                        {state.status === "verified"
                          ? "Replace"
                          : state.status === "rejected"
                            ? "Upload New"
                            : "Upload"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Virus scan notice */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertDescription className="text-blue-700">
          <strong>Security Notice:</strong> All uploaded files are automatically scanned for viruses and malware before
          processing.
        </AlertDescription>
      </Alert>
    </div>
  )
}
