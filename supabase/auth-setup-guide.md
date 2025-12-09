# Supabase Auth Setup Guide

This guide will help you set up Supabase Auth for the Superteam Study platform.

## Prerequisites

1. A Supabase project (Auth Supabase)
2. Access to the Supabase SQL Editor

## Step 1: Enable Supabase Auth

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Providers**
3. Enable **Email** provider
4. Configure email settings:
   - Set up email templates (optional)
   - Configure redirect URLs:
     - `http://localhost:3000/auth/callback` (for development)
     - `https://yourdomain.com/auth/callback` (for production)

## Step 2: Run the Schema SQL

1. Open the Supabase SQL Editor
2. Run `supabase/auth-schema.sql` to create the initial schema
3. If you're migrating from Clerk, run `supabase/auth-schema-migration-supabase-auth.sql`

### For New Projects

Run this in order:
1. `supabase/auth-schema.sql` - Creates the users table and triggers

### For Existing Projects (Migrating from Clerk)

Run this in order:
1. `supabase/auth-schema-migration-supabase-auth.sql` - Migrates from Clerk to Supabase Auth

## Step 3: Verify the Setup

After running the SQL, verify:

1. **Users table exists:**
   ```sql
   SELECT * FROM users LIMIT 1;
   ```

2. **Trigger function exists:**
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
   ```

3. **RLS policies are enabled:**
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'users';
   ```

4. **Policies are created:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'users';
   ```

## Step 4: Test Authentication

1. Sign up a new user through your application
2. Check that a profile is automatically created in the `users` table
3. Verify the user can view and update their own profile

## Database Schema

### Users Table

```sql
users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  username TEXT,
  image_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
```

### Key Features

1. **Automatic Profile Creation**: When a user signs up via Supabase Auth, a profile is automatically created in the `users` table via a trigger.

2. **Row Level Security (RLS)**: Users can only view and update their own profiles.

3. **Foreign Key Constraint**: The `id` column references `auth.users(id)`, ensuring data integrity.

4. **Cascade Delete**: If a user is deleted from `auth.users`, their profile is automatically deleted from `users`.

## Environment Variables

Make sure your `.env.local` has:

```env
NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Troubleshooting

### Server error (500) during signup

If you see "Server error during signup" with a 500 status code, check the following:

1. **Environment Variables:**
   - Verify `.env.local` exists and has correct values
   - Run `node scripts/check-env.js` to validate
   - Ensure variables start with `NEXT_PUBLIC_`
   - Restart your dev server after changing env vars

2. **Supabase Auth Email Provider:**
   - Go to Supabase Dashboard → Authentication → Providers
   - Ensure **Email** provider is enabled
   - Check that "Confirm email" is configured correctly

3. **Database Schema:**
   - Run `supabase/auth-schema.sql` in Supabase SQL Editor
   - Verify the `users` table exists: `SELECT * FROM users LIMIT 1;`
   - Check that triggers are created (see "Profile not created on signup" below)

4. **Redirect URLs:**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add your redirect URL: `http://localhost:3000/auth/callback` (dev) or your production URL
   - Ensure "Site URL" is set correctly

5. **API Keys:**
   - Verify you're using the **anon/public** key (not service_role)
   - Check that the key matches your Supabase project
   - Ensure the URL matches your project URL

6. **Check Supabase Logs:**
   - Go to Supabase Dashboard → Logs → API Logs
   - Look for errors around the time of signup attempt
   - Check for authentication errors or database errors

### Profile not created on signup

1. Check if the trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

2. Check trigger function:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
   ```

3. Check for errors in Supabase logs

### RLS blocking operations

1. Verify policies are created:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'users';
   ```

2. Check if user is authenticated:
   ```sql
   SELECT auth.uid();
   ```

### Foreign key constraint errors

If you see foreign key errors, ensure:
- The `id` in `users` table matches a valid `id` in `auth.users`
- The foreign key constraint is properly set up

## Security Notes

- The `handle_new_user` function uses `SECURITY DEFINER` to bypass RLS when creating profiles
- RLS policies ensure users can only access their own data
- The anon key is used for client-side operations, but RLS protects the data

