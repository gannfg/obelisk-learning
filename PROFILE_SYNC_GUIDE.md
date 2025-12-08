# Profile Sync and RLS Fix Guide

This guide helps you fix the issue where some users show as "User" instead of their actual username in activity feeds.

## Problem

1. **Missing Profiles**: Some users who signed up before the trigger was created (or if the trigger failed) don't have profiles in the `public.users` table.
2. **RLS Restriction**: The RLS policy only allows users to view their own profile, not other users' basic info needed for activity feeds.

## Solution

### Step 1: Run the Migration

Run the migration script in your **Auth Supabase** SQL Editor:

```bash
# The file is located at:
supabase/auth-sync-users-migration.sql
```

This migration will:
- ✅ Create profiles for existing `auth.users` who don't have one
- ✅ Add RLS policy to allow reading other users' basic info (username, email, image_url)
- ✅ Verify the migration was successful

### Step 2: Verify the Trigger Exists

Check if the trigger is set up correctly:

```sql
-- Check if trigger exists
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as enabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- Check if trigger function exists
SELECT 
  proname as function_name,
  prosrc as function_body
FROM pg_proc
WHERE proname = 'handle_new_user';
```

### Step 3: Verify RLS Policies

Check that the new policy was created:

```sql
SELECT 
  policyname,
  cmd as command,
  qual as using_expression
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
```

You should see:
- ✅ "Users can view own profile"
- ✅ "Users can update own profile"
- ✅ "Users can insert own profile"
- ✅ "Users can view other users' basic info" (NEW)

### Step 4: Test the Fix

After running the migration:

1. **Check for missing profiles**:
   ```sql
   SELECT 
     COUNT(*) as auth_users_count
   FROM auth.users;
   
   SELECT 
     COUNT(*) as profile_users_count
   FROM public.users;
   
   -- These should match!
   ```

2. **Test reading other users' info** (as an authenticated user):
   ```sql
   -- This should return username, email, image_url for all users
   SELECT id, username, email, image_url
   FROM public.users
   LIMIT 10;
   ```

3. **Check the landing page**: The Recent Activity and Recent Achievements sections should now show actual usernames instead of "User".

## What Changed

### Before
- ❌ Users could only view their own profile
- ❌ Activity feeds showed "User" for users without profiles
- ❌ Some users missing profiles entirely

### After
- ✅ Users can view other users' basic info (username, email, image_url)
- ✅ All existing auth.users have profiles
- ✅ Activity feeds show actual usernames
- ✅ Future signups automatically create profiles via trigger

## Troubleshooting

### If profiles still aren't showing:

1. **Check if the trigger is working**:
   ```sql
   -- Manually test the trigger function
   SELECT public.handle_new_user();
   ```

2. **Check RLS is enabled**:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'users' AND schemaname = 'public';
   -- rowsecurity should be true
   ```

3. **Check for errors in Supabase logs**:
   - Go to Supabase Dashboard → Logs → Postgres Logs
   - Look for errors related to `handle_new_user` or `users` table

4. **Manually sync a specific user**:
   ```sql
   -- Replace 'user-id-here' with the actual user ID
   INSERT INTO public.users (id, email, created_at, updated_at)
   SELECT id, email, created_at, NOW()
   FROM auth.users
   WHERE id = 'user-id-here'
   ON CONFLICT (id) DO UPDATE SET updated_at = NOW();
   ```

## Future Prevention

The trigger `on_auth_user_created` will automatically create profiles for all new signups. However, if you notice users still showing as "User":

1. Check Supabase logs for trigger errors
2. Verify the trigger is enabled: `tgenabled = 'O'` (enabled)
3. Re-run the sync migration if needed

## Related Files

- `supabase/auth-schema.sql` - Main schema with trigger and RLS policies
- `supabase/auth-sync-users-migration.sql` - Migration to sync existing users
- `lib/landing-stats.ts` - Code that fetches user data for activity feeds

