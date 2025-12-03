-- Admin setup for Obelisk Learning
-- Run this in your Auth Supabase (lantaidua-universal-auth) project

-- 1. Add is_admin flag to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Make specific accounts admins
UPDATE users
SET is_admin = TRUE
WHERE email = 'gany.wicaksono@gmail.com';

UPDATE users
SET is_admin = TRUE
WHERE email = 'amirsafruddin99@gmail.com';

-- You can add more admins like this:
-- UPDATE users SET is_admin = TRUE WHERE email = 'someone@example.com';


