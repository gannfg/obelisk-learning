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
- Environment detection uses `NEXT_PUBLIC_APP_ENV` or `NODE_ENV` from `.env.local`

## Step 4: Configure Clerk URLs

The auth client is configured with the following URLs:
- **Sign In URL**: `/auth/sign-in`
- **Sign Up URL**: `/auth/sign-up`
- **After Sign In**: `/dashboard`
- **After Sign Up**: `/dashboard`

Make sure these routes exist in your application. You can customize these in `lib/auth/client.ts`.

## Step 5: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/auth/sign-up`
3. Try creating a new account
4. Check your Clerk dashboard → Users to see the new user

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

