import { z } from 'zod'

// ============================================================================
// ONBOARDING VALIDATION SCHEMAS
// ============================================================================

export const onboardingInfluencerSchema = z.object({
  handle: z.string().regex(/^[a-zA-Z0-9_-]{3,30}$/, 'Handle must be 3-30 characters, alphanumeric, underscore, or dash only'),
  country: z.string().length(2, 'Country must be 2-letter ISO code'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  language: z.string().length(2, 'Language must be 2-letter ISO code'),
  avatar_url: z.string().url('Invalid avatar URL').optional(),
  banner_url: z.string().url('Invalid banner URL').optional(),
})

export const onboardingBrandSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(255),
  companyWebsite: z.string().url('Invalid website URL').optional(),
  industry: z.string().min(1, 'Industry is required'),
  companySize: z.string().min(1, 'Company size is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  businessRegistrationNumber: z.string().optional(),
  taxId: z.string().optional(),
})

// ============================================================================
// PRODUCT VALIDATION SCHEMAS
// ============================================================================

export const productUpsertSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  originalPrice: z.number().min(0.01).optional(),
  images: z.array(z.string().url('Invalid image URL')).min(1, 'At least one image is required'),
  category: z.string().min(1, 'Category is required'),
  region: z.array(z.string()).min(1, 'At least one region is required'),
  stockCount: z.number().int().min(0, 'Stock count must be 0 or greater'),
  commission: z.number().min(0, 'Commission must be 0 or greater').max(95, 'Commission cannot exceed 95%'),
  active: z.boolean().default(true),
})

// ============================================================================
// COMMISSION VALIDATION SCHEMAS
// ============================================================================

export const commissionCreateSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  influencerId: z.string().uuid('Invalid influencer ID').optional(),
  supplierId: z.string().uuid('Invalid supplier ID').optional(),
  productId: z.string().uuid('Invalid product ID'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  rate: z.number().min(0, 'Rate must be 0 or greater').max(100, 'Rate cannot exceed 100%').optional(),
  status: z.enum(['pending', 'paid', 'disputed']).default('pending'),
  disputeReason: z.string().optional(),
})

export const commissionUpdateSchema = z.object({
  status: z.enum(['pending', 'paid', 'disputed']).optional(),
  disputeReason: z.string().optional(),
  paidAt: z.string().datetime().optional(),
})

// ============================================================================
// CHECKOUT VALIDATION SCHEMAS
// ============================================================================

export const checkoutLineSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  price: z.number().min(0.01, 'Price must be greater than 0'),
})

export const checkoutSessionSchema = z.object({
  items: z.array(checkoutLineSchema).min(1, 'At least one item is required'),
  customerInfo: z.object({
    email: z.string().email('Invalid email address'),
    name: z.string().min(1, 'Name is required'),
    phone: z.string().optional(),
  }),
  shippingAddress: z.object({
    line1: z.string().min(1, 'Address line 1 is required'),
    line2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postal_code: z.string().min(1, 'Postal code is required'),
    country: z.string().length(2, 'Country must be 2-letter ISO code'),
  }),
  influencerHandle: z.string().optional(),
})

// ============================================================================
// USER VALIDATION SCHEMAS
// ============================================================================

export const userProfileSchema = z.object({
  role: z.enum(['influencer', 'brand', 'customer', 'admin']),
  handle: z.string().regex(/^[a-zA-Z0-9_-]{3,30}$/, 'Handle must be 3-30 characters, alphanumeric, underscore, or dash only').optional(),
  country: z.string().length(2, 'Country must be 2-letter ISO code').optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
  language: z.string().length(2, 'Language must be 2-letter ISO code').optional(),
  avatar_url: z.string().url('Invalid avatar URL').optional(),
  banner_url: z.string().url('Invalid banner URL').optional(),
})

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type OnboardingInfluencer = z.infer<typeof onboardingInfluencerSchema>
export type OnboardingBrand = z.infer<typeof onboardingBrandSchema>
export type ProductUpsert = z.infer<typeof productUpsertSchema>
export type CommissionCreate = z.infer<typeof commissionCreateSchema>
export type CommissionUpdate = z.infer<typeof commissionUpdateSchema>
export type CheckoutLine = z.infer<typeof checkoutLineSchema>
export type CheckoutSession = z.infer<typeof checkoutSessionSchema>
export type UserProfile = z.infer<typeof userProfileSchema>
