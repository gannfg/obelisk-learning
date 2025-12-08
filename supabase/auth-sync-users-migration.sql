-- Migration: Sync existing users and fix RLS policies
-- This migration:
-- 1. Creates profiles for existing auth.users who don't have one
-- 2. Adds RLS policy to allow reading other users' basic info (username, email, image_url)
--
-- Run this in your Auth Supabase SQL Editor

-- Step 1: Create profiles for existing auth.users who don't have a profile in public.users
-- This handles users who signed up before the trigger was created, or if the trigger failed
INSERT INTO public.users (id, email, first_name, last_name, image_url, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(au.email, ''),
  COALESCE(au.raw_user_meta_data->>'first_name', au.raw_user_meta_data->>'full_name', NULL) as first_name,
  COALESCE(au.raw_user_meta_data->>'last_name', NULL) as last_name,
  COALESCE(au.raw_user_meta_data->>'avatar_url', NULL) as image_url,
  au.created_at,
  NOW() as updated_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL  -- Only users who don't have a profile yet
ON CONFLICT (id) DO NOTHING;

-- Step 2: Add RLS policy to allow authenticated users to read other users' basic info
-- This is needed for displaying usernames and avatars in activity feeds, leaderboards, etc.
DROP POLICY IF EXISTS "Users can view other users' basic info" ON users;

CREATE POLICY "Users can view other users' basic info"
  ON users
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL  -- Must be authenticated
    AND (
      auth.uid() = id  -- Can view own full profile
      OR true  -- Can view basic info (username, email, image_url) of other users
    )
  );

-- Step 3: Verify the migration
DO $$
DECLARE
  auth_users_count INTEGER;
  profile_users_count INTEGER;
  missing_profiles INTEGER;
BEGIN
  -- Count auth users
  SELECT COUNT(*) INTO auth_users_count FROM auth.users;
  
  -- Count profile users
  SELECT COUNT(*) INTO profile_users_count FROM public.users;
  
  -- Calculate missing profiles
  missing_profiles := auth_users_count - profile_users_count;
  
  RAISE NOTICE 'Migration Summary:';
  RAISE NOTICE '  Total auth.users: %', auth_users_count;
  RAISE NOTICE '  Total public.users profiles: %', profile_users_count;
  RAISE NOTICE '  Missing profiles (before sync): %', missing_profiles;
  
  IF missing_profiles = 0 THEN
    RAISE NOTICE '✅ All users have profiles!';
  ELSE
    RAISE NOTICE '⚠️ % users were missing profiles and have been synced.', missing_profiles;
  END IF;
  
  -- Verify RLS policy exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Users can view other users'' basic info'
  ) THEN
    RAISE NOTICE '✅ RLS policy "Users can view other users'' basic info" created successfully';
  ELSE
    RAISE WARNING '❌ RLS policy was not created. Please check for errors.';
  END IF;
END $$;

-- Step 4: Show current RLS policies for verification
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
WHERE tablename = 'users'
ORDER BY policyname;

