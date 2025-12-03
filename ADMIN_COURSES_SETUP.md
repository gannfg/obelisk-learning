# Admin Course Manager Setup Guide

## Overview

The admin course manager has been enhanced with the following features:

1. **Course Image Upload**: Upload course thumbnails directly to Supabase Storage
2. **Course Listing**: View all courses in a list with thumbnails
3. **Course Editing**: Edit existing courses (title, description, category, thumbnail, featured status)
4. **Course Deletion**: Delete courses (cascades to modules and lessons)
5. **Module Management**: Create, edit, and delete modules for courses
6. **Module Editor**: Full CRUD operations for modules

## Database Setup

**IMPORTANT: Run these SQL files in order!**

### 0. Base Schema (Required First!)

**You must run `supabase/schema.sql` first** to create the base tables (`courses`, `modules`, `lessons`, etc.):

```sql
-- This creates all the base tables including:
-- - instructors
-- - courses
-- - modules
-- - lessons
-- - enrollments
-- - progress tables
```

**If you get an error that "modules" table does not exist, you need to run `schema.sql` first!**

### 1. Storage Bucket Setup

Run the updated `supabase/storage-setup.sql` in your **Learning Supabase** project to create the `course-images` storage bucket:

```sql
-- This will create the course-images bucket with public access
-- and set up policies for authenticated users to upload/manage images
```

### 2. RLS Policies for Courses

Run `supabase/admin-courses-rls.sql` in your **Learning Supabase** project to allow authenticated users to update and delete courses:

```sql
-- Adds policies for:
-- - UPDATE courses (authenticated users)
-- - DELETE courses (authenticated users)
```

### 3. RLS Policies for Modules

Run `supabase/admin-modules-rls.sql` in your **Learning Supabase** project to allow authenticated users to manage modules:

```sql
-- Adds policies for:
-- - INSERT modules (authenticated users)
-- - UPDATE modules (authenticated users)
-- - DELETE modules (authenticated users)
```

**Note:** This script will check if the `modules` table exists and give you a clear error message if it doesn't.

## Features

### Course Management

- **Create Course**: Fill out the form with title, description, category, and upload an image
- **Edit Course**: Click the edit button on any course in the list to modify it
- **Delete Course**: Click the delete button (with confirmation) to remove a course
- **Image Upload**: 
  - Upload images directly from your computer
  - Or enter a URL for existing images
  - Preview images before saving
  - Images are stored in Supabase Storage bucket `course-images`

### Module Management

- **View Modules**: Switch to the "Modules" tab and select a course to see its modules
- **Add Module**: Click "Add Module" to create a new module (prompts for title and description)
- **Edit Module**: Click the edit button on any module to modify its title and description
- **Delete Module**: Click the delete button (with confirmation) to remove a module
- **Module Ordering**: Modules are ordered by `order_index` (automatically set when creating)

## UI Structure

The admin courses page is organized into tabs:

1. **Courses Tab**:
   - Course creation/editing form at the top
   - Course list below showing all courses with thumbnails

2. **Modules Tab**:
   - Module management interface
   - Requires selecting a course first (from Courses tab)

## File Structure

- `app/admin/courses/page.tsx`: Main admin courses page with all features
- `lib/storage.ts`: Updated with `uploadCourseImage()` and `deleteCourseImage()` functions
- `supabase/storage-setup.sql`: Updated with course-images bucket setup
- `supabase/admin-courses-rls.sql`: RLS policies for course updates/deletes
- `supabase/admin-modules-rls.sql`: RLS policies for module management

## Usage

1. Navigate to `/admin/courses`
2. Create a new course or edit an existing one
3. Upload a course image (or use a URL)
4. Switch to the Modules tab to manage modules for a selected course
5. Add, edit, or delete modules as needed

## Notes

- Course images are stored in the `course-images` bucket in Supabase Storage
- Images are publicly accessible (public bucket)
- Module deletion cascades to lessons (database constraint)
- Course deletion cascades to modules and lessons (database constraint)
- All operations require authentication (RLS policies)

