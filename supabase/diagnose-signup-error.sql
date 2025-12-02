-- Diagnostic queries to identify signup issues
-- Run these in Supabase SQL Editor to diagnose the 500 error

-- 1. Check if users table exists
SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_name = 'users' AND table_schema = 'public';

-- 2. Check if the trigger exists
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';

-- 3. Check if the trigger function exists
SELECT 
  proname as function_name,
  prosrc as function_source
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 4. Check RLS status on users table
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- 5. Check RLS policies on users table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users';

-- 6. Check for foreign key constraints
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'users';

-- 7. Test the trigger function manually (this will help identify errors)
-- Replace '00000000-0000-0000-0000-000000000000' with a test UUID
DO $$
DECLARE
  test_user_id UUID := '00000000-0000-0000-0000-000000000000';
  test_email TEXT := 'test@example.com';
BEGIN
  -- Try to insert a test user (this will trigger the function)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
  ) VALUES (
    test_user_id,
    '00000000-0000-0000-0000-000000000000',
    test_email,
    crypt('testpassword', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{}',
    '{}',
    false,
    'authenticated'
  ) ON CONFLICT (id) DO NOTHING;
  
  -- Check if profile was created
  IF EXISTS (SELECT 1 FROM public.users WHERE id = test_user_id) THEN
    RAISE NOTICE 'SUCCESS: Profile was created';
  ELSE
    RAISE NOTICE 'ERROR: Profile was NOT created';
  END IF;
  
  -- Clean up test user
  DELETE FROM auth.users WHERE id = test_user_id;
  DELETE FROM public.users WHERE id = test_user_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: %', SQLERRM;
END $$;

-- 8. Check if the function has SECURITY DEFINER set correctly
SELECT 
  proname as function_name,
  prosecdef as is_security_definer,
  proowner::regrole as function_owner,
  proconfig as function_config
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 9. Check function permissions
SELECT 
  p.proname as function_name,
  pg_get_userbyid(p.proowner) as owner,
  CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END as security_type
FROM pg_proc p
WHERE p.proname = 'handle_new_user';

-- 10. Test if auth.uid() is available during trigger execution
-- This will help identify if the issue is with auth context
SELECT 
  current_setting('request.jwt.claim.sub', true) as auth_uid,
  auth.uid() as auth_uid_function;

-- 11. Check recent errors in Supabase logs
-- (This query won't work in SQL Editor, but check Dashboard → Logs → Postgres Logs)
-- Look for errors related to 'handle_new_user' or 'users' table
-- Common errors:
--   - "new row violates row-level security policy"
--   - "permission denied for table users"
--   - "function handle_new_user() does not exist"

