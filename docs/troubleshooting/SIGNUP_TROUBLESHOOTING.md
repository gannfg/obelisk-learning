# Signup Error Troubleshooting Guide

## ✅ Step 1: Verify Environment Variables

Your `.env.local` file exists and has the required variables. However, make sure:

1. **Restart your dev server** after any changes to `.env.local`:
   ```bash
   # Stop the server (Ctrl+C) and restart
   npm run dev
   ```

2. **Verify the variables are loaded** by checking the browser console for any Supabase client errors.

## ✅ Step 2: Enable Supabase Auth Email Provider

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `vuwolrhxjobaknwkdmcp`
3. Navigate to **Authentication** → **Providers**
4. Find **Email** provider and click **Enable**
5. Configure settings:
   - **Enable email confirmations**: Toggle based on your preference
   - **Secure email change**: Recommended to enable

## ✅ Step 3: Set Up Database Schema (CRITICAL - Most Common Issue)

The 500 error with `x_sb_error_code: "unexpected_failure"` usually means the database schema is missing or the trigger function is failing.

### Option A: Quick Fix (Recommended)
1. In Supabase Dashboard, go to **SQL Editor**
2. Create a new query
3. Copy and paste the contents of `supabase/fix-signup-error.sql`
4. Click **Run** to execute the SQL
5. This will create/repair all necessary components with better error handling

### Option B: Diagnostic First
1. Run `supabase/diagnose-signup-error.sql` to identify what's missing
2. Then run `supabase/fix-signup-error.sql` to fix the issues

### Option C: Fresh Setup
1. Copy and paste the contents of `supabase/auth-schema.sql`
2. Click **Run** to execute the SQL

### Verify the Setup
After running the SQL, verify everything is set up:
```sql
-- Check if users table exists
SELECT * FROM users LIMIT 1;

-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check if function exists
SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
```

## ✅ Step 4: Configure Redirect URLs

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Add these URLs to **Redirect URLs**:
   - `http://localhost:3000/auth/callback` (for development)
   - `https://yourdomain.com/auth/callback` (for production, if applicable)
3. Set **Site URL** to: `http://localhost:3000` (for development)

## ✅ Step 5: Check Supabase Logs

If signup still fails:

1. Go to **Logs** → **API Logs** in Supabase Dashboard
2. Look for entries with:
   - Status: `500`
   - Error code: `unexpected_failure` (this indicates a database issue)
3. Go to **Logs** → **Postgres Logs** to see detailed database errors
4. Look for errors related to:
   - `handle_new_user` function
   - `users` table
   - Foreign key constraints
   - RLS (Row Level Security) policy errors

### Common Database Errors:

**Error: "relation 'public.users' does not exist"**
- Solution: Run `supabase/fix-signup-error.sql`

**Error: "function handle_new_user() does not exist"**
- Solution: The trigger function is missing, run the fix script

**Error: "permission denied for table users"**
- Solution: Check RLS policies and grants in the fix script

**Error: "violates foreign key constraint"**
- Solution: The foreign key to `auth.users` might be misconfigured

## Common Issues

### Issue: "Invalid API key"
- **Solution**: Make sure you're using the **anon/public** key (not service_role)
- Verify the key in `.env.local` matches the one in Supabase Dashboard → Settings → API

### Issue: "Email provider not enabled"
- **Solution**: Enable Email provider in Authentication → Providers

### Issue: "Table 'users' does not exist" or "unexpected_failure" error
- **Solution**: Run `supabase/fix-signup-error.sql` in SQL Editor
- This is the most common cause of 500 errors during signup
- The fix script includes better error handling and will create all missing components

### Issue: RLS Policy Blocking Trigger (Advanced)
If you see RLS policies in place but signup still fails, the trigger function might not be bypassing RLS correctly:
- **Symptoms**: Error mentions "row-level security policy" or "permission denied"
- **Solution 1**: Run `supabase/fix-signup-error.sql` (ensures SECURITY DEFINER is set)
- **Solution 2**: Run `supabase/fix-rls-trigger-issue.sql` (explicit permission fixes)
- **Check**: Run diagnostic query #8-10 in `supabase/diagnose-signup-error.sql` to verify function setup

**Why this happens**: The `handle_new_user()` trigger function must use `SECURITY DEFINER` to bypass RLS policies. If it's not configured correctly, the INSERT policy's `WITH CHECK (auth.uid() = id)` will block the trigger from creating the profile.

### Issue: "Redirect URL not allowed"
- **Solution**: Add `http://localhost:3000/auth/callback` to Redirect URLs in Authentication settings

## Quick Test

After completing the above steps:

1. Restart your dev server: `npm run dev`
2. Navigate to `http://localhost:3000/auth/sign-up`
3. Try creating an account
4. Check the browser console (F12) for any errors
5. Check Supabase Dashboard → Authentication → Users to see if the user was created

## Still Having Issues?

1. Check the browser console for detailed error messages
2. Check Supabase Dashboard → Logs → API Logs
3. Verify all steps above are completed
4. Try signing up with a different email address
5. Check if email confirmation is required (you might need to verify the email first)

