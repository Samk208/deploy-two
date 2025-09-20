# Onboarding System Database Schema

## Overview

This document describes the complete database schema for the One-Link platform's onboarding and verification system. The schema supports multi-role user onboarding (influencers, brands, customers, admins) with comprehensive KYC/verification workflows.

## Database Tables

### 1. `profiles`
**Purpose**: Extended user profile information linked to Supabase auth users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, REFERENCES auth.users(id) | User ID from Supabase auth |
| `role` | user_role | NOT NULL, DEFAULT 'customer' | User role enum |
| `handle` | TEXT | UNIQUE, CHECK format | Unique username/handle |
| `country` | TEXT | - | 2-letter ISO country code |
| `phone` | TEXT | CHECK format | International phone number |
| `language` | TEXT | DEFAULT 'en' | 2-letter ISO language code |
| `avatar_url` | TEXT | - | Profile picture URL |
| `banner_url` | TEXT | - | Profile banner URL |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Constraints**:
- `handle`: Must match `^[a-zA-Z0-9_-]{3,30}$`
- `phone`: Must match `^\+?[1-9]\d{1,14}$`

### 2. `verification_requests`
**Purpose**: Tracks user verification requests for role upgrades (customer → influencer/brand).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique request ID |
| `user_id` | UUID | NOT NULL, REFERENCES profiles(id) | User requesting verification |
| `role` | user_role | NOT NULL | Role being requested |
| `status` | verification_status | NOT NULL, DEFAULT 'draft' | Current status |
| `rejection_reason` | TEXT | - | Reason for rejection (if applicable) |
| `submitted_at` | TIMESTAMPTZ | - | When request was submitted |
| `reviewed_at` | TIMESTAMPTZ | - | When request was reviewed |
| `reviewed_by` | UUID | REFERENCES profiles(id) | Admin who reviewed |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Status Flow**: `draft` → `submitted` → `in_review` → `verified`/`rejected`

### 3. `verification_documents`
**Purpose**: Stores uploaded KYC documents for verification requests.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique document ID |
| `request_id` | UUID | NOT NULL, REFERENCES verification_requests(id) | Parent verification request |
| `doc_type` | document_type | NOT NULL | Type of document |
| `storage_path` | TEXT | NOT NULL | Path in Supabase storage |
| `mime_type` | TEXT | NOT NULL, CHECK allowed types | File MIME type |
| `size_bytes` | INTEGER | NOT NULL, CHECK ≤ 10MB | File size in bytes |
| `status` | document_status | NOT NULL, DEFAULT 'pending' | Document verification status |
| `rejection_reason` | TEXT | - | Reason for rejection |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Upload timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Allowed MIME Types**: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`

### 4. `brand_company`
**Purpose**: Business information for brand users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique company ID |
| `user_id` | UUID | NOT NULL, UNIQUE, REFERENCES profiles(id) | Brand user ID |
| `legal_name` | TEXT | NOT NULL | Legal company name |
| `trade_name` | TEXT | - | Trading/DBA name |
| `website` | TEXT | CHECK URL format | Company website |
| `support_email` | TEXT | NOT NULL, CHECK email format | Support email |
| `tax_country` | TEXT | NOT NULL | Tax jurisdiction country |
| `biz_registration_no` | TEXT | - | Business registration number |
| `mail_order_license_no` | TEXT | - | Mail order license (if applicable) |
| `address` | JSONB | NOT NULL, DEFAULT '{}' | Company address object |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Address JSONB Structure**:
```json
{
  "street": "123 Main St",
  "city": "New York",
  "state": "NY",
  "postal_code": "10001",
  "country": "US"
}
```

### 5. `brand_commission_defaults`
**Purpose**: Default commission rates for brand partnerships.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique record ID |
| `brand_user_id` | UUID | NOT NULL, UNIQUE, REFERENCES profiles(id) | Brand user ID |
| `rate_percent` | NUMERIC(5,2) | NOT NULL, DEFAULT 10.00, CHECK 0-95 | Commission percentage |
| `currency` | TEXT | NOT NULL, DEFAULT 'USD', CHECK format | 3-letter ISO currency |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

### 6. `influencer_payouts`
**Purpose**: Payout information for influencer users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique record ID |
| `user_id` | UUID | NOT NULL, UNIQUE, REFERENCES profiles(id) | Influencer user ID |
| `bank_holder` | TEXT | NOT NULL | Bank account holder name |
| `bank_name` | TEXT | NOT NULL | Bank name |
| `account_no_encrypted` | TEXT | NOT NULL | Encrypted account number |
| `iban_encrypted` | TEXT | - | Encrypted IBAN (if applicable) |
| `country` | TEXT | NOT NULL | Bank country code |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

## Enums

### `user_role`
- `'customer'`: Default role, basic platform access
- `'influencer'`: Can create shops and earn commissions
- `'brand'`: Can create products and manage partnerships
- `'admin'`: Full platform administration access

### `verification_status`
- `'draft'`: Request being prepared by user
- `'submitted'`: Request submitted for review
- `'in_review'`: Under admin review
- `'verified'`: Approved and role upgraded
- `'rejected'`: Rejected with reason

### `document_type`
- `'identity_card'`: Government ID card
- `'passport'`: Passport document
- `'drivers_license'`: Driver's license
- `'business_registration'`: Business registration certificate
- `'tax_certificate'`: Tax registration document
- `'bank_statement'`: Bank account statement
- `'utility_bill'`: Utility bill for address verification
- `'other'`: Other supporting documents

### `document_status`
- `'pending'`: Awaiting review
- `'verified'`: Document approved
- `'rejected'`: Document rejected

## Storage Buckets

### `kyc` Bucket
- **Purpose**: Store KYC/verification documents
- **Access**: Private (RLS controlled)
- **File Size Limit**: 10MB
- **Allowed Types**: JPEG, PNG, WebP, PDF
- **Folder Structure**: `/{user_id}/{document_id}.{ext}`

## Row Level Security (RLS) Policies

### General Principles
1. **Users can manage their own data**: Full CRUD on their own records
2. **Admins have full access**: Can view/manage all records
3. **Public profile data**: Limited public access to profile information
4. **Document privacy**: Only owners and admins can access documents

### Key Policies

#### Profiles
- Users can view/update their own profile
- Public read access for handle, avatar_url (for discovery)
- Admins can manage all profiles

#### Verification System
- Users can create/view their own verification requests
- Users can only update draft requests
- Admins can review and update any request
- Document access restricted to owners and admins

#### Brand/Influencer Data
- Users can manage their own business/payout information
- Admins have read access for support/compliance

#### Storage
- Users can upload to their own KYC folder: `/{user_id}/`
- Admins can access all KYC files

## Usage Examples

### 1. User Registration Flow
```sql
-- Auto-created via trigger when user signs up
INSERT INTO profiles (id, role) VALUES (auth.uid(), 'customer');
```

### 2. Role Upgrade Request
```sql
-- User requests influencer verification
INSERT INTO verification_requests (user_id, role, status) 
VALUES (auth.uid(), 'influencer', 'draft');

-- Upload documents
INSERT INTO verification_documents (request_id, doc_type, storage_path, mime_type, size_bytes)
VALUES (request_id, 'identity_card', 'kyc/user_id/doc1.jpg', 'image/jpeg', 1024000);

-- Submit for review
UPDATE verification_requests 
SET status = 'submitted', submitted_at = NOW() 
WHERE id = request_id AND user_id = auth.uid();
```

### 3. Admin Review Process
```sql
-- Admin reviews request
UPDATE verification_requests 
SET status = 'verified', reviewed_at = NOW(), reviewed_by = auth.uid()
WHERE id = request_id;

-- Update user role
UPDATE profiles 
SET role = 'influencer' 
WHERE id = user_id;
```

### 4. Brand Onboarding
```sql
-- Add company information
INSERT INTO brand_company (user_id, legal_name, support_email, tax_country, address)
VALUES (auth.uid(), 'Acme Corp', 'support@acme.com', 'US', '{"street":"123 Main St","city":"NYC"}');

-- Set commission defaults
INSERT INTO brand_commission_defaults (brand_user_id, rate_percent, currency)
VALUES (auth.uid(), 15.00, 'USD');
```

## Migration Instructions

1. **Run the migration**:
   ```bash
   supabase db push
   ```

2. **Verify tables created**:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('profiles', 'verification_requests', 'verification_documents', 'brand_company', 'brand_commission_defaults', 'influencer_payouts');
   ```

3. **Check RLS policies**:
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
   FROM pg_policies 
   WHERE schemaname = 'public';
   ```

4. **Verify storage bucket**:
   ```sql
   SELECT * FROM storage.buckets WHERE id = 'kyc';
   ```

## Security Considerations

1. **Sensitive Data**: Bank account numbers and IBANs should be encrypted at application level
2. **Document Access**: KYC documents are private and access-controlled
3. **Admin Actions**: All admin actions should be logged for audit trails
4. **Data Retention**: Consider implementing data retention policies for compliance
5. **GDPR Compliance**: Ensure right to deletion and data portability

## Performance Optimizations

- Indexes created on frequently queried columns
- Proper foreign key relationships for query optimization
- JSONB for flexible address storage with GIN indexing capability
- Partitioning consideration for large verification_documents table

## Next Steps

1. Implement API routes for onboarding workflows
2. Create frontend components for verification forms
3. Build admin dashboard for verification management
4. Add email notifications for status changes
5. Implement audit logging for compliance
