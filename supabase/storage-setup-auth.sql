-- Storage bucket setup for Auth Supabase
-- This file should be run in the Auth Supabase SQL Editor
-- (The one used for authentication: NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_URL)

-- Create storage bucket for workshop images (Auth Supabase)
-- This is where user authentication happens, so storage uploads work here
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'workshop-images',
  'workshop-images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for workshop-images bucket (Auth Supabase)
DROP POLICY IF EXISTS "Public Workshop Image Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload workshop images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update workshop images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete workshop images" ON storage.objects;

CREATE POLICY "Public Workshop Image Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'workshop-images');

CREATE POLICY "Authenticated can upload workshop images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'workshop-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated can update workshop images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'workshop-images' 
  AND auth.uid() IS NOT NULL
)
WITH CHECK (
  bucket_id = 'workshop-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated can delete workshop images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'workshop-images' 
  AND auth.uid() IS NOT NULL
);

