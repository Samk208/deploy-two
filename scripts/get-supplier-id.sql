-- Get Supplier ID Script
-- Run this first to get the supplier UUID for the insert script

-- 1. Check if we have any suppliers
SELECT id, email, name, role, created_at
FROM users
WHERE
    role = 'supplier'
ORDER BY created_at ASC;

-- If no suppliers exist, this will help you create one:
-- You can either:
-- A) Convert an existing user to supplier role:
-- UPDATE users SET role = 'supplier' WHERE email = 'your-email@example.com';

-- B) Or check what users exist:
SELECT id, email, name, role
FROM users
ORDER BY created_at ASC;

-- 2. Once you have the supplier ID, replace 'your-supplier-id-here' in the products insert script
-- The UUID will look something like: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'