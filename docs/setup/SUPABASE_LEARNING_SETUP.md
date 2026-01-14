# Supabase Learning Platform Setup Guide

Complete setup guide for integrating courses, modules, and lessons with Supabase.

## Overview

This guide sets up the **Learning Supabase** project (separate from the Auth Supabase) to store:
- Courses
- Modules
- Lessons
- Instructors
- Enrollments
- Progress tracking

## Prerequisites

1. A Supabase project for learning data (separate from your auth Supabase)
2. Environment variables configured in your `.env.local`:
   ```env
   NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_URL=your_learning_supabase_url
   NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_ANON_KEY=your_learning_supabase_anon_key
   ```

## Setup Steps

**IMPORTANT: Run these SQL scripts in order in your Learning Supabase SQL Editor!**

### Step 1: Base Schema (Required First!)

Run `supabase/schema.sql` to create all base tables:

```sql
-- Creates tables:
-- - instructors
-- - courses
-- - modules
-- - lessons
-- - enrollments
-- - lesson_progress
-- - course_progress
-- 
-- Also sets up:
-- - RLS policies for public read access
-- - RLS policies for user-specific data (enrollments, progress)
-- - Indexes for performance
-- - Triggers for updated_at timestamps
```

**This must be run first!** All other scripts depend on these tables existing.

### Step 2: Storage Bucket Setup

Run `supabase/storage-setup.sql` to create storage buckets for course images:

```sql
-- Creates:
-- - course-images bucket (public, for course thumbnails)
-- - avatars bucket (public, for user avatars)
-- - user-uploads bucket (private, for general uploads)
--
-- Sets up RLS policies for authenticated users to upload/manage images
```

### Step 3: Quizzes Table Setup

Run `supabase/quizzes-schema.sql` to create the quizzes table for storing quiz questions:

```sql
-- Creates:
-- - quizzes table (stores quiz questions as JSONB)
-- - RLS policies for public read and authenticated write
-- - Indexes and triggers
```

### Step 3b: Badges Table Setup

Run `supabase/badges-schema.sql` to create the badges table for course completion rewards:

```sql
-- Creates:
-- - badges table (stores course completion badges)
-- - RLS policies for users to view/earn their own badges
-- - Indexes for performance
```

### Step 4: Admin RLS Policies

Run these scripts to allow authenticated users to manage courses, modules, and lessons:

#### 3a. Courses Admin Policies

Run `supabase/admin-courses-rls.sql`:
```sql
-- Allows authenticated users to:
-- - INSERT courses
-- - UPDATE courses
-- - DELETE courses
```

#### 3b. Modules Admin Policies

Run `supabase/admin-modules-rls.sql`:
```sql
-- Allows authenticated users to:
-- - INSERT modules
-- - UPDATE modules
-- - DELETE modules
```

#### 4c. Lessons Admin Policies

Run `supabase/admin-lessons-rls.sql`:
```sql
-- Allows authenticated users to:
-- - INSERT lessons
-- - UPDATE lessons
-- - DELETE lessons
```

### Step 4: Instructors Setup (Optional)

If you need to allow authenticated users to create instructors, run:

```sql
-- Allow authenticated users to insert instructors
CREATE POLICY "Authenticated can insert instructors" ON instructors
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update instructors
CREATE POLICY "Authenticated can update instructors" ON instructors
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete instructors
CREATE POLICY "Authenticated can delete instructors" ON instructors
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);
```

Or create a default "DeMentor" instructor:

```sql
-- Insert default DeMentor instructor if it doesn't exist
INSERT INTO instructors (id, name, avatar, bio, specializations)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'DeMentor',
  '/dementor_avatar.png',
  'Your AI-powered learning assistant, here to guide you through your educational journey.',
  ARRAY['AI Assistant', 'Learning Support', 'Course Guidance']
)
ON CONFLICT (id) DO NOTHING;
```

## Database Schema

### Tables Structure

```
instructors
├── id (UUID, PK)
├── name (TEXT)
├── avatar (TEXT)
├── bio (TEXT)
├── specializations (TEXT[])
├── socials (JSONB)
└── timestamps

courses
├── id (UUID, PK)
├── title (TEXT)
├── description (TEXT)
├── thumbnail (TEXT)
├── instructor_id (UUID, FK → instructors)
├── category (TEXT, CHECK constraint)
├── featured (BOOLEAN)
└── timestamps

modules
├── id (UUID, PK)
├── course_id (UUID, FK → courses)
├── title (TEXT)
├── description (TEXT)
├── order_index (INTEGER)
└── timestamps

lessons
├── id (UUID, PK)
├── module_id (UUID, FK → modules)
├── title (TEXT)
├── markdown_content (TEXT, nullable)
├── video_url (TEXT, nullable)
├── quiz_id (UUID, nullable)
├── duration (INTEGER, nullable)
├── order_index (INTEGER)
└── timestamps

enrollments
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── course_id (UUID, FK → courses)
└── enrolled_at (TIMESTAMP)

lesson_progress
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── course_id (UUID, FK → courses)
├── lesson_id (UUID, FK → lessons)
├── completed (BOOLEAN)
└── timestamps

course_progress
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── course_id (UUID, FK → courses)
└── timestamps
```

## Row Level Security (RLS) Policies

### Public Read Access
- ✅ Anyone can view: `instructors`, `courses`, `modules`, `lessons`

### Authenticated User Access
- ✅ Authenticated users can manage: `courses`, `modules`, `lessons` (INSERT, UPDATE, DELETE)
- ✅ Users can only see their own: `enrollments`, `lesson_progress`, `course_progress`

## Supabase Clients

The codebase uses two types of Supabase clients:

### 1. Server-Side Client
**File:** `lib/supabase/server.ts`

```typescript
import { createLearningServerClient } from "@/lib/supabase/server";

// Use in server components
const supabase = createLearningServerClient();
const courses = await getAllCourses(supabase);
```

### 2. Client-Side Client
**File:** `lib/supabase/learning-client.ts`

```typescript
import { createLearningClient } from "@/lib/supabase/learning-client";

// Use in client components
const supabase = createLearningClient();
const courses = await getAllCourses(supabase);
```

## Data Fetching Functions

### Courses
**File:** `lib/courses.ts`

- `getAllCourses(supabaseClient)`: Fetch all courses with modules and lessons
- `getCourseById(supabaseClient, courseId)`: Fetch a single course with all related data

### Usage Examples

**Server Component:**
```typescript
import { getCourseById } from "@/lib/courses";
import { createLearningServerClient } from "@/lib/supabase/server";

export default async function CoursePage({ params }) {
  const supabase = createLearningServerClient();
  const course = await getCourseById(supabase, params.id);
  // ...
}
```

**Client Component:**
```typescript
"use client";
import { getAllCourses } from "@/lib/courses";
import { createLearningClient } from "@/lib/supabase/learning-client";

export function CoursesList() {
  const supabase = createLearningClient();
  const [courses, setCourses] = useState([]);
  
  useEffect(() => {
    getAllCourses(supabase).then(setCourses);
  }, []);
  // ...
}
```

## Storage

### Course Images

Course thumbnails are stored in the `course-images` bucket:

- **Bucket:** `course-images` (public)
- **File Size Limit:** 10MB
- **Allowed Types:** JPEG, JPG, PNG, GIF, WEBP
- **Storage Path:** `{courseId}/{filename}`

**Functions:**
- `uploadCourseImage(file, courseId, supabaseClient)`: Upload course image
- `deleteCourseImage(filePath, supabaseClient)`: Delete course image

## Admin Panel

The admin panel (`/admin/courses`) allows authenticated users to:

1. **Create/Edit/Delete Courses**
   - Upload course images
   - Set course metadata (title, description, category, featured status)

2. **Manage Modules**
   - Create modules for courses
   - Edit module titles and descriptions
   - Reorder modules (drag & drop)
   - Delete modules

3. **Manage Lessons**
   - Create lessons (Markdown, Video, or Quiz types)
   - Edit lesson content
   - Reorder lessons (drag & drop)
   - Delete lessons
   - Duplicate lessons

## Verification

After running all SQL scripts, verify the setup:

1. **Check Tables:**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('courses', 'modules', 'lessons', 'instructors');
   ```

2. **Check RLS Policies:**
   ```sql
   SELECT tablename, policyname, cmd 
   FROM pg_policies 
   WHERE schemaname = 'public' 
   AND tablename IN ('courses', 'modules', 'lessons');
   ```

3. **Check Storage Buckets:**
   ```sql
   SELECT id, name, public FROM storage.buckets 
   WHERE id IN ('course-images', 'avatars');
   ```

4. **Test in Admin Panel:**
   - Navigate to `/admin/courses`
   - Try creating a course
   - Try creating a module
   - Try creating a lesson

## Troubleshooting

### Error: "relation 'modules' does not exist"
**Solution:** Run `supabase/schema.sql` first to create all base tables.

### Error: "policy already exists"
**Solution:** The scripts use `DROP POLICY IF EXISTS`, so this shouldn't happen. If it does, the policy might have a different name. Check existing policies and drop manually if needed.

### Error: "new row violates row-level security policy"
**Solution:** Make sure you've run the admin RLS policy scripts (`admin-courses-rls.sql`, `admin-modules-rls.sql`, `admin-lessons-rls.sql`).

### Video/Lesson Content Not Showing
**Solution:** 
- Check that `video_url` or `markdown_content` is set in the database
- Verify the lesson type matches the content (video lesson should have `video_url`, markdown lesson should have `markdown_content`)

### Images Not Uploading
**Solution:**
- Verify `storage-setup.sql` was run
- Check that the `course-images` bucket exists and is public
- Verify RLS policies for storage are set up correctly

## Next Steps

1. ✅ Database schema created
2. ✅ RLS policies configured
3. ✅ Storage buckets set up
4. ✅ Admin panel functional
5. 🔄 Quiz system (TODO: Create quizzes table and integrate)
6. 🔄 Progress tracking (TODO: Implement progress updates)
7. 🔄 Enrollment system (TODO: Add enrollment UI)

## Related Files

- `supabase/schema.sql` - Base database schema
- `supabase/storage-setup.sql` - Storage bucket setup
- `supabase/admin-courses-rls.sql` - Course admin policies
- `supabase/admin-modules-rls.sql` - Module admin policies
- `supabase/admin-lessons-rls.sql` - Lesson admin policies
- `lib/courses.ts` - Course data fetching functions
- `lib/supabase/server.ts` - Server-side Supabase client
- `lib/supabase/learning-client.ts` - Client-side Supabase client
- `lib/storage.ts` - Storage utility functions
- `app/admin/courses/page.tsx` - Admin panel UI

