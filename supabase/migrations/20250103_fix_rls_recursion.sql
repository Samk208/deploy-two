-- Fix for infinite recursion in RLS policies
-- This migration fixes the circular reference in user policies

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Create a safe admin policy that doesn't cause recursion
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (
  -- Allow users to see their own profile always
  auth.uid() = id 
  OR 
  -- Allow admin access by checking auth metadata directly instead of querying users table
  (auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin')
  OR
  -- Alternative: Allow admin access via claims (if you set up custom claims)
  (auth.jwt() ->> 'app_metadata' ->> 'role' = 'admin')
);

-- Also update products policy to avoid recursion
DROP POLICY IF EXISTS "Suppliers can manage own products" ON products;
CREATE POLICY "Suppliers can manage own products" ON products FOR ALL USING (
  supplier_id = auth.uid() 
  OR 
  (auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin')
  OR
  (auth.jwt() ->> 'app_metadata' ->> 'role' = 'admin')
);

-- Update shops policy
DROP POLICY IF EXISTS "Influencers can manage own shops" ON shops;
CREATE POLICY "Influencers can manage own shops" ON shops FOR ALL USING (
  influencer_id = auth.uid() 
  OR 
  (auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin')
  OR
  (auth.jwt() ->> 'app_metadata' ->> 'role' = 'admin')
);

-- Update orders policy  
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (
  customer_id = auth.uid() 
  OR 
  (auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin')
  OR
  (auth.jwt() ->> 'app_metadata' ->> 'role' = 'admin')
);

-- Update commissions policy
DROP POLICY IF EXISTS "Users can view own commissions" ON commissions;
CREATE POLICY "Users can view own commissions" ON commissions FOR SELECT USING (
  influencer_id = auth.uid() 
  OR 
  supplier_id = auth.uid() 
  OR
  (auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin')
  OR
  (auth.jwt() ->> 'app_metadata' ->> 'role' = 'admin')
);

-- Create a simpler, more permissive policy for development/testing
-- This allows anyone to view public profiles (you can make this more restrictive later)
CREATE POLICY "Public profiles viewable" ON users FOR SELECT USING (
  -- Users can always see their own profile
  auth.uid() = id 
  OR
  -- For development: allow viewing verified users (suppliers/influencers)
  verified = true
  OR
  -- Admin access
  (auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin')
  OR
  (auth.jwt() ->> 'app_metadata' ->> 'role' = 'admin')
);
