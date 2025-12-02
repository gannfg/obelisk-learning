# Quick Fix: 500 Error During Signup

## The Problem

You're seeing this error in Supabase logs:
- **Status**: `500`
- **Error Code**: `x_sb_error_code: "unexpected_failure"`
- **Endpoint**: `POST /auth/v1/signup`

This means Supabase Auth is working, but the database trigger that creates user profiles is failing.

## Quick Fix (2 minutes)

1. **Open Supabase Dashboard** → [SQL Editor](https://supabase.com/dashboard/project/vuwolrhxjobaknwkdmcp/sql/new)

2. **Copy and paste** the entire contents of `supabase/fix-signup-error.sql`

3. **Click "Run"** to execute

4. **Try signing up again** - it should work now!

## What the Fix Does

The fix script:
- ✅ Creates the `users` table if it doesn't exist
- ✅ Creates the trigger function with better error handling
- ✅ Sets up the trigger to automatically create profiles
- ✅ Configures RLS (Row Level Security) policies
- ✅ Grants necessary permissions
- ✅ Verifies everything is set up correctly

## Why This Happens

The 500 error occurs because:
1. The database schema wasn't set up when you first created the Supabase project
2. The trigger function that creates user profiles is missing or failing
3. The `users` table doesn't exist or has permission issues

## Verify It's Fixed

After running the fix, you should see:
```
✅ Users table exists
✅ Trigger exists
✅ Trigger function exists
✅ Setup complete! Try signing up again.
```

## Still Having Issues?

### If you see RLS (Row Level Security) errors:

The trigger function should bypass RLS using `SECURITY DEFINER`, but sometimes it needs explicit configuration:

1. **Run the alternative fix**: Execute `supabase/fix-rls-trigger-issue.sql`
   - This explicitly sets function ownership and permissions
   - Verifies SECURITY DEFINER is working correctly

2. **Check function configuration**: Run queries #8-10 in `supabase/diagnose-signup-error.sql`
   - Verify `is_security_definer` is `true`
   - Check function owner is `postgres` or a superuser

### Other troubleshooting:

1. **Check Postgres Logs**: Dashboard → Logs → Postgres Logs
   - Look for specific error messages like:
     - "new row violates row-level security policy"
     - "permission denied for table users"
     - "function handle_new_user() does not exist"

2. **Run Diagnostics**: Execute `supabase/diagnose-signup-error.sql`
   - This will show you exactly what's missing

3. **Check Email Provider**: Make sure Email auth is enabled
   - Dashboard → Authentication → Providers → Email → Enable

## Next Steps After Fix

Once signup works:
1. ✅ Test creating an account
2. ✅ Check that the user appears in Dashboard → Authentication → Users
3. ✅ Verify the profile was created in the `users` table

