-- Badges table to store course completion badges
-- Run this after schema.sql
-- Note: user_id is a UUID from the auth Supabase (no foreign key constraint)

-- Drop table if it exists with wrong structure
DROP TABLE IF EXISTS badges CASCADE;

CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL, -- User ID from auth Supabase (no FK since auth is in separate project)
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  badge_name TEXT NOT NULL, -- e.g., "Solana Mastery", "Web Development Mastery"
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, course_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_badges_user ON badges(user_id);
CREATE INDEX IF NOT EXISTS idx_badges_course ON badges(course_id);

-- Enable RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

-- Public can view all badges (for profile display)
-- Note: Since auth is in separate Supabase, we allow public read
-- The application will filter badges by user_id on the client side
DROP POLICY IF EXISTS "Public can view badges" ON badges;
CREATE POLICY "Public can view badges" ON badges
  FOR SELECT
  USING (true);

-- Authenticated users can insert badges (when completing a course)
-- Note: Application should verify user_id matches authenticated user
DROP POLICY IF EXISTS "Authenticated can insert badges" ON badges;
CREATE POLICY "Authenticated can insert badges" ON badges
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

