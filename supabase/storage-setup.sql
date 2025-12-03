-- Storage bucket setup for profile pictures and user uploads
-- Run this in Supabase SQL Editor

-- Create storage bucket for avatars/profile pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- Public bucket so images can be accessed directly
  5242880, -- 5MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for general user uploads (optional)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-uploads',
  'user-uploads',
  false, -- Private bucket
  10485760, -- 10MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for course images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-images',
  'course-images',
  true, -- Public bucket so images can be accessed directly
  10485760, -- 10MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for project images (used by teams/projects in Auth Supabase)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-images',
  'project-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for team avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'team-avatars',
  'team-avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars bucket
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Avatar Access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

-- Policy: Anyone can view public avatars
CREATE POLICY "Public Avatar Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Policy: Authenticated users can upload their own avatar
-- Files are stored as: {userId}/{filename}
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Policy: Users can update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
)
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Policy: Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Storage policies for user-uploads bucket
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- Policy: Users can view their own uploads
CREATE POLICY "Users can view own uploads"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-uploads' 
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Policy: Users can upload to their own folder
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-uploads' 
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Policy: Users can update their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-uploads' 
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
)
WITH CHECK (
  bucket_id = 'user-uploads' 
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-uploads' 
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Storage policies for course-images bucket
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Course Image Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload course images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update course images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete course images" ON storage.objects;

-- Policy: Anyone can view course images (public bucket)
CREATE POLICY "Public Course Image Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-images');

-- Policy: Authenticated users can upload course images
-- Files are stored as: courses/{courseId}/{filename} or courses/{filename}
CREATE POLICY "Authenticated can upload course images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-images' 
  AND auth.uid() IS NOT NULL
);

-- Policy: Authenticated users can update course images
CREATE POLICY "Authenticated can update course images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'course-images' 
  AND auth.uid() IS NOT NULL
)
WITH CHECK (
  bucket_id = 'course-images' 
  AND auth.uid() IS NOT NULL
);

-- Policy: Authenticated users can delete course images
CREATE POLICY "Authenticated can delete course images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-images' 
  AND auth.uid() IS NOT NULL
);

-- Storage policies for project-images bucket
DROP POLICY IF EXISTS "Public Project Image Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload project images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update project images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete project images" ON storage.objects;

CREATE POLICY "Public Project Image Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-images');

CREATE POLICY "Authenticated can upload project images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated can update project images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'project-images' 
  AND auth.uid() IS NOT NULL
)
WITH CHECK (
  bucket_id = 'project-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated can delete project images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-images' 
  AND auth.uid() IS NOT NULL
);

-- Storage policies for team-avatars bucket
DROP POLICY IF EXISTS "Public Team Avatar Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload team avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update team avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete team avatars" ON storage.objects;

CREATE POLICY "Public Team Avatar Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'team-avatars');

CREATE POLICY "Authenticated can upload team avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'team-avatars' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated can update team avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'team-avatars' 
  AND auth.uid() IS NOT NULL
)
WITH CHECK (
  bucket_id = 'team-avatars' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated can delete team avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'team-avatars' 
  AND auth.uid() IS NOT NULL
);

-- Verify buckets were created
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id IN ('avatars', 'user-uploads', 'course-images', 'project-images', 'team-avatars');

