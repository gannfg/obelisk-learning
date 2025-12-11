-- Classroom System Notifications
-- Creates notifications for class students: weekly reminders, assignment reminders, announcements, etc.
--
-- IMPORTANT: This migration should be run in AUTH SUPABASE (where notifications table exists)
-- The classroom tables are in LEARNING SUPABASE, so we use application-level notifications
-- instead of database triggers that cross databases.

-- ============================================
-- 1. ADD 'class' NOTIFICATION TYPE
-- ============================================
-- Update notifications table to include 'class' type
-- Run this in AUTH SUPABASE
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'welcome',
  'message',
  'invitation',
  'submission',
  'assignment',
  'course',
  'class',  -- New type for classroom notifications
  'achievement',
  'feedback',
  'team',
  'project',
  'badge',
  'system'
));

-- ============================================
-- 2. FUNCTION: NOTIFY ALL ENROLLED STUDENTS
-- ============================================
CREATE OR REPLACE FUNCTION notify_class_students(
  p_class_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  v_enrollment RECORD;
BEGIN
  -- Loop through all active enrollments for the class
  FOR v_enrollment IN
    SELECT user_id
    FROM class_enrollments
    WHERE class_id = p_class_id
      AND status = 'active'
  LOOP
    -- Insert notification for each enrolled student
    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    VALUES (
      v_enrollment.user_id,
      p_type,
      p_title,
      p_message,
      p_link,
      jsonb_build_object('class_id', p_class_id) || p_metadata
    );
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$;

-- ============================================
-- 3. NOTE: TRIGGERS CANNOT CROSS DATABASES
-- ============================================
-- Since notifications table is in Auth Supabase and classroom tables are in Learning Supabase,
-- we cannot use database triggers. Instead, notifications are sent from application code.
-- 
-- See lib/classroom-notifications.ts for application-level notification functions.
-- 
-- The functions below are kept for reference but should be run in LEARNING SUPABASE
-- if you want to use them with dblink or similar cross-database solutions.

-- ============================================
-- 4. APPLICATION-LEVEL NOTIFICATIONS
-- ============================================
-- Notifications are sent from application code using lib/classroom-notifications.ts
-- This ensures they work across the Auth and Learning Supabase instances.

-- ============================================
-- 5. APPLICATION-LEVEL NOTIFICATIONS (CONTINUED)
-- ============================================
-- Assignment graded notifications are sent from application code
-- See lib/classroom-notifications.ts notifyAssignmentGraded()

-- ============================================
-- 6. FUNCTION: WEEKLY CLASS REMINDER
-- ============================================
-- This function should be run in LEARNING SUPABASE
-- It queries classroom data and returns module info for reminders
-- The application code then sends notifications using Auth Supabase
CREATE OR REPLACE FUNCTION get_upcoming_modules_for_reminders()
RETURNS TABLE (
  module_id UUID,
  class_id UUID,
  class_title TEXT,
  week_number INTEGER,
  module_title TEXT,
  start_date TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.class_id,
    c.title,
    m.week_number,
    m.title,
    m.start_date
  FROM class_modules m
  JOIN classes c ON c.id = m.class_id
  WHERE m.start_date IS NOT NULL
    AND m.start_date > NOW()
    AND m.start_date <= NOW() + INTERVAL '24 hours'
    AND m.is_released = FALSE;
END;
$$;

-- ============================================
-- 7. FUNCTION: ASSIGNMENT REMINDERS
-- ============================================
-- This function should be run in LEARNING SUPABASE
-- It queries assignment data and returns info for reminders
-- The application code then sends notifications using Auth Supabase
CREATE OR REPLACE FUNCTION get_upcoming_assignments_for_reminders()
RETURNS TABLE (
  assignment_id UUID,
  class_id UUID,
  class_title TEXT,
  assignment_title TEXT,
  due_date TIMESTAMPTZ,
  user_id UUID,
  hours_until_due NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.class_id,
    c.title,
    a.title,
    a.due_date,
    ce.user_id,
    EXTRACT(EPOCH FROM (a.due_date - NOW())) / 3600 as hours_until_due
  FROM class_assignments a
  JOIN classes c ON c.id = a.class_id
  JOIN class_enrollments ce ON ce.class_id = a.class_id AND ce.status = 'active'
  WHERE a.due_date > NOW()
    AND a.due_date <= NOW() + INTERVAL '48 hours'
    AND EXTRACT(EPOCH FROM (a.due_date - NOW())) / 3600 BETWEEN 24 AND 48
    AND NOT EXISTS (
      SELECT 1
      FROM assignment_submissions s
      WHERE s.assignment_id = a.id
        AND s.user_id = ce.user_id
    );
END;
$$;

-- ============================================
-- 8. APPLICATION-LEVEL NOTIFICATIONS (CONTINUED)
-- ============================================
-- Module released notifications are sent from application code
-- See lib/classroom-notifications.ts notifyModuleReleased()

-- ============================================
-- 9. GRANTS (LEARNING SUPABASE)
-- ============================================
-- Run these grants in LEARNING SUPABASE
GRANT EXECUTE ON FUNCTION get_upcoming_modules_for_reminders() TO authenticated;
GRANT EXECUTE ON FUNCTION get_upcoming_assignments_for_reminders() TO authenticated;

-- ============================================
-- 10. COMMENTS
-- ============================================
COMMENT ON FUNCTION get_upcoming_modules_for_reminders IS 'Returns modules starting in the next 24 hours for reminder notifications. Run in Learning Supabase.';
COMMENT ON FUNCTION get_upcoming_assignments_for_reminders IS 'Returns assignments due in 24-48 hours for reminder notifications. Run in Learning Supabase.';

-- ============================================
-- 11. APPLICATION INTEGRATION
-- ============================================
-- To send notifications from application code:
-- 1. Use functions from lib/classroom-notifications.ts
-- 2. Call notifyNewAnnouncement() when creating announcements
-- 3. Call notifyNewAssignment() when creating assignments  
-- 4. Call notifyAssignmentGraded() when grading submissions
-- 5. Call notifyModuleReleased() when releasing modules
-- 6. Use API endpoint /api/classroom/reminders for scheduled reminders

