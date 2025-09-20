-- Check actual database schema
-- Run this in Supabase SQL Editor to see current table structures

-- Check users table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check what tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if specific columns exist in users table
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'role' 
    AND table_schema = 'public'
) as role_column_exists;

-- Check auth.users structure (Supabase auth table)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'auth'
ORDER BY ordinal_position;
