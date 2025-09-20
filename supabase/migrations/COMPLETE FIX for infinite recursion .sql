-- COMPLETE FIX for infinite recursion in users table
-- This completely removes the problematic policies

-- Drop ALL existing policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view profiles" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Public profiles viewable" ON users;

-- Temporarily disable RLS on users table to stop recursion
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Or if you want to keep RLS enabled, create a simple non-recursive policy
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Simple user access" ON users FOR ALL USING (true);

-- Test that products can now be fetched
SELECT COUNT(*) as product_count FROM products WHERE active = true;
SELECT title, price, category FROM products WHERE active = true LIMIT 3;