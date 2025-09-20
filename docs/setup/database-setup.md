# 🗄️ Database Setup Guide

## Prerequisites

- Access to your [Supabase Dashboard](https://app.supabase.com)
- A Supabase project created and configured
- Existing database migrations already applied

## Setup Steps

### Step 1: Run Compatible SQL Setup

**IMPORTANT**: Use the fixed SQL file that works with your existing database schema.

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Click **SQL Editor**
3. Click **New query**
4. Copy ALL content from `supabase/setup-auth-compatible.sql` (designed for Supabase auth.users)
5. Paste it in the SQL editor
6. Click **Run** (or press Ctrl+Enter)

### Why Use the Fixed Version?

The original `setup-complete.sql` file conflicts with your existing database migrations. The `setup-complete-fixed.sql` file:
- Works with your existing table structure
- Only adds missing tables and components
- Uses compatible RLS policies
- Avoids schema conflicts

### Step 2: Verification

After running the SQL file, your database will have:

## What Gets Created

### Tables
- **users** - User accounts and profiles
- **products** - Product catalog
- **orders** - Order management
- **shops** - Shop/store information
- **commissions** - Commission tracking
- **verification tables** - Email and document verification

### Functions
- **decrement_stock** - Automatic inventory management
- **update timestamps** - Automatic timestamp updates

### Indexes
- Performance optimization indexes for all tables

### Triggers
- Automatic timestamp updates on record changes

### Storage Buckets
- **documents** - Document uploads
- **products** - Product images
- **avatars** - User profile images

### RLS Policies
- Security rules for all tables
- Row-level security implementation

### Sample Data
- **8 sample products** ready for display
- **4 test users** with different roles:
  - supplier@example.com (Supplier account)
  - influencer@example.com (Influencer account)
  - customer@example.com (Customer account)
  - admin@example.com (Admin account)
- **1 shop** with associated products

## Verification Checklist

After running the setup, verify the following:

- [ ] All tables are created and visible in the Supabase dashboard
- [ ] Storage buckets are created
- [ ] Sample products are visible in the products table
- [ ] Test users are created
- [ ] RLS policies are active
- [ ] Functions and triggers are working

## Next Steps

Once the database setup is complete:

1. Update your environment variables
2. Test the application locally
3. Deploy to production

## Troubleshooting

If you encounter issues:

1. Check the SQL editor for error messages
2. Verify your Supabase project permissions
3. Ensure all required extensions are enabled
4. Check the Supabase logs for detailed error information

## NO CODE CHANGES NEEDED

With this SQL file, you don't need to:
- ❌ Edit any TypeScript files
- ❌ Manually create tables
- ❌ Set up policies one by one
- ❌ Add products manually

Everything is included in the single SQL file at `supabase/setup-complete.sql`.
