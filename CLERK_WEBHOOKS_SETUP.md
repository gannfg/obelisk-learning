# Clerk Webhooks Setup Guide

This guide explains how to set up Clerk webhooks to automatically sync users to Supabase.

## Overview

Clerk webhooks provide a **server-side, automatic** way to sync Clerk users to your Supabase database. This is more reliable than client-side syncing because:

- ✅ **Automatic**: Users are synced immediately when they sign up or update their profile
- ✅ **Server-Side**: Runs on your server, not dependent on client-side code
- ✅ **Reliable**: Works even if the user closes their browser before client-side sync completes
- ✅ **Real-Time**: Instant synchronization when events occur

## Architecture

```
Clerk → Webhook → Your API → Supabase
```

When a user event happens in Clerk (sign up, profile update, etc.), Clerk sends a webhook to your API endpoint, which then syncs the user to Supabase.

## Setup Steps

### 1. Install Dependencies

The `svix` package is already installed (used for webhook verification):

```bash
npm install svix
```

### 2. Create Webhook Endpoint in Clerk

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Webhooks** in the sidebar
3. Click **Add Endpoint**
4. Enter your webhook URL:
   - **Production**: `https://your-domain.com/api/webhooks/clerk`
   - **Development**: Use ngrok (see below)
5. Select events to listen to:
   - ✅ `user.created` - When a new user signs up
   - ✅ `user.updated` - When a user updates their profile
   - ✅ `user.deleted` - When a user is deleted (optional)
6. Click **Create**
7. **Copy the Signing Secret** (starts with `whsec_`)

### 3. Add Webhook Secret to Environment Variables

Add to your `.env.local`:

```env
CLERK_WEBHOOK_SECRET=whsec_...
```

**For Vercel:**
1. Go to Vercel project settings
2. Navigate to **Environment Variables**
3. Add `CLERK_WEBHOOK_SECRET` with your webhook secret
4. Redeploy your application

### 4. Test Locally with ngrok (Optional)

For local development, use ngrok to expose your local server:

1. **Install ngrok:**
   ```bash
   npm install -g ngrok
   # Or download from https://ngrok.com
   ```

2. **Start your dev server:**
   ```bash
   npm run dev
   ```

3. **In another terminal, start ngrok:**
   ```bash
   ngrok http 3000
   ```

4. **Copy the ngrok URL** (e.g., `https://abc123.ngrok.io`)

5. **Add webhook endpoint in Clerk:**
   - URL: `https://abc123.ngrok.io/api/webhooks/clerk`
   - Select events: `user.created`, `user.updated`

6. **Test it:**
   - Create a new user in your app
   - Check your server logs for webhook events
   - Verify the user appears in Supabase

## How It Works

### Webhook Flow

1. **User signs up/updates profile** in Clerk
2. **Clerk sends webhook** to `/api/webhooks/clerk`
3. **Webhook is verified** using the signing secret (security)
4. **User data is synced** to Supabase `users` table
5. **Response sent** back to Clerk

### Webhook Endpoint

The webhook endpoint is located at:
```
app/api/webhooks/clerk/route.ts
```

It handles:
- ✅ Webhook signature verification (security)
- ✅ User creation/update events
- ✅ User deletion events (optional)
- ✅ Automatic Supabase sync

### Client-Side Sync (Fallback)

The client-side sync (in `components/user-sync.tsx`) still works as a **fallback**:
- If webhooks fail or are not set up
- For immediate sync on page load
- As a backup mechanism

Both methods can work together - webhooks for automatic sync, client-side for immediate feedback.

## Verification

### Check Webhook Logs

1. **Clerk Dashboard** → **Webhooks** → Click your endpoint
2. View **Recent Deliveries** to see webhook events
3. Check for successful deliveries (200 status)

### Check Supabase

1. Go to your **lantaidua-universal-auth Supabase** project
2. Navigate to **Table Editor** → `users`
3. Verify users are being created/updated

### Check Server Logs

When a webhook is received, you'll see logs like:
```
📥 Received Clerk webhook: user.created
✅ User synced to Supabase via webhook
```

## Troubleshooting

### Webhook Not Receiving Events

1. **Check webhook URL** is correct in Clerk dashboard
2. **Verify endpoint is accessible** (not blocked by firewall)
3. **Check ngrok is running** (for local development)
4. **Verify events are selected** in Clerk webhook settings

### Webhook Verification Failing

1. **Check `CLERK_WEBHOOK_SECRET`** is set correctly
2. **Verify secret matches** the one in Clerk dashboard
3. **Restart your server** after adding the secret

### Users Not Syncing to Supabase

1. **Check Supabase credentials** are set:
   - `NEXT_PUBLIC_LANTAIDUA_UNIVERSAL_AUTH_SUPABASE_URL`
   - `NEXT_PUBLIC_LANTAIDUA_UNIVERSAL_AUTH_SUPABASE_ANON_KEY`
2. **Verify `users` table exists** with correct schema
3. **Check RLS policies** allow inserts/updates
4. **Check server logs** for error messages

### Testing Webhooks Locally

If webhooks aren't working locally:
1. Make sure ngrok is running and URL is correct
2. Update webhook URL in Clerk dashboard
3. Test by creating a new user
4. Check ngrok web interface for incoming requests

## Production Deployment

### Vercel

1. **Add environment variable** in Vercel:
   - `CLERK_WEBHOOK_SECRET=whsec_...`
2. **Update webhook URL** in Clerk dashboard:
   - `https://your-domain.vercel.app/api/webhooks/clerk`
3. **Redeploy** your application

### Other Platforms

1. **Set `CLERK_WEBHOOK_SECRET`** environment variable
2. **Update webhook URL** in Clerk dashboard to your production URL
3. **Ensure your API route is accessible** from the internet

## Security

- ✅ **Webhook signatures are verified** using `svix` library
- ✅ **Only verified webhooks** are processed
- ✅ **Webhook secret is never exposed** to the client
- ✅ **HTTPS required** for production webhooks

## Next Steps

- ✅ Webhooks are set up and working
- ✅ Users are automatically synced to Supabase
- ✅ Client-side sync works as a fallback

You can now:
- Remove client-side sync if you prefer (not recommended - keep as fallback)
- Add custom logic to webhook handler (e.g., send welcome emails)
- Monitor webhook delivery in Clerk dashboard

