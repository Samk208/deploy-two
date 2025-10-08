-- Quick fix to get supplier ID from any table structure
-- Run this to get a supplier ID for immediate testing

-- Try to get from profiles table (most likely)
SELECT 'SUPPLIER FROM PROFILES' as source, id as supplier_id, COALESCE(name, email, 'Unknown') as name
FROM profiles
WHERE
    role = 'supplier'
LIMIT 1;

-- If that fails, try auth.users (Supabase default)
SELECT
    'SUPPLIER FROM AUTH' as source,
    id as supplier_id,
    email as name
FROM auth.users
LIMIT 1;

-- If no suppliers exist, we can convert any user or create one:
-- UPDATE profiles SET role = 'supplier' WHERE id = 'some-existing-user-id';

-- Or show any existing users to convert:
SELECT 'AVAILABLE USERS TO CONVERT' as source, id, COALESCE(role, 'no role') as current_role, COALESCE(name, email, 'Unknown') as name
FROM profiles
LIMIT 3;