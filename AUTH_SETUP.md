# Authentication Setup Guide

This guide will help you set up `lantaidua-universal-auth` with Clerk for Obelisk Learning.

## Prerequisites

1. A Clerk account ([sign up here](https://clerk.com))
2. Node.js 18+ installed
3. Your project dependencies installed (`npm install`)

## Step 1: Create a Clerk Application

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Click "Create Application"
3. Fill in your application details:
   - **Name**: Obelisk Learning (or your preferred name)
   - **Authentication**: Choose your preferred authentication methods
4. Click "Create Application"

## Step 2: Get Your Clerk API Keys

1. In your Clerk dashboard, go to **API Keys**
2. Copy both keys:
   - **Publishable Key** (starts with `pk_`) - for client-side
   - **Secret Key** (starts with `sk_`) - for server-side (keep this secret!)

## Step 3: Set Up Environment Variables

1. Create a `.env.local` file in the root of your project (if it doesn't exist)
2. Add the following variables:

```env
# Clerk Authentication (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here

# Optional: Custom domain for Clerk
NEXT_PUBLIC_CLERK_DOMAIN=your-custom-domain.com

# Optional: Satellite application flag
NEXT_PUBLIC_CLERK_IS_SATELLITE=false

# Auth Supabase (lantaidua-universal-auth) - For Clerk user sync
NEXT_PUBLIC_LANTAIDUA_UNIVERSAL_AUTH_SUPABASE_URL=your_auth_supabase_url
NEXT_PUBLIC_LANTAIDUA_UNIVERSAL_AUTH_SUPABASE_ANON_KEY=your_auth_supabase_anon_key

# Learning Supabase (obelisk-learning) - For platform data
NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_URL=your_learning_supabase_url
NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_ANON_KEY=your_learning_supabase_anon_key

# Environment Detection (optional)
# The auth client will detect environment using:
# - NEXT_PUBLIC_APP_ENV (if set): 'dev' | 'staging' | 'prod'
# - NODE_ENV (fallback): 'development' | 'production'
# - Defaults to 'dev' if neither is set
NEXT_PUBLIC_APP_ENV=dev
```

**Important**: 
- Never commit `.env.local` to version control
- The `NEXT_PUBLIC_` prefix makes variables available in the browser
- `CLERK_SECRET_KEY` is server-only (no `NEXT_PUBLIC_` prefix) - keep it secret!
- **Two Separate Supabase Databases**: 
  - `lantaidua-universal-auth` Supabase: Used for Clerk user synchronization
  - `obelisk-learning` Supabase: Used for platform data (courses, lessons, progress, etc.)
- Environment detection uses `NEXT_PUBLIC_APP_ENV` or `NODE_ENV` from `.env.local`

## Step 4: Configure Clerk URLs

The auth client is configured with the following URLs:
- **Sign In URL**: `/auth/sign-in`
- **Sign Up URL**: `/auth/sign-up`
- **After Sign In**: `/dashboard`
- **After Sign Up**: `/dashboard`

Make sure these routes exist in your application. You can customize these in `lib/auth/client.ts`.

## Step 5: Set Up Auth Supabase Database Schema

1. In your **lantaidua-universal-auth Supabase** project dashboard, go to **SQL Editor**
2. Open the file `supabase/auth-schema.sql` from this project
3. Copy the entire contents and paste it into the SQL Editor
4. Click "Run" to execute the schema

This will create:
- `users` table - For storing Clerk-synced user accounts
- Indexes and triggers for automatic `updated_at` updates
- Row Level Security (RLS) policies

> **Note**: You may need to adjust RLS policies depending on how `lantaidua-universal-auth` handles authentication. If sync fails, you might need to temporarily disable RLS or adjust the policies.

## Step 6: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Sign in with Google OAuth (or create an account)
3. Check your browser console for sync status messages
4. Check your **lantaidua-universal-auth Supabase** dashboard → Table Editor → `users` to see the synced user
5. If sync fails, check the console for error messages

## How It Works

### Auth Client Initialization

The auth client is automatically initialized when the app loads via the `AuthProvider` component in `app/layout.tsx`.

### Using Auth in Components

**Client-side components:**
```typescript
import { useAuth } from '@/lib/auth/client-side';

function MyComponent() {
  const { user, loading, signOut } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not signed in</div>;
  
  return <div>Welcome, {user.email}!</div>;
}
```

**Server-side:**
```typescript
import { getCurrentUser } from '@/lib/auth/server';

export default async function Page() {
  const user = await getCurrentUser();
  // ...
}
```

### Environment Detection

The auth client automatically detects the environment:
- `dev` - Development
- `staging` - Staging
- `prod` - Production

You can check the environment:
```typescript
import { getAuthEnvironment } from '@/lib/auth/client';

const env = getAuthEnvironment(); // 'dev' | 'staging' | 'prod'
```

## Troubleshooting

### "Auth client is not initialized"
- Make sure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set in your `.env.local`
- Restart your development server after adding environment variables
- Check that the `AuthProvider` is wrapping your app in `app/layout.tsx`

### "Failed to initialize auth client"
- Verify your Clerk publishable key is correct
- Check the browser console for detailed error messages
- Ensure Clerk is properly configured in your Clerk dashboard

### Sign in/Sign up not working
- Check that the method names match the actual `lantaidua-universal-auth` API
- Review the auth client methods in `lib/auth/client.ts`
- Check browser console for errors

### Sync Not Working on Another PC

If user sync works on one PC but not another, check the following:

1. **Environment Variables**: Make sure `.env.local` exists and contains all required variables:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_LANTAIDUA_UNIVERSAL_AUTH_SUPABASE_URL=https://...
   NEXT_PUBLIC_LANTAIDUA_UNIVERSAL_AUTH_SUPABASE_ANON_KEY=eyJ...
   ```
   - Copy `.env.local` from the working PC to the other PC
   - Or manually add the environment variables
   - **Important**: Restart the dev server after adding/updating `.env.local`

2. **Supabase Schema**: Ensure the `users` table exists in your auth Supabase project:
   - Go to your lantaidua-universal-auth Supabase project
   - Run the SQL from `supabase/auth-schema.sql` in the SQL Editor
   - Verify the table exists in the Table Editor

3. **RLS Policies**: Check that Row Level Security policies allow inserts/updates:
   - The `users` table should have a policy that allows `ALL` operations
   - This is needed because Clerk handles auth, not Supabase Auth

4. **Browser Console**: Check for specific error messages:
   - `❌ Supabase credentials not configured` → Missing env vars
   - `❌ No email found in Clerk user data` → Clerk user data issue
   - `❌ Failed to sync user manually` → Check Supabase connection and schema
   - `✅ User synced to Supabase manually` → Success!

5. **Network Issues**: If on a different network, check:
   - Supabase project is accessible
   - No firewall blocking Supabase API calls
   - CORS settings in Supabase (should allow all origins for anon key)

6. **Google OAuth Sync**: The manual sync function handles Google OAuth users. If it's not working:
   - Check that the user object has email data (`user.emailAddresses` or `user.primaryEmailAddress`)
   - Verify the Supabase `users` table schema matches the sync data structure
   - Check browser console for detailed error messages

## Customization

### Changing Redirect URLs

Edit `lib/auth/client.ts`:
```typescript
await authClient.createAuthClient(CLERK_PUBLISHABLE_KEY, {
  signInUrl: '/your-sign-in-url',
  signUpUrl: '/your-sign-up-url',
  afterSignInUrl: '/your-dashboard',
  afterSignUpUrl: '/your-dashboard',
});
```

### Adding Additional Auth Methods

The `lantaidua-universal-auth` client supports various authentication methods. Refer to the package documentation for available methods and update the sign-in/sign-up forms accordingly.

## Next Steps

- Set up protected routes
- Create a user dashboard
- Integrate user data with your database
- Add OAuth providers (Google, GitHub, etc.) in Clerk dashboard

