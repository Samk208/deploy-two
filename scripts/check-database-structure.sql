-- =====================================================
-- DATABASE STRUCTURE DISCOVERY
-- =====================================================
-- Run this to understand your actual database schema

-- =====================================================
-- CHECK 1: What tables exist?
-- =====================================================
SELECT
    '1. AVAILABLE TABLES' as check_type,
    table_name,
    table_type
FROM information_schema.tables
WHERE
    table_schema = 'public'
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =====================================================
-- CHECK 2: Users table structure (or similar)
-- =====================================================
-- Check if 'users' table exists and its columns
SELECT
    '2. USERS TABLE COLUMNS' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE
    table_name = 'users'
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- CHECK 3: Check for 'profiles' table (common alternative)
-- =====================================================
SELECT
    '3. PROFILES TABLE COLUMNS' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE
    table_name = 'profiles'
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- CHECK 4: Products table structure
-- =====================================================
SELECT
    '4. PRODUCTS TABLE COLUMNS' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE
    table_name = 'products'
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- CHECK 5: Look for user-related tables
-- =====================================================
SELECT '5. USER RELATED TABLES' as check_type, table_name
FROM information_schema.tables
WHERE
    table_schema = 'public'
    AND table_name LIKE '%user%'
    OR table_name LIKE '%profile%'
    OR table_name LIKE '%auth%'
ORDER BY table_name;

-- =====================================================
-- CHECK 6: Check auth schema (Supabase default)
-- =====================================================
SELECT
    '6. AUTH USERS COLUMNS' as check_type,
    column_name,
    data_type
FROM information_schema.columns
WHERE
    table_name = 'users'
    AND table_schema = 'auth'
ORDER BY ordinal_position;

-- =====================================================
-- CHECK 7: Sample data from available user table
-- =====================================================
-- Try profiles first (most likely in your setup)
SELECT '7a. PROFILES SAMPLE' as check_type, COUNT(*) as total_rows
FROM profiles;

-- Try users table
SELECT '7b. USERS SAMPLE' as check_type, COUNT(*) as total_rows
FROM users;

-- =====================================================
-- SUMMARY
-- =====================================================
SELECT 'SUMMARY' as check_type, 'Share these results to fix the role column issue' as instruction;