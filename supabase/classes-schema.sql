-- Semester-Based Classes Management System Schema
-- This schema supports semester-based classes with weekly modules, live sessions, enrollments, assignments, and announcements

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 0. USERS TABLE (Minimal sync from Auth Supabase)
-- ============================================
-- This table should be synced from Auth Supabase's users table
-- It only needs id and is_admin for RLS policies to work
-- Run this in Learning Supabase
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY, -- References auth.users(id) but no FK constraint (different database)
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index on is_admin for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = TRUE;

-- Note: This table should be synced from Auth Supabase's users table
-- You can set up a sync mechanism or manually insert admin users:
-- INSERT INTO users (id, is_admin) VALUES ('user-uuid-here', TRUE) ON CONFLICT (id) DO UPDATE SET is_admin = EXCLUDED.is_admin;

-- ============================================
-- 1. CLASSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  category TEXT,
  semester TEXT, -- e.g., "Fall 2024", "Spring 2025"
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  max_capacity INTEGER,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled', 'archived')),
  published BOOLEAN DEFAULT FALSE,
  enrollment_locked BOOLEAN DEFAULT FALSE, -- Lock enrollment when class starts
  instructor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Auto-update status based on dates
CREATE OR REPLACE FUNCTION update_class_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.start_date > NOW() THEN
    NEW.status := 'upcoming';
  ELSIF NEW.end_date < NOW() THEN
    NEW.status := 'completed';
  ELSIF NEW.start_date <= NOW() AND NEW.end_date >= NOW() THEN
    NEW.status := 'ongoing';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_class_status ON classes;
CREATE TRIGGER trigger_update_class_status
  BEFORE INSERT OR UPDATE ON classes
  FOR EACH ROW
  EXECUTE FUNCTION update_class_status();

-- ============================================
-- 2. WEEKLY MODULES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS class_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL, -- Week 1, Week 2, etc.
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  live_session_link TEXT, -- Link to live session
  learning_materials JSONB DEFAULT '[]', -- Array of {type, title, url}
  locked BOOLEAN DEFAULT TRUE, -- Unlock on scheduled date
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(class_id, week_number)
);

-- Auto-unlock modules on scheduled date
CREATE OR REPLACE FUNCTION unlock_module_on_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.start_date IS NOT NULL AND NEW.start_date <= NOW() THEN
    NEW.locked := FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_unlock_module ON class_modules;
CREATE TRIGGER trigger_unlock_module
  BEFORE INSERT OR UPDATE ON class_modules
  FOR EACH ROW
  EXECUTE FUNCTION unlock_module_on_date();

-- ============================================
-- 3. LIVE SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS live_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES class_modules(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  session_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location_type TEXT NOT NULL CHECK (location_type IN ('online', 'offline')),
  location TEXT, -- Venue name or meeting link
  meeting_link TEXT, -- For online sessions
  attendance_tracking BOOLEAN DEFAULT TRUE,
  qr_token TEXT UNIQUE,
  qr_expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Auto-expire QR codes after session
CREATE OR REPLACE FUNCTION expire_qr_after_session()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.qr_expires_at IS NULL AND NEW.session_date IS NOT NULL THEN
    NEW.qr_expires_at := NEW.session_date + INTERVAL '2 hours';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_expire_qr ON live_sessions;
CREATE TRIGGER trigger_expire_qr
  BEFORE INSERT OR UPDATE ON live_sessions
  FOR EACH ROW
  EXECUTE FUNCTION expire_qr_after_session();

-- ============================================
-- 4. ENROLLMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS class_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  enrolled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Admin who manually added
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed')),
  UNIQUE(class_id, user_id)
);

-- ============================================
-- 5. SESSION ATTENDANCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS session_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  checkin_time TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  method TEXT NOT NULL CHECK (method IN ('qr', 'manual')),
  checked_in_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Admin/mentor who checked in
  UNIQUE(session_id, user_id)
);

-- ============================================
-- 6. ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS class_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES class_modules(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  submission_type TEXT NOT NULL CHECK (submission_type IN ('text', 'file', 'url', 'git')),
  max_file_size INTEGER, -- In bytes, for file submissions
  allowed_file_types TEXT[], -- e.g., ['pdf', 'zip', 'docx']
  lock_after_deadline BOOLEAN DEFAULT FALSE,
  xp_reward INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================
-- 7. ASSIGNMENT SUBMISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES class_assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  submission_content TEXT, -- For text submissions
  submission_url TEXT, -- For URL submissions
  submission_file_url TEXT, -- For file submissions
  git_url TEXT, -- For git submissions
  repo_directory TEXT, -- Optional directory in repo
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'late', 'reviewed', 'approved', 'changes_requested')),
  is_late BOOLEAN DEFAULT FALSE,
  feedback TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Auto-mark late submissions
CREATE OR REPLACE FUNCTION mark_late_submissions()
RETURNS TRIGGER AS $$
DECLARE
  assignment_due_date TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT due_date INTO assignment_due_date
  FROM class_assignments
  WHERE id = NEW.assignment_id;
  
  IF assignment_due_date IS NOT NULL AND NEW.submitted_at > assignment_due_date THEN
    NEW.is_late := TRUE;
    NEW.status := 'late';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_mark_late ON assignment_submissions;
CREATE TRIGGER trigger_mark_late
  BEFORE INSERT OR UPDATE ON assignment_submissions
  FOR EACH ROW
  EXECUTE FUNCTION mark_late_submissions();

-- ============================================
-- 8. ANNOUNCEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS class_announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  module_id UUID REFERENCES class_modules(id) ON DELETE CASCADE, -- Optional: target specific module
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  pinned BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================
-- 9. CLASS INSTRUCTORS TABLE (Many-to-Many)
-- ============================================
CREATE TABLE IF NOT EXISTS class_instructors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'mentor' CHECK (role IN ('mentor', 'assistant', 'ta')),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(class_id, instructor_id)
);

-- ============================================
-- 10. XP REWARDS CONFIGURATION
-- ============================================
CREATE TABLE IF NOT EXISTS class_xp_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('session_attendance', 'assignment_submission', 'assignment_approved', 'module_completion')),
  xp_amount INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(class_id, action_type)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_classes_instructor ON classes(instructor_id);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);
CREATE INDEX IF NOT EXISTS idx_classes_dates ON classes(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_class_modules_class ON class_modules(class_id);
CREATE INDEX IF NOT EXISTS idx_class_modules_dates ON class_modules(start_date);
CREATE INDEX IF NOT EXISTS idx_live_sessions_class ON live_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_module ON live_sessions(module_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class ON class_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON class_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON session_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON session_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_module ON class_assignments(module_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user ON assignment_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_announcements_class ON class_announcements(class_id);
CREATE INDEX IF NOT EXISTS idx_announcements_pinned ON class_announcements(pinned, created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_xp_config ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
-- Returns FALSE if users table doesn't exist or user not found (graceful degradation)
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if users table exists and has the user as admin
  RETURN EXISTS (
    SELECT 1 FROM users u WHERE u.id = is_admin.user_id AND u.is_admin = TRUE
  );
EXCEPTION
  WHEN undefined_table THEN
    -- If users table doesn't exist, return FALSE (graceful degradation)
    RETURN FALSE;
  WHEN OTHERS THEN
    -- On any other error, return FALSE
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is mentor of class
CREATE OR REPLACE FUNCTION is_class_instructor(user_id UUID, class_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM class_instructors ci
    WHERE ci.instructor_id = is_class_instructor.user_id AND ci.class_id = is_class_instructor.class_uuid
  ) OR EXISTS (
    SELECT 1 FROM classes c
    WHERE c.id = is_class_instructor.class_uuid AND c.instructor_id = is_class_instructor.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is enrolled in class
CREATE OR REPLACE FUNCTION is_enrolled(user_id UUID, class_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM class_enrollments ce
    WHERE ce.user_id = is_enrolled.user_id AND ce.class_id = is_enrolled.class_uuid AND ce.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Classes: Admins and mentors can manage, enrolled users can view
DROP POLICY IF EXISTS "Admins can manage classes" ON classes;
CREATE POLICY "Admins can manage classes"
  ON classes FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Mentors can manage their classes" ON classes;
CREATE POLICY "Mentors can manage their classes"
  ON classes FOR ALL
  USING (is_class_instructor(auth.uid(), id))
  WITH CHECK (is_class_instructor(auth.uid(), id));

-- Anyone can view published classes (for browsing before enrollment)
DROP POLICY IF EXISTS "Anyone can view published classes" ON classes;
CREATE POLICY "Anyone can view published classes"
  ON classes FOR SELECT
  USING (published = TRUE);

-- Class Modules: Admins and mentors can manage, enrolled users can view
DROP POLICY IF EXISTS "Admins and mentors can manage modules" ON class_modules;
CREATE POLICY "Admins and mentors can manage modules"
  ON class_modules FOR ALL
  USING (
    is_admin(auth.uid()) OR 
    EXISTS (SELECT 1 FROM classes WHERE id = class_id AND is_class_instructor(auth.uid(), id))
  )
  WITH CHECK (
    is_admin(auth.uid()) OR 
    EXISTS (SELECT 1 FROM classes WHERE id = class_id AND is_class_instructor(auth.uid(), id))
  );

DROP POLICY IF EXISTS "Enrolled users can view unlocked modules" ON class_modules;
CREATE POLICY "Enrolled users can view unlocked modules"
  ON class_modules FOR SELECT
  USING (
    locked = FALSE AND (
      is_enrolled(auth.uid(), class_id) OR 
      is_class_instructor(auth.uid(), class_id)
    )
  );

-- Live Sessions: Similar to modules
DROP POLICY IF EXISTS "Admins and mentors can manage sessions" ON live_sessions;
CREATE POLICY "Admins and mentors can manage sessions"
  ON live_sessions FOR ALL
  USING (
    is_admin(auth.uid()) OR 
    is_class_instructor(auth.uid(), class_id)
  )
  WITH CHECK (
    is_admin(auth.uid()) OR 
    is_class_instructor(auth.uid(), class_id)
  );

DROP POLICY IF EXISTS "Enrolled users can view sessions" ON live_sessions;
CREATE POLICY "Enrolled users can view sessions"
  ON live_sessions FOR SELECT
  USING (
    is_enrolled(auth.uid(), class_id) OR 
    is_class_instructor(auth.uid(), class_id)
  );

-- Enrollments: Admins can manage, users can view their own
DROP POLICY IF EXISTS "Admins can manage enrollments" ON class_enrollments;
CREATE POLICY "Admins can manage enrollments"
  ON class_enrollments FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Mentors can view enrollments" ON class_enrollments;
CREATE POLICY "Mentors can view enrollments"
  ON class_enrollments FOR SELECT
  USING (is_class_instructor(auth.uid(), class_id));

DROP POLICY IF EXISTS "Users can view own enrollment" ON class_enrollments;
CREATE POLICY "Users can view own enrollment"
  ON class_enrollments FOR SELECT
  USING (user_id = auth.uid());

-- Users can enroll themselves in published classes
DROP POLICY IF EXISTS "Users can enroll in published classes" ON class_enrollments;
CREATE POLICY "Users can enroll in published classes"
  ON class_enrollments FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM classes
      WHERE id = class_enrollments.class_id
      AND published = TRUE
      AND enrollment_locked = FALSE
    )
  );

-- Session Attendance: Admins and mentors can manage, users can view their own
DROP POLICY IF EXISTS "Admins and mentors can manage attendance" ON session_attendance;
CREATE POLICY "Admins and mentors can manage attendance"
  ON session_attendance FOR ALL
  USING (
    is_admin(auth.uid()) OR 
    is_class_instructor(auth.uid(), class_id)
  )
  WITH CHECK (
    is_admin(auth.uid()) OR 
    is_class_instructor(auth.uid(), class_id)
  );

DROP POLICY IF EXISTS "Users can view own attendance" ON session_attendance;
CREATE POLICY "Users can view own attendance"
  ON session_attendance FOR SELECT
  USING (user_id = auth.uid());

-- Assignments: Admins and mentors can manage, enrolled users can view
DROP POLICY IF EXISTS "Admins and mentors can manage assignments" ON class_assignments;
CREATE POLICY "Admins and mentors can manage assignments"
  ON class_assignments FOR ALL
  USING (
    is_admin(auth.uid()) OR 
    is_class_instructor(auth.uid(), class_id)
  )
  WITH CHECK (
    is_admin(auth.uid()) OR 
    is_class_instructor(auth.uid(), class_id)
  );

DROP POLICY IF EXISTS "Enrolled users can view assignments" ON class_assignments;
CREATE POLICY "Enrolled users can view assignments"
  ON class_assignments FOR SELECT
  USING (
    is_enrolled(auth.uid(), class_id) OR 
    is_class_instructor(auth.uid(), class_id)
  );

-- Submissions: Users can create their own, admins/mentors can view all
DROP POLICY IF EXISTS "Users can create own submissions" ON assignment_submissions;
CREATE POLICY "Users can create own submissions"
  ON assignment_submissions FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own submissions" ON assignment_submissions;
CREATE POLICY "Users can update own submissions"
  ON assignment_submissions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins and mentors can manage submissions" ON assignment_submissions;
CREATE POLICY "Admins and mentors can manage submissions"
  ON assignment_submissions FOR ALL
  USING (
    is_admin(auth.uid()) OR 
    is_class_instructor(auth.uid(), class_id)
  )
  WITH CHECK (
    is_admin(auth.uid()) OR 
    is_class_instructor(auth.uid(), class_id)
  );

DROP POLICY IF EXISTS "Users can view own submissions" ON assignment_submissions;
CREATE POLICY "Users can view own submissions"
  ON assignment_submissions FOR SELECT
  USING (user_id = auth.uid());

-- Announcements: Admins and mentors can manage, enrolled users can view
DROP POLICY IF EXISTS "Admins and mentors can manage announcements" ON class_announcements;
CREATE POLICY "Admins and mentors can manage announcements"
  ON class_announcements FOR ALL
  USING (
    is_admin(auth.uid()) OR 
    is_class_instructor(auth.uid(), class_id)
  )
  WITH CHECK (
    is_admin(auth.uid()) OR 
    is_class_instructor(auth.uid(), class_id)
  );

DROP POLICY IF EXISTS "Enrolled users can view announcements" ON class_announcements;
CREATE POLICY "Enrolled users can view announcements"
  ON class_announcements FOR SELECT
  USING (
    is_enrolled(auth.uid(), class_id) OR 
    is_class_instructor(auth.uid(), class_id)
  );

-- Class Instructors: Admins can manage
DROP POLICY IF EXISTS "Admins can manage class mentors" ON class_instructors;
CREATE POLICY "Admins can manage class mentors"
  ON class_instructors FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- XP Config: Admins can manage
DROP POLICY IF EXISTS "Admins can manage XP config" ON class_xp_config;
CREATE POLICY "Admins can manage XP config"
  ON class_xp_config FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- ============================================
-- GRANTS
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_classes_updated_at ON classes;
CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON classes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_class_modules_updated_at ON class_modules;
CREATE TRIGGER update_class_modules_updated_at
  BEFORE UPDATE ON class_modules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_live_sessions_updated_at ON live_sessions;
CREATE TRIGGER update_live_sessions_updated_at
  BEFORE UPDATE ON live_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assignments_updated_at ON class_assignments;
CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON class_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_submissions_updated_at ON assignment_submissions;
CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON assignment_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_announcements_updated_at ON class_announcements;
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON class_announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_xp_config_updated_at ON class_xp_config;
CREATE TRIGGER update_xp_config_updated_at
  BEFORE UPDATE ON class_xp_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

