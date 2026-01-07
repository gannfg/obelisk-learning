-- ============================================
-- MENTOR ROLE SYSTEM SETUP
-- Run this in Learning Supabase SQL Editor
-- ============================================

-- Add email column if it doesn't exist (some setups may have it)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add is_mentor column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_mentor BOOLEAN NOT NULL DEFAULT FALSE;

-- Enable RLS on users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage users" ON users;
DROP POLICY IF EXISTS "Users can view own record" ON users;
DROP POLICY IF EXISTS "Users can insert own record" ON users;

-- Policy: Admins can manage all users (insert, update, delete, select)
CREATE POLICY "Admins can manage users"
  ON users FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Policy: Users can view their own record
CREATE POLICY "Users can view own record"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can insert their own record (for initial sync)
CREATE POLICY "Users can insert own record"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create index for faster mentor lookups
CREATE INDEX IF NOT EXISTS idx_users_is_mentor ON users(is_mentor) WHERE is_mentor = TRUE;

-- Helper function to check if user is mentor
CREATE OR REPLACE FUNCTION is_mentor(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = is_mentor.user_id AND u.is_mentor = TRUE
  );
EXCEPTION
  WHEN undefined_table THEN
    RETURN FALSE;
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is class creator
CREATE OR REPLACE FUNCTION is_class_creator(user_id UUID, class_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM classes c
    WHERE c.id = is_class_creator.class_uuid 
    AND c.created_by = is_class_creator.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update is_class_instructor to enforce mentor restrictions
CREATE OR REPLACE FUNCTION is_class_instructor(user_id UUID, class_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- If user is admin, they can manage all classes
  IF is_admin(is_class_instructor.user_id) THEN
    RETURN TRUE;
  END IF;
  
  -- If user is mentor, they can only manage classes they created
  IF is_mentor(is_class_instructor.user_id) THEN
    RETURN is_class_creator(is_class_instructor.user_id, is_class_instructor.class_uuid);
  END IF;
  
  -- Otherwise, check if they're assigned as instructor (for backward compatibility)
  RETURN EXISTS (
    SELECT 1 FROM class_instructors ci
    WHERE ci.instructor_id = is_class_instructor.user_id 
    AND ci.class_id = is_class_instructor.class_uuid
  ) OR EXISTS (
    SELECT 1 FROM classes c
    WHERE c.id = is_class_instructor.class_uuid 
    AND c.instructor_id = is_class_instructor.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policy: Mentors can only manage classes they created
DROP POLICY IF EXISTS "Mentors can manage their classes" ON classes;
CREATE POLICY "Mentors can manage their classes"
  ON classes FOR ALL
  USING (
    is_mentor(auth.uid()) AND is_class_creator(auth.uid(), id)
  )
  WITH CHECK (
    is_mentor(auth.uid()) AND is_class_creator(auth.uid(), id)
  );

-- Update modules policy
DROP POLICY IF EXISTS "Admins and mentors can manage modules" ON class_modules;
CREATE POLICY "Admins and mentors can manage modules"
  ON class_modules FOR ALL
  USING (
    is_admin(auth.uid()) OR 
    (is_mentor(auth.uid()) AND EXISTS (
      SELECT 1 FROM classes 
      WHERE id = class_id 
      AND is_class_creator(auth.uid(), id)
    ))
  )
  WITH CHECK (
    is_admin(auth.uid()) OR 
    (is_mentor(auth.uid()) AND EXISTS (
      SELECT 1 FROM classes 
      WHERE id = class_id 
      AND is_class_creator(auth.uid(), id)
    ))
  );

-- Update live sessions policy
DROP POLICY IF EXISTS "Admins and mentors can manage sessions" ON live_sessions;
CREATE POLICY "Admins and mentors can manage sessions"
  ON live_sessions FOR ALL
  USING (
    is_admin(auth.uid()) OR 
    (is_mentor(auth.uid()) AND EXISTS (
      SELECT 1 FROM classes 
      WHERE id = class_id 
      AND is_class_creator(auth.uid(), id)
    ))
  )
  WITH CHECK (
    is_admin(auth.uid()) OR 
    (is_mentor(auth.uid()) AND EXISTS (
      SELECT 1 FROM classes 
      WHERE id = class_id 
      AND is_class_creator(auth.uid(), id)
    ))
  );

-- Update assignments policy
DROP POLICY IF EXISTS "Admins and mentors can manage assignments" ON class_assignments;
CREATE POLICY "Admins and mentors can manage assignments"
  ON class_assignments FOR ALL
  USING (
    is_admin(auth.uid()) OR 
    (is_mentor(auth.uid()) AND EXISTS (
      SELECT 1 FROM classes 
      WHERE id = class_id 
      AND is_class_creator(auth.uid(), id)
    ))
  )
  WITH CHECK (
    is_admin(auth.uid()) OR 
    (is_mentor(auth.uid()) AND EXISTS (
      SELECT 1 FROM classes 
      WHERE id = class_id 
      AND is_class_creator(auth.uid(), id)
    ))
  );

-- Update submissions policy
DROP POLICY IF EXISTS "Admins and mentors can manage submissions" ON assignment_submissions;
CREATE POLICY "Admins and mentors can manage submissions"
  ON assignment_submissions FOR ALL
  USING (
    is_admin(auth.uid()) OR 
    (is_mentor(auth.uid()) AND EXISTS (
      SELECT 1 FROM classes 
      WHERE id = class_id 
      AND is_class_creator(auth.uid(), id)
    ))
  )
  WITH CHECK (
    is_admin(auth.uid()) OR 
    (is_mentor(auth.uid()) AND EXISTS (
      SELECT 1 FROM classes 
      WHERE id = class_id 
      AND is_class_creator(auth.uid(), id)
    ))
  );

-- Update announcements policy
DROP POLICY IF EXISTS "Admins and mentors can manage announcements" ON class_announcements;
CREATE POLICY "Admins and mentors can manage announcements"
  ON class_announcements FOR ALL
  USING (
    is_admin(auth.uid()) OR 
    (is_mentor(auth.uid()) AND EXISTS (
      SELECT 1 FROM classes 
      WHERE id = class_id 
      AND is_class_creator(auth.uid(), id)
    ))
  )
  WITH CHECK (
    is_admin(auth.uid()) OR 
    (is_mentor(auth.uid()) AND EXISTS (
      SELECT 1 FROM classes 
      WHERE id = class_id 
      AND is_class_creator(auth.uid(), id)
    ))
  );

-- Update session attendance policy
DROP POLICY IF EXISTS "Admins and mentors can manage attendance" ON session_attendance;
CREATE POLICY "Admins and mentors can manage attendance"
  ON session_attendance FOR ALL
  USING (
    is_admin(auth.uid()) OR 
    (is_mentor(auth.uid()) AND EXISTS (
      SELECT 1 FROM classes 
      WHERE id = class_id 
      AND is_class_creator(auth.uid(), id)
    ))
  )
  WITH CHECK (
    is_admin(auth.uid()) OR 
    (is_mentor(auth.uid()) AND EXISTS (
      SELECT 1 FROM classes 
      WHERE id = class_id 
      AND is_class_creator(auth.uid(), id)
    ))
  );

-- Update enrollments view policy for mentors
DROP POLICY IF EXISTS "Mentors can view enrollments" ON class_enrollments;
CREATE POLICY "Mentors can view enrollments"
  ON class_enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE id = class_id 
      AND is_class_creator(auth.uid(), id)
    )
  );

