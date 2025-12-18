-- Notification Triggers and Helper Functions
-- These triggers automatically create notifications for various events

-- ============================================
-- WELCOME NOTIFICATION TRIGGER
-- ============================================
-- Trigger to create welcome notification when a new user signs up
CREATE OR REPLACE FUNCTION trigger_welcome_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create welcome notification for new user
  PERFORM create_welcome_notification(NEW.id);
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_notification ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created_notification
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_welcome_notification();

-- ============================================
-- TEAM INVITATION NOTIFICATIONS
-- ============================================
-- Function to create team invitation notification
CREATE OR REPLACE FUNCTION create_team_invitation_notification(
  invited_user_id UUID,
  team_id UUID,
  team_name TEXT,
  inviter_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  VALUES (
    invited_user_id,
    'invitation',
    'Team Invitation',
    inviter_name || ' invited you to join the team "' || team_name || '"',
    '/academy/teams/' || team_id::TEXT,
    jsonb_build_object(
      'team_id', team_id,
      'team_name', team_name,
      'inviter_name', inviter_name
    )
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Trigger when a user is added to a team
CREATE OR REPLACE FUNCTION trigger_team_member_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  team_name_val TEXT;
  inviter_name_val TEXT;
BEGIN
  -- Get team name
  SELECT name INTO team_name_val FROM teams WHERE id = NEW.team_id;
  
  -- Get inviter name (if available)
  SELECT COALESCE(first_name || ' ' || last_name, email, 'Someone')
  INTO inviter_name_val
  FROM users
  WHERE id = NEW.user_id
  LIMIT 1;
  
  -- Only create notification if user is not the creator
  IF NEW.user_id != (SELECT created_by FROM teams WHERE id = NEW.team_id) THEN
    PERFORM create_team_invitation_notification(
      NEW.user_id,
      NEW.team_id,
      COALESCE(team_name_val, 'Unknown Team'),
      COALESCE(inviter_name_val, 'Someone')
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Note: This trigger should be added to the team_members table in the learning Supabase
-- Since team_members is in the learning database, we'll create a separate migration

-- ============================================
-- PROJECT INVITATION NOTIFICATIONS
-- ============================================
-- Function to create project invitation notification
CREATE OR REPLACE FUNCTION create_project_invitation_notification(
  invited_user_id UUID,
  project_id UUID,
  project_title TEXT,
  inviter_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  VALUES (
    invited_user_id,
    'invitation',
    'Project Invitation',
    inviter_name || ' invited you to join the project "' || project_title || '"',
    '/academy/projects/' || project_id::TEXT,
    jsonb_build_object(
      'project_id', project_id,
      'project_title', project_title,
      'inviter_name', inviter_name
    )
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- ============================================
-- COURSE COMPLETION NOTIFICATIONS
-- ============================================
-- Function to create course completion notification
CREATE OR REPLACE FUNCTION create_course_completion_notification(
  user_id UUID,
  course_id UUID,
  course_title TEXT,
  badge_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  VALUES (
    user_id,
    'course',
    'Course Completed! 🎉',
    'Congratulations! You completed the course "' || course_title || '" and earned the "' || badge_name || '" badge!',
    '/academy/courses/' || course_id::TEXT,
    jsonb_build_object(
      'course_id', course_id,
      'course_title', course_title,
      'badge_name', badge_name
    )
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- ============================================
-- BADGE EARNED NOTIFICATIONS
-- ============================================
-- Function to create badge earned notification
CREATE OR REPLACE FUNCTION create_badge_notification(
  user_id UUID,
  course_id UUID,
  course_title TEXT,
  badge_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  VALUES (
    user_id,
    'badge',
    'Badge Earned! 🏆',
    'You earned the "' || badge_name || '" badge for completing "' || course_title || '"!',
    '/profile',
    jsonb_build_object(
      'course_id', course_id,
      'course_title', course_title,
      'badge_name', badge_name
    )
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- ============================================
-- NEW COURSE NOTIFICATIONS
-- ============================================
-- Function to notify users about new courses (for admins to use)
CREATE OR REPLACE FUNCTION notify_new_course(
  course_id UUID,
  course_title TEXT,
  course_category TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_count INTEGER;
BEGIN
  -- Create notifications for all enrolled users (or all users if you want)
  -- For now, this is a placeholder - you can customize who gets notified
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  SELECT
    id,
    'course',
    'New Course Available! 📚',
    'A new course "' || course_title || '" in ' || course_category || ' is now available!',
    '/academy/courses/' || course_id::TEXT,
    jsonb_build_object(
      'course_id', course_id,
      'course_title', course_title,
      'course_category', course_category
    )
  FROM users
  WHERE id IN (
    -- Only notify users who have enrolled in at least one course
    SELECT DISTINCT user_id FROM enrollments
  );
  
  GET DIAGNOSTICS notification_count = ROW_COUNT;
  RETURN notification_count;
END;
$$;

-- ============================================
-- ASSIGNMENT NOTIFICATIONS
-- ============================================
-- Function to create assignment notification
CREATE OR REPLACE FUNCTION create_assignment_notification(
  user_id UUID,
  assignment_id UUID,
  assignment_title TEXT,
  course_title TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  VALUES (
    user_id,
    'assignment',
    'New Assignment',
    'A new assignment "' || assignment_title || '" has been added to "' || course_title || '"',
    '/academy/courses/' || assignment_id::TEXT || '/assignments',
    jsonb_build_object(
      'assignment_id', assignment_id,
      'assignment_title', assignment_title,
      'course_title', course_title
    )
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- ============================================
-- SUBMISSION FEEDBACK NOTIFICATIONS
-- ============================================
-- Function to create submission feedback notification
CREATE OR REPLACE FUNCTION create_submission_feedback_notification(
  user_id UUID,
  submission_id UUID,
  submission_title TEXT,
  reviewer_name TEXT,
  feedback_summary TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  VALUES (
    user_id,
    'submission',
    'Submission Reviewed',
    reviewer_name || ' reviewed your submission "' || submission_title || '". ' || COALESCE(feedback_summary, 'Check it out!'),
    '/dashboard?tab=submissions',
    jsonb_build_object(
      'submission_id', submission_id,
      'submission_title', submission_title,
      'reviewer_name', reviewer_name,
      'feedback_summary', feedback_summary
    )
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- ============================================
-- MESSAGE NOTIFICATIONS
-- ============================================
-- Function to create message notification
CREATE OR REPLACE FUNCTION create_message_notification(
  recipient_id UUID,
  sender_id UUID,
  sender_name TEXT,
  message_preview TEXT,
  conversation_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  VALUES (
    recipient_id,
    'message',
    'New Message from ' || sender_name,
    message_preview,
    '/messages/' || conversation_id::TEXT,
    jsonb_build_object(
      'sender_id', sender_id,
      'sender_name', sender_name,
      'conversation_id', conversation_id
    )
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_team_invitation_notification(UUID, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_project_invitation_notification(UUID, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_course_completion_notification(UUID, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_badge_notification(UUID, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION notify_new_course(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_assignment_notification(UUID, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_submission_feedback_notification(UUID, UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_message_notification(UUID, UUID, TEXT, TEXT, UUID) TO authenticated;

