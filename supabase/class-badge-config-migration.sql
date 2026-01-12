-- ============================================
-- CLASS BADGE CONFIGURATION MIGRATION
-- ============================================
-- This migration adds badge reward configuration for classes
-- Class owners can create custom badges with images that are awarded when students complete all modules

-- ============================================
-- 11. CLASS BADGE CONFIGURATION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS class_badge_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  badge_image_url TEXT, -- Custom badge image uploaded by class owner
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_class_badge_config_class ON class_badge_config(class_id);
CREATE INDEX IF NOT EXISTS idx_class_badge_config_enabled ON class_badge_config(enabled) WHERE enabled = TRUE;

-- Enable RLS
ALTER TABLE class_badge_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admins and class mentors can manage badge configs
DROP POLICY IF EXISTS "Admins can manage badge config" ON class_badge_config;
CREATE POLICY "Admins can manage badge config"
  ON class_badge_config FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Mentors can manage badge config" ON class_badge_config;
CREATE POLICY "Mentors can manage badge config"
  ON class_badge_config FOR ALL
  USING (is_class_instructor(auth.uid(), class_id))
  WITH CHECK (is_class_instructor(auth.uid(), class_id));

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_badge_config_updated_at ON class_badge_config;
CREATE TRIGGER update_badge_config_updated_at
  BEFORE UPDATE ON class_badge_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
