-- ============================================
-- Safe Migration Script for XP, Achievements, and Badges
-- ============================================
-- This script safely migrates existing databases to add XP and badges support
-- It checks for existing columns/tables before creating them

-- ============================================
-- PART 1: AUTH SUPABASE - Add XP Column
-- ============================================
-- Run this in the Auth Supabase project

-- Add XP column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'users' 
      AND column_name = 'xp'
  ) THEN
    ALTER TABLE users ADD COLUMN xp INTEGER NOT NULL DEFAULT 0;
    RAISE NOTICE 'Added xp column to users table';
  ELSE
    RAISE NOTICE 'xp column already exists in users table';
  END IF;
END $$;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_users_xp ON users(xp DESC) WHERE xp > 0;

-- ============================================
-- PART 2: LEARNING SUPABASE - Badges System
-- ============================================
-- Run this in the Learning Supabase project

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Badges Table - Safe Migration
-- ============================================

-- Check if badges table exists and has the right structure
DO $$
DECLARE
  table_exists BOOLEAN;
  has_badge_type BOOLEAN;
  has_metadata BOOLEAN;
BEGIN
  -- Check if table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'badges'
  ) INTO table_exists;

  IF table_exists THEN
    -- Check if badge_type column exists
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public'
        AND table_name = 'badges' 
        AND column_name = 'badge_type'
    ) INTO has_badge_type;

    -- Check if metadata column exists
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public'
        AND table_name = 'badges' 
        AND column_name = 'metadata'
    ) INTO has_metadata;

    -- Add missing columns
    IF NOT has_badge_type THEN
      ALTER TABLE badges ADD COLUMN badge_type TEXT DEFAULT 'course' CHECK (badge_type IN ('course', 'workshop', 'mission', 'milestone', 'other'));
      -- Update existing rows
      UPDATE badges SET badge_type = 'course' WHERE badge_type IS NULL;
      RAISE NOTICE 'Added badge_type column to badges table';
    END IF;

    IF NOT has_metadata THEN
      ALTER TABLE badges ADD COLUMN metadata JSONB DEFAULT '{}';
      RAISE NOTICE 'Added metadata column to badges table';
    END IF;

    -- Update unique constraint if needed
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'badges_user_id_course_id_badge_name_key'
    ) THEN
      -- Drop old unique constraint if exists
      ALTER TABLE badges DROP CONSTRAINT IF EXISTS badges_user_id_course_id_key;
      ALTER TABLE badges DROP CONSTRAINT IF EXISTS badges_user_id_badge_name_key;
      
      -- Add new unique constraint
      ALTER TABLE badges ADD CONSTRAINT badges_user_id_course_id_badge_name_key 
        UNIQUE(user_id, course_id, badge_name);
      RAISE NOTICE 'Updated unique constraint on badges table';
    END IF;
  ELSE
    -- Create table if it doesn't exist
    CREATE TABLE badges (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL,
      course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
      badge_name TEXT NOT NULL,
      badge_type TEXT DEFAULT 'course' CHECK (badge_type IN ('course', 'workshop', 'mission', 'milestone', 'other')),
      description TEXT,
      earned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
      metadata JSONB DEFAULT '{}',
      UNIQUE(user_id, course_id, badge_name)
    );
    RAISE NOTICE 'Created badges table';
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_badges_user ON badges(user_id);
CREATE INDEX IF NOT EXISTS idx_badges_course ON badges(course_id) WHERE course_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_badges_type ON badges(badge_type);
CREATE INDEX IF NOT EXISTS idx_badges_earned_at ON badges(earned_at DESC);

-- ============================================
-- XP History Table - Create if doesn't exist
-- ============================================

CREATE TABLE IF NOT EXISTS xp_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  source_id UUID,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_xp_history_user ON xp_history(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_history_source ON xp_history(source);
CREATE INDEX IF NOT EXISTS idx_xp_history_created_at ON xp_history(created_at DESC);

-- ============================================
-- Achievement Milestones Table
-- ============================================

CREATE TABLE IF NOT EXISTS achievement_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  badge_name TEXT NOT NULL,
  milestone_type TEXT NOT NULL CHECK (milestone_type IN ('workshop_count', 'course_count', 'mission_count', 'xp_threshold', 'custom')),
  threshold INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Insert default milestones if they don't exist
INSERT INTO achievement_milestones (name, description, badge_name, milestone_type, threshold)
VALUES 
  ('Workshop Enthusiast', 'Attend 5 workshops', 'Workshop Enthusiast', 'workshop_count', 5),
  ('Workshop Master', 'Attend 10 workshops', 'Workshop Master', 'workshop_count', 10)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- RLS Setup
-- ============================================

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_milestones ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Public can view badges" ON badges;
DROP POLICY IF EXISTS "Users can view own badges" ON badges;
DROP POLICY IF EXISTS "Authenticated can insert badges" ON badges;
DROP POLICY IF EXISTS "Users can update own badges" ON badges;

CREATE POLICY "Public can view badges" ON badges
  FOR SELECT USING (true);

CREATE POLICY "Users can view own badges" ON badges
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can insert badges" ON badges
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update own badges" ON badges
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- XP History policies
DROP POLICY IF EXISTS "Users can view own XP history" ON xp_history;
DROP POLICY IF EXISTS "Authenticated can insert XP history" ON xp_history;

CREATE POLICY "Users can view own XP history" ON xp_history
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can insert XP history" ON xp_history
  FOR INSERT TO authenticated WITH CHECK (true);

-- Milestones policies
DROP POLICY IF EXISTS "Public can view milestones" ON achievement_milestones;

CREATE POLICY "Public can view milestones" ON achievement_milestones
  FOR SELECT USING (true);

-- ============================================
-- Helper Function
-- ============================================

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
  FOR v_milestone IN 
    SELECT * FROM achievement_milestones
    WHERE milestone_type = p_milestone_type
      AND threshold <= p_current_count
    ORDER BY threshold DESC
    LIMIT 1
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM badges
      WHERE user_id = p_user_id
        AND badge_name = v_milestone.badge_name
    ) INTO v_badge_exists;
    
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

