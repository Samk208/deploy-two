export enum UserRole {
  SUPPLIER = "supplier",
  INFLUENCER = "influencer",
  CUSTOMER = "customer",
  ADMIN = "admin",
}

export interface AuthResponse {
  ok: boolean
  role?: UserRole
  message?: string
  errors?: Record<string, string>
  user?: User
}

export interface ApiError {
  message: string
  errors?: Record<string, string>
}

export interface User {
  id: string
  email?: string
  name: string
  role: UserRole
  avatar?: string
  verified?: boolean
  createdAt: string
  updatedAt: string
}

export interface UserProfile {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  verified?: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  title: string
  description: string
  price: number
  originalPrice?: number
  images: string[]
  category: string
  region: string[]
  inStock: boolean
  stockCount: number
  commission: number
  active: boolean
  supplierId: string
  createdAt: string
  updatedAt: string
  sku?: string
}

export interface CartItem {
  id: string
  productId: string
  title: string
  price: number
  quantity: number
  image: string
  influencerHandle: string
  category?: string
  supplierId?: string
  supplierName?: string
  supplierVerified?: boolean
  maxQuantity?: number
  originalPrice?: number
}

export interface Order {
  id: string
  customerId: string
  items: CartItem[]
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  shippingAddress: Address
  billingAddress: Address
  paymentMethod: string
  stripePaymentIntentId?: string
  createdAt: string
  updatedAt: string
}

export interface Address {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface Shop {
  id: string
  influencerId: string
  handle: string
  name: string
  description?: string
  logo?: string
  banner?: string
  products: string[] // Product IDs
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface Commission {
  id: string
  orderId: string
  influencerId: string
  supplierId: string
  productId: string
  amount: number
  rate: number
  status: 'pending' | 'paid' | 'disputed'
  createdAt: string
  paidAt?: string
}

// API Response types
export interface ApiResponse<T = any> {
  ok: boolean
  data?: T
  message?: string
  errors?: Record<string, string>
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// CSV Import/Export types
export interface ImportResult {
  inserted: number
  updated: number
  errors: ImportError[]
}

export interface ImportError {
  row: number
  sku?: string
  errors: Array<{
    field: string
    message: string
  }>
}

export interface ProductCSV {
  sku: string
  title: string
  description: string
  image_urls: string
  base_price: number
  commission_pct: number
  regions: string
  inventory: number
  active: boolean
}

// ============================================================================
// ONBOARDING SYSTEM TYPES
// ============================================================================

export type OnboardingUserRole = 'influencer' | 'brand' | 'customer' | 'admin'
export type VerificationStatus = 'draft' | 'submitted' | 'in_review' | 'verified' | 'rejected'
export type DocumentType =
  | 'government_id'
  | 'bank_book'
  | 'business_registration_optional'
  | 'business_registration'
  | 'bank_account_book'
  | 'mail_order_sales_report'
  | 'identity_card'
  | 'passport'
  | 'drivers_license'
  | 'tax_certificate'
  | 'utility_bill'
  | 'other'
export type DocumentStatus = 'pending' | 'verified' | 'rejected'

export interface Profile {
  id: string
  role: OnboardingUserRole
  handle?: string
  country?: string
  phone?: string
  language: string
  avatar_url?: string
  banner_url?: string
  created_at: string
  updated_at: string
}

export interface VerificationRequest {
  id: string
  user_id: string
  role: OnboardingUserRole
  status: VerificationStatus
  rejection_reason?: string
  submitted_at?: string
  reviewed_at?: string
  reviewed_by?: string
  created_at: string
  updated_at: string
}

export interface VerificationDocument {
  id: string
  request_id: string
  doc_type: DocumentType
  storage_path: string
  mime_type: string
  size_bytes: number
  status: DocumentStatus
  rejection_reason?: string
  created_at: string
  updated_at: string
}

export interface BrandCompany {
  id: string
  user_id: string
  legal_name: string
  trade_name?: string
  website?: string
  support_email: string
  tax_country: string
  biz_registration_no?: string
  mail_order_license_no?: string
  address: Record<string, any>
  created_at: string
  updated_at: string
}

export interface BrandDetails {
  id?: string;
  profileId: string;
  companyName: string;
  companyWebsite?: string;
  industry: string;
  companySize: string;
  description: string;
  businessRegistrationNumber?: string;
  taxId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BrandCommissionDefaults {
  id: string
  brand_user_id: string
  rate_percent: number
  currency: string
  created_at: string
  updated_at: string
}

export interface InfluencerPayouts {
  id: string
  user_id: string
  bank_holder: string
  bank_name: string
  account_no_encrypted: string
  iban_encrypted?: string
  country: string
  created_at: string
  updated_at: string
}

// Onboarding API Response Types
export interface OnboardingApiResponse<T = any> {
  ok: boolean
  data?: T
  error?: string
  message?: string
  fieldErrors?: Record<string, string[]>
}

// Complete onboarding data for a user
export interface UserOnboardingData {
  profile: Profile
  verificationRequest?: VerificationRequest
  verificationDocuments?: VerificationDocument[]
  brandCompany?: BrandCompany
  brandCommissionDefaults?: BrandCommissionDefaults
  influencerPayouts?: InfluencerPayouts
}

// Icon type for Lucide icons and other icon components
export type Icon = React.ComponentType<{ className?: string; size?: number }>
