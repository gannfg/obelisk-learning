-- Sync Admin Users from Auth Supabase to Learning Supabase
-- 
-- INSTRUCTIONS:
-- 1. First, get admin user IDs from Auth Supabase:
--    Run this in Auth Supabase SQL Editor:
--    SELECT id, email, is_admin FROM users WHERE is_admin = TRUE;
--
-- 2. Then, run this script in Learning Supabase SQL Editor
--    Replace the UUIDs below with your actual admin user IDs

-- Example: Sync admin users
-- Replace these UUIDs with your actual admin user IDs from Auth Supabase
INSERT INTO users (id, is_admin) 
VALUES 
  -- Add your admin user IDs here
  -- Example: ('00000000-0000-0000-0000-000000000001', TRUE),
  --          ('00000000-0000-0000-0000-000000000002', TRUE)
ON CONFLICT (id) DO UPDATE SET is_admin = EXCLUDED.is_admin;

-- Verify admins were synced
SELECT id, is_admin, created_at 
FROM users 
WHERE is_admin = TRUE;

