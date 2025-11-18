# Database Architecture

This document explains the two-database architecture used in Obelisk Learning.

## Overview

Obelisk Learning uses **two separate Supabase databases** to maintain clear separation between authentication data and platform data.

## Database 1: lantaidua-universal-auth Supabase

**Purpose**: Stores Clerk-synced user accounts

**Environment Variables**:
- `NEXT_PUBLIC_LANTAIDUA_UNIVERSAL_AUTH_SUPABASE_URL`
- `NEXT_PUBLIC_LANTAIDUA_UNIVERSAL_AUTH_SUPABASE_ANON_KEY`

**Used By**:
- `lib/auth/client.ts` - For Clerk user synchronization
- `components/user-sync.tsx` - Automatic user sync component
- `components/auth/sign-in-form.tsx` - After sign-in sync
- `components/auth/sign-up-form.tsx` - After sign-up sync

**Schema**:
- `users` table - Stores Clerk user data synced via `lantaidua-universal-auth`

**When Data is Synced**:
- Automatically after successful Clerk sign-in
- Automatically after successful Clerk sign-up
- On dashboard page load (if not already synced)

## Database 2: obelisk-learning Supabase

**Purpose**: Stores all Obelisk Learning platform data

**Environment Variables**:
- `NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_URL`
- `NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_ANON_KEY`

**Used By**:
- `lib/supabase/client.ts` - Client-side Supabase client
- `lib/supabase/server.ts` - Server-side Supabase client
- All course, lesson, progress, and enrollment queries

**Schema** (from `supabase/schema.sql`):
- `instructors` - Instructor profiles
- `courses` - Course information
- `modules` - Course modules
- `lessons` - Individual lessons
- `enrollments` - User course enrollments
- `lesson_progress` - User lesson completion tracking
- `course_progress` - User course completion tracking

## Why Two Databases?

### Benefits:

1. **Separation of Concerns**
   - Auth data is isolated from business logic data
   - Easier to manage and maintain

2. **Security**
   - Different access controls for each database
   - Auth database can have stricter security policies

3. **Scalability**
   - Independent scaling of auth and platform databases
   - Can optimize each database for its specific use case

4. **Flexibility**
   - Can use different Supabase projects/regions
   - Easier to migrate or change one without affecting the other

5. **Compliance**
   - Easier to meet data residency requirements
   - Clear data boundaries for compliance audits

## Data Flow

```
┌─────────────┐
│   Clerk     │
│  (Auth)     │
└──────┬──────┘
       │
       │ User signs in/up
       ▼
┌─────────────────────────────────────┐
│  lantaidua-universal-auth Supabase  │
│  (Auth Database)                     │
│  - users table                       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  obelisk-learning Supabase          │
│  (Learning Database)                │
│  - courses, lessons, progress, etc.  │
└─────────────────────────────────────┘
```

## Setup Instructions

### 1. Create Two Supabase Projects

1. **Auth Supabase Project** (for lantaidua-universal-auth):
   - Create a new Supabase project
   - Name it something like "obelisk-auth" or "lantaidua-auth"
   - Copy the URL and anon key

2. **Learning Supabase Project** (for obelisk-learning):
   - Create a new Supabase project
   - Name it "obelisk-learning" or similar
   - Copy the URL and anon key
   - Run the schema from `supabase/schema.sql`

### 2. Set Environment Variables

Add to your `.env.local`:

```env
# Auth Supabase (lantaidua-universal-auth)
NEXT_PUBLIC_LANTAIDUA_UNIVERSAL_AUTH_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_LANTAIDUA_UNIVERSAL_AUTH_SUPABASE_ANON_KEY=your_auth_anon_key

# Learning Supabase (obelisk-learning)
NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_URL=https://yyyyy.supabase.co
NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_ANON_KEY=your_learning_anon_key
```

### 3. Verify Setup

Run the environment check script:

```bash
node scripts/check-env.js
```

This will verify that all required environment variables are set.

## Migration Notes

If you're migrating from a single database setup:

1. **Backup existing data** from your current Supabase project
2. **Create new Supabase projects** (one for auth, one for learning)
3. **Migrate auth data** to the auth Supabase project
4. **Migrate learning data** to the learning Supabase project
5. **Update environment variables** in `.env.local`
6. **Test thoroughly** before deploying

## Troubleshooting

### "Auth Supabase not initialized"
- Check that `NEXT_PUBLIC_LANTAIDUA_UNIVERSAL_AUTH_SUPABASE_URL` and `NEXT_PUBLIC_LANTAIDUA_UNIVERSAL_AUTH_SUPABASE_ANON_KEY` are set
- Verify the credentials are correct
- Check browser console for detailed errors

### "Learning Supabase connection failed"
- Check that `NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_URL` and `NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_ANON_KEY` are set
- Verify the schema has been applied to the learning database
- Check network connectivity

### User sync not working
- Ensure the auth Supabase has a `users` table
- Check that Clerk authentication is working
- Verify `lantaidua-universal-auth` is properly initialized

