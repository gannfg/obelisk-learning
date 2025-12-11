-- Classroom System Migration
-- Adds week-based attendance, module content, and enhanced features

-- ============================================
-- 1. ADD MODULE CONTENT AND RELEASE FIELDS
-- ============================================
ALTER TABLE class_modules 
ADD COLUMN IF NOT EXISTS content JSONB,
ADD COLUMN IF NOT EXISTS is_released BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS release_date TIMESTAMP WITH TIME ZONE;

-- Update existing modules to be released if start_date has passed
UPDATE class_modules 
SET is_released = TRUE 
WHERE start_date IS NOT NULL AND start_date <= NOW();

-- ============================================
-- 2. ADD WEEK-BASED ATTENDANCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS class_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  method TEXT NOT NULL CHECK (method IN ('qr', 'manual')),
  checked_in_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(class_id, user_id, week_number)
);

-- Indexes for attendance
CREATE INDEX IF NOT EXISTS idx_class_attendance_class ON class_attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_class_attendance_user ON class_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_class_attendance_week ON class_attendance(class_id, week_number);

-- ============================================
-- 3. ADD MEETING LINK TO CLASSES
-- ============================================
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS meeting_link TEXT;

-- ============================================
-- 4. ADD GRADE FIELD TO SUBMISSIONS
-- ============================================
ALTER TABLE assignment_submissions 
ADD COLUMN IF NOT EXISTS grade NUMERIC(5,2);

-- ============================================
-- 5. RLS POLICIES FOR CLASS ATTENDANCE
-- ============================================
ALTER TABLE class_attendance ENABLE ROW LEVEL SECURITY;

-- Admins and instructors can manage attendance
DROP POLICY IF EXISTS "Admins and instructors can manage class attendance" ON class_attendance;
CREATE POLICY "Admins and instructors can manage class attendance"
  ON class_attendance FOR ALL
  USING (
    is_admin(auth.uid()) OR 
    is_class_instructor(auth.uid(), class_id)
  )
  WITH CHECK (
    is_admin(auth.uid()) OR 
    is_class_instructor(auth.uid(), class_id)
  );

-- Users can view their own attendance
DROP POLICY IF EXISTS "Users can view own class attendance" ON class_attendance;
CREATE POLICY "Users can view own class attendance"
  ON class_attendance FOR SELECT
  USING (user_id = auth.uid());

-- Users can mark their own attendance (for manual check-in)
DROP POLICY IF EXISTS "Users can mark own attendance" ON class_attendance;
CREATE POLICY "Users can mark own attendance"
  ON class_attendance FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    is_enrolled(auth.uid(), class_id)
  );

-- ============================================
-- 6. FUNCTION TO AUTO-RELEASE MODULES
-- ============================================
CREATE OR REPLACE FUNCTION auto_release_modules()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.release_date IS NOT NULL AND NEW.release_date <= NOW() THEN
    NEW.is_released := TRUE;
  END IF;
  IF NEW.start_date IS NOT NULL AND NEW.start_date <= NOW() THEN
    NEW.is_released := TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_release_modules ON class_modules;
CREATE TRIGGER trigger_auto_release_modules
  BEFORE INSERT OR UPDATE ON class_modules
  FOR EACH ROW
  EXECUTE FUNCTION auto_release_modules();

-- ============================================
-- 7. GRANTS
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON class_attendance TO authenticated;
GRANT SELECT ON class_attendance TO anon;

-- ============================================
-- 8. ADD UPDATED_AT TRIGGER FOR CLASS_ATTENDANCE
-- ============================================
-- Note: updated_at is not needed for attendance (it's a record of when checked in)
-- But we'll add it for consistency if needed in the future

-- ============================================
-- 9. COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE class_attendance IS 'Week-based attendance tracking for classes. Each record represents a student checking in for a specific week.';
COMMENT ON COLUMN class_attendance.week_number IS 'The week number (1, 2, 3, etc.) for which attendance is being recorded';
COMMENT ON COLUMN class_attendance.method IS 'How attendance was recorded: qr (QR code scan) or manual (manual check-in)';
COMMENT ON COLUMN class_modules.content IS 'Module content in JSONB format (can store markdown, HTML, or structured JSON)';
COMMENT ON COLUMN class_modules.is_released IS 'Whether the module is currently accessible to enrolled students';
COMMENT ON COLUMN class_modules.release_date IS 'Date when the module should be automatically released to students';
COMMENT ON COLUMN classes.meeting_link IS 'Default meeting link for the class (can be overridden by module-specific links)';
COMMENT ON COLUMN assignment_submissions.grade IS 'Numeric grade (0-100) assigned by instructor';

