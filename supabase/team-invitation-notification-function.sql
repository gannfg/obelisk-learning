-- Create a database function to create team invitation notifications
-- This uses SECURITY DEFINER to bypass RLS and allow any authenticated user
-- to create notifications for team invitations

CREATE OR REPLACE FUNCTION create_team_invitation_notification(
  invitee_user_id UUID,
  team_id UUID,
  inviter_user_id UUID,
  invitation_id UUID,
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
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    link,
    metadata
  )
  VALUES (
    invitee_user_id,
    'team',
    'Team Invitation',
    inviter_name || ' invited you to join ' || team_name,
    '/notifications',
    jsonb_build_object(
      'invitation_id', invitation_id::text,
      'team_id', team_id::text,
      'inviter_id', inviter_user_id::text,
      'type', 'team_invitation'
    )
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and return NULL
    RAISE WARNING 'Error creating team invitation notification: %', SQLERRM;
    RETURN NULL;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_team_invitation_notification(UUID, UUID, UUID, UUID, TEXT, TEXT) TO authenticated;

-- Also update the RLS policy to be more permissive for team invitations
-- This allows team members to create notifications for invitations
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

CREATE POLICY "System can create notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (
    -- Allow creating notifications for yourself
    auth.uid() = user_id
    OR
    -- Allow creating team invitation notifications
    (type = 'team' AND metadata->>'type' = 'team_invitation')
  );

