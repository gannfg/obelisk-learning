-- Add image_url column to missions so each mission can have a thumbnail/cover image
-- Run this in the same Supabase project where learning-platform-schema.sql was applied.

ALTER TABLE missions
ADD COLUMN IF NOT EXISTS image_url TEXT;




