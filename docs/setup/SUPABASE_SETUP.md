# Supabase Setup Guide

This guide will help you set up Supabase databases for Superteam Study.

> **Note**: This project uses **two separate Supabase databases**:
> - **lantaidua-universal-auth Supabase**: For Clerk user synchronization (see `AUTH_SETUP.md`)
> - **obelisk-learning Supabase**: For platform data (this guide)

## Prerequisites

1. A Supabase account ([sign up here](https://supabase.com))
2. Node.js 18+ installed
3. Your project dependencies installed (`npm install`)

## Step 1: Create the Learning Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in your project details:
   - **Name**: Superteam Study (or your preferred name)
   - **Database Password**: Choose a strong password (save it securely)
   - **Region**: Choose the closest region to your users
4. Click "Create new project" and wait for it to initialize

> **Important**: This is the **learning database**. You'll need a **separate Supabase project** for authentication (see `AUTH_SETUP.md`).

## Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys" → "anon public")
   - **service_role key** (under "Project API keys" → "service_role" - keep this secret!)

## Step 3: Set Up Environment Variables

1. Create a `.env.local` file in the root of your project (if it doesn't exist)
2. Add the following variables for the **learning database**:

```env
# Learning Supabase (obelisk-learning) - For platform data
NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_URL=your_learning_project_url_here
NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_ANON_KEY=your_learning_anon_key_here
OBELISK_LEARNING_SUPABASE_SERVICE_ROLE_KEY=your_learning_service_role_key_here
```

> **Note**: You'll also need to set up the auth Supabase variables. See `AUTH_SETUP.md` for details.

**Important**: 
- Never commit `.env.local` to version control
- The `NEXT_PUBLIC_` prefix makes these variables available in the browser
- The service role key should NEVER be exposed to the client

## Step 4: Set Up the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Open the file `supabase/schema.sql` from this project
3. Copy the entire contents and paste it into the SQL Editor
4. Click "Run" to execute the schema

This will create:
- `instructors` table
- `courses` table
- `modules` table
- `lessons` table
- `enrollments` table
- `lesson_progress` table
- `course_progress` table
- All necessary indexes and Row Level Security (RLS) policies

## Step 5: Seed Initial Data (Optional)

1. In the SQL Editor, open `supabase/seed.sql`
2. Copy and paste the contents
3. Click "Run" to insert initial instructor data

## Step 6: Configure Authentication

1. In Supabase dashboard, go to **Authentication** → **URL Configuration**
2. Add your site URLs:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: 
     - `http://localhost:3000/auth/callback`
     - `https://your-production-domain.com/auth/callback`

3. (Optional) Configure email templates:
   - Go to **Authentication** → **Email Templates**
   - Customize the confirmation email template if desired

## Step 7: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/auth/sign-up`
3. Try creating a new account
4. Check your email for the confirmation link (or check Supabase dashboard → Authentication → Users)

## Step 8: Migrate from Mock Data (Optional)

If you want to use Supabase instead of mock data:

1. Update your pages to use Supabase queries from `lib/supabase/queries.ts`
2. Replace imports from `lib/mock-data.ts` with Supabase query functions
3. Example:
   ```typescript
   // Before
   import { mockCourses } from "@/lib/mock-data";
   
   // After
   import { getCourses } from "@/lib/supabase/queries";
   const courses = await getCourses();
   ```

## Troubleshooting

### "Invalid API key" error
- Double-check your `.env.local` file
- Ensure there are no extra spaces or quotes around the values
- Restart your development server after changing environment variables

### "Row Level Security policy violation"
- Make sure you've run the schema SQL file
- Check that RLS policies are created correctly in Supabase dashboard → Authentication → Policies

### Email confirmation not working
- Check your Supabase project's email settings
- Ensure redirect URLs are configured correctly
- Check spam folder for confirmation emails

### Database connection issues
- Verify your Supabase project is active (not paused)
- Check that your database password is correct
- Ensure your IP is not blocked (check Supabase dashboard → Settings → Database)

## Next Steps

- Set up email service (SMTP) for production emails
- Configure OAuth providers (Google, GitHub, etc.) if desired
- Set up database backups
- Configure production environment variables in your hosting platform

## Security Notes

- Always use environment variables for sensitive data
- Never commit `.env.local` or `.env` files
- Use the `anon` key for client-side operations
- Use the `service_role` key only in secure server-side contexts
- Regularly rotate your API keys
- Review and test your RLS policies before going to production

