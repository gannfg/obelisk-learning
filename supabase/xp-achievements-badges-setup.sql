-- ============================================
-- XP, Achievements, and Badges Setup
-- ============================================
-- This script sets up the complete XP, achievements, and badges system
-- Run this in the Auth Supabase (for users.xp) and Learning Supabase (for badges)

-- ============================================
-- PART 1: AUTH SUPABASE - Add XP to Users Table
-- ============================================
-- Run this in the Auth Supabase project

-- Add XP column to users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'xp'
  ) THEN
    ALTER TABLE users ADD COLUMN xp INTEGER NOT NULL DEFAULT 0;
    COMMENT ON COLUMN users.xp IS 'Total experience points earned by the user';
  END IF;
END $$;

-- Create index on XP for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_users_xp ON users(xp DESC) WHERE xp > 0;

-- ============================================
-- PART 2: LEARNING SUPABASE - Badges System
-- ============================================
-- Run this in the Learning Supabase project

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Badges Table (Course Completion Badges)
-- ============================================
-- This table stores badges earned by users for completing courses
-- Note: user_id references auth.users but no FK constraint (different database)

CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL, -- User ID from auth Supabase (no FK since auth is in separate project)
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE, -- Optional: for course completion badges
  badge_name TEXT NOT NULL, -- e.g., "Solana Mastery", "Workshop Attendee", "Workshop Enthusiast"
  badge_type TEXT DEFAULT 'course' CHECK (badge_type IN ('course', 'workshop', 'mission', 'milestone', 'other')),
  description TEXT, -- Optional description of the badge
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  metadata JSONB DEFAULT '{}', -- Store additional data (workshop_id, mission_id, etc.)
  UNIQUE(user_id, course_id, badge_name) -- Prevent duplicate badges
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_badges_user ON badges(user_id);
CREATE INDEX IF NOT EXISTS idx_badges_course ON badges(course_id) WHERE course_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_badges_type ON badges(badge_type);
CREATE INDEX IF NOT EXISTS idx_badges_earned_at ON badges(earned_at DESC);

-- ============================================
-- XP History Table (Optional - Track XP Sources)
-- ============================================
-- This table tracks where XP came from for transparency and debugging

CREATE TABLE IF NOT EXISTS xp_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL, -- User ID from auth Supabase
  amount INTEGER NOT NULL, -- XP amount (can be negative for corrections)
  source TEXT NOT NULL, -- Source of XP: 'workshop_attendance', 'course_completed', 'mission_completed', 'assignment_approved', etc.
  source_id UUID, -- Optional: ID of the source (workshop_id, course_id, mission_id, etc.)
  description TEXT, -- Optional description
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for XP history
CREATE INDEX IF NOT EXISTS idx_xp_history_user ON xp_history(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_history_source ON xp_history(source);
CREATE INDEX IF NOT EXISTS idx_xp_history_created_at ON xp_history(created_at DESC);

-- ============================================
-- Achievement Milestones Table
-- ============================================
-- This table defines achievement milestones (e.g., "Attend 5 workshops")

CREATE TABLE IF NOT EXISTS achievement_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE, -- e.g., "Workshop Enthusiast"
  description TEXT,
  badge_name TEXT NOT NULL, -- Badge name to award when milestone is reached
  milestone_type TEXT NOT NULL CHECK (milestone_type IN ('workshop_count', 'course_count', 'mission_count', 'xp_threshold', 'custom')),
  threshold INTEGER NOT NULL, -- Number required (e.g., 5 workshops)
  metadata JSONB DEFAULT '{}', -- Additional criteria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Insert default workshop milestones
INSERT INTO achievement_milestones (name, description, badge_name, milestone_type, threshold)
VALUES 
  ('Workshop Enthusiast', 'Attend 5 workshops', 'Workshop Enthusiast', 'workshop_count', 5),
  ('Workshop Master', 'Attend 10 workshops', 'Workshop Master', 'workshop_count', 10)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_milestones ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies for Badges
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view badges" ON badges;
DROP POLICY IF EXISTS "Users can view own badges" ON badges;
DROP POLICY IF EXISTS "Authenticated can insert badges" ON badges;
DROP POLICY IF EXISTS "Users can update own badges" ON badges;

-- Public can view all badges (for profile display, leaderboards)
CREATE POLICY "Public can view badges" ON badges
  FOR SELECT
  USING (true);

-- Users can view their own badges
CREATE POLICY "Users can view own badges" ON badges
  FOR SELECT
  USING (true); -- Since user_id is from auth Supabase, we allow all authenticated users to view

-- Authenticated users can insert badges (application will verify user_id)
CREATE POLICY "Authenticated can insert badges" ON badges
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can update their own badges (for metadata updates)
CREATE POLICY "Users can update own badges" ON badges
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- RLS Policies for XP History
-- ============================================

DROP POLICY IF EXISTS "Users can view own XP history" ON xp_history;
DROP POLICY IF EXISTS "Authenticated can insert XP history" ON xp_history;

-- Users can view their own XP history
CREATE POLICY "Users can view own XP history" ON xp_history
  FOR SELECT
  USING (true); -- Application will filter by user_id

-- Authenticated users can insert XP history
CREATE POLICY "Authenticated can insert XP history" ON xp_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- RLS Policies for Achievement Milestones
-- ============================================

DROP POLICY IF EXISTS "Public can view milestones" ON achievement_milestones;

-- Public can view all milestones
CREATE POLICY "Public can view milestones" ON achievement_milestones
  FOR SELECT
  USING (true);

-- ============================================
-- Helper Functions
-- ============================================

-- Function to check and award milestone badges
CREATE OR REPLACE FUNCTION check_and_award_milestone(
  p_user_id UUID,
  p_milestone_type TEXT,
  p_current_count INTEGER
)
RETURNS TABLE(badge_awarded BOOLEAN, badge_name TEXT) AS $$
DECLARE
  v_milestone RECORD;
  v_badge_exists BOOLEAN;
BEGIN
  -- Find milestones that should be awarded
  FOR v_milestone IN 
    SELECT * FROM achievement_milestones
    WHERE milestone_type = p_milestone_type
      AND threshold <= p_current_count
    ORDER BY threshold DESC
    LIMIT 1
  LOOP
    -- Check if user already has this badge
    SELECT EXISTS(
      SELECT 1 FROM badges
      WHERE user_id = p_user_id
        AND badge_name = v_milestone.badge_name
    ) INTO v_badge_exists;
    
    -- Award badge if not already earned
    IF NOT v_badge_exists THEN
      INSERT INTO badges (user_id, badge_name, badge_type, description, metadata)
      VALUES (
        p_user_id,
        v_milestone.badge_name,
        'milestone',
        v_milestone.description,
        jsonb_build_object('milestone_id', v_milestone.id, 'threshold', v_milestone.threshold)
      )
      ON CONFLICT (user_id, course_id, badge_name) DO NOTHING;
      
      RETURN QUERY SELECT TRUE, v_milestone.badge_name;
      RETURN;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT FALSE, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Grants
-- ============================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON badges TO anon, authenticated;
GRANT SELECT, INSERT ON xp_history TO anon, authenticated;
GRANT SELECT ON achievement_milestones TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_and_award_milestone TO authenticated;

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE badges IS 'Stores badges earned by users (course completion, workshop attendance, milestones, etc.)';
COMMENT ON TABLE xp_history IS 'Tracks XP transactions for transparency and debugging';
COMMENT ON TABLE achievement_milestones IS 'Defines achievement milestones that award badges when reached';
COMMENT ON COLUMN badges.badge_type IS 'Type of badge: course, workshop, mission, milestone, or other';
COMMENT ON COLUMN badges.metadata IS 'Additional data: workshop_id, mission_id, or other relevant IDs';

