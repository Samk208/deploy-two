-- Create test admin user
-- Run this in Supabase SQL Editor

-- First, create the user in Supabase Auth (you'll need to do this manually in Supabase Dashboard)
-- Then run this SQL to set the role

-- Insert admin user into users table
-- Replace 'admin@onelink.com' with the email you used in Supabase Auth
INSERT INTO users (email, name, role, verified)
VALUES ('admin@onelink.com', 'Admin User', 'admin', true)
ON CONFLICT (email) 
DO UPDATE SET 
  role = 'admin',
  verified = true,
  updated_at = NOW();

-- Verify the admin user was created
SELECT id, email, name, role, verified, created_at 
FROM users 
WHERE email = 'admin@onelink.com';
