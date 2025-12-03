# Supabase Learning Platform - Quick Setup Checklist

Use this checklist to ensure all setup steps are completed in order.

## Prerequisites
- [ ] Learning Supabase project created
- [ ] Environment variables set in `.env.local`:
  - [ ] `NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_ANON_KEY`

## Step 1: Base Schema ⚠️ REQUIRED FIRST
- [ ] Run `supabase/schema.sql` in Learning Supabase SQL Editor
  - Creates: instructors, courses, modules, lessons, enrollments, progress tables
  - Sets up: RLS, indexes, triggers

## Step 2: Storage Setup
- [ ] Run `supabase/storage-setup.sql` in Learning Supabase SQL Editor
  - Creates: course-images, avatars, user-uploads buckets
  - Sets up: Storage RLS policies

## Step 3: Quizzes Table Setup
- [ ] Run `supabase/quizzes-schema.sql`
  - Creates quizzes table for storing quiz questions

## Step 3b: Badges Table Setup
- [ ] Run `supabase/badges-schema.sql`
  - Creates badges table for course completion rewards

## Step 4: Admin RLS Policies
- [ ] Run `supabase/admin-courses-rls.sql`
  - Allows authenticated users to INSERT/UPDATE/DELETE courses

- [ ] Run `supabase/admin-modules-rls.sql`
  - Allows authenticated users to INSERT/UPDATE/DELETE modules

- [ ] Run `supabase/admin-lessons-rls.sql`
  - Allows authenticated users to INSERT/UPDATE/DELETE lessons

## Step 5: Verification
- [ ] Run `supabase/verify-setup.sql` to check all setup
- [ ] All checks should show ✅

## Step 6: Optional Setup
- [ ] Create default "DeMentor" instructor (see `SUPABASE_LEARNING_SETUP.md`)
- [ ] Add instructor admin policies if needed

## Testing
- [ ] Navigate to `/admin/courses`
- [ ] Create a test course
- [ ] Create a test module
- [ ] Create a test lesson (markdown, video, or quiz)
- [ ] Verify course appears on `/academy` page
- [ ] Verify course detail page loads
- [ ] Verify lesson page loads with content

## Troubleshooting
If any step fails:
1. Check error message in Supabase SQL Editor
2. Verify previous steps were completed
3. See `SUPABASE_LEARNING_SETUP.md` for detailed troubleshooting

## Files Reference
- **Setup Guide:** `SUPABASE_LEARNING_SETUP.md` (comprehensive guide)
- **Verification:** `supabase/verify-setup.sql` (run after setup)
- **Admin Guide:** `ADMIN_COURSES_SETUP.md` (admin panel features)

