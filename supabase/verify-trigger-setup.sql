-- Comprehensive verification script for trigger setup
-- Run this after applying any fix to verify everything is configured correctly

-- 1. Check if users table exists and has correct structure
SELECT 
  'Users Table' as check_item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status,
  (SELECT COUNT(*)::text FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'public') || ' columns' as details
UNION ALL

-- 2. Check if trigger exists
SELECT 
  'Trigger' as check_item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status,
  (SELECT tgname::text FROM pg_trigger WHERE tgname = 'on_auth_user_created' LIMIT 1) as details
UNION ALL

-- 3. Check if trigger function exists
SELECT 
  'Trigger Function' as check_item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status,
  proname::text as details
FROM pg_proc WHERE proname = 'handle_new_user'
UNION ALL

-- 4. Check if function is SECURITY DEFINER (CRITICAL)
SELECT 
  'SECURITY DEFINER' as check_item,
  CASE 
    WHEN prosecdef = true
    THEN '✅ ENABLED'
    ELSE '❌ DISABLED - THIS WILL CAUSE RLS ISSUES!'
  END as status,
  CASE 
    WHEN prosecdef = true THEN 'Function will bypass RLS'
    ELSE 'Function will be subject to RLS policies - FIX THIS!'
  END as details
FROM pg_proc WHERE proname = 'handle_new_user'
UNION ALL

-- 5. Check function owner
SELECT 
  'Function Owner' as check_item,
  CASE 
    WHEN pg_get_userbyid(proowner) IN ('postgres', 'supabase_admin', 'supabase_auth_admin')
    THEN '✅ CORRECT'
    ELSE '⚠️ CHECK - Should be postgres or superuser'
  END as status,
  pg_get_userbyid(proowner)::text as details
FROM pg_proc WHERE proname = 'handle_new_user'
UNION ALL

-- 6. Check RLS status
SELECT 
  'RLS Enabled' as check_item,
  CASE 
    WHEN rowsecurity = true
    THEN '✅ ENABLED'
    ELSE '⚠️ DISABLED'
  END as status,
  CASE 
    WHEN rowsecurity = true THEN 'RLS is active (trigger should bypass via SECURITY DEFINER)'
    ELSE 'RLS is disabled'
  END as details
FROM pg_tables WHERE tablename = 'users' AND schemaname = 'public'
UNION ALL

-- 7. Check INSERT policy exists
SELECT 
  'INSERT Policy' as check_item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND cmd = 'INSERT')
    THEN '✅ EXISTS'
    ELSE '⚠️ MISSING (may not be needed if SECURITY DEFINER works)'
  END as status,
  COALESCE((SELECT policyname FROM pg_policies WHERE tablename = 'users' AND cmd = 'INSERT' LIMIT 1), 'None') as details
UNION ALL

-- 8. Check permissions
SELECT 
  'Table Permissions' as check_item,
  CASE 
    WHEN has_table_privilege('postgres', 'public.users', 'INSERT')
    THEN '✅ postgres can INSERT'
    ELSE '❌ postgres cannot INSERT'
  END as status,
  'Checking postgres role permissions' as details;

-- 9. Detailed function information
SELECT 
  '=== FUNCTION DETAILS ===' as info,
  '' as status,
  '' as details
UNION ALL
SELECT 
  'Function Name' as info,
  proname as status,
  '' as details
FROM pg_proc WHERE proname = 'handle_new_user'
UNION ALL
SELECT 
  'Security Type' as info,
  CASE WHEN prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END as status,
  '' as details
FROM pg_proc WHERE proname = 'handle_new_user'
UNION ALL
SELECT 
  'Function Owner' as info,
  pg_get_userbyid(proowner) as status,
  '' as details
FROM pg_proc WHERE proname = 'handle_new_user'
UNION ALL
SELECT 
  'Search Path' as info,
  COALESCE(array_to_string(proconfig, ', '), 'default') as status,
  '' as details
FROM pg_proc WHERE proname = 'handle_new_user';

-- 10. Test note about auth.uid()
SELECT 
  '=== IMPORTANT NOTE ===' as info,
  'auth.uid() is NULL' as status,
  'This is NORMAL when running in SQL Editor. During actual signup, auth.uid() should be available. The SECURITY DEFINER function bypasses RLS anyway.' as details;

