-- Create a database function to accept team invitations
-- This uses SECURITY DEFINER to bypass RLS and allows users to add themselves to teams
-- when accepting invitations

CREATE OR REPLACE FUNCTION accept_team_invitation(invitation_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation RECORD;
  v_user_id UUID;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Get the invitation
  SELECT * INTO v_invitation
  FROM team_invitations
  WHERE id = invitation_id
    AND invitee_id = v_user_id
    AND status = 'pending';

  IF NOT FOUND THEN
    -- Check if invitation exists but is already processed
    SELECT * INTO v_invitation
    FROM team_invitations
    WHERE id = invitation_id
      AND invitee_id = v_user_id;
    
    IF FOUND THEN
      -- Invitation exists but was already processed
      -- Check if user is already a member
      IF EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = v_invitation.team_id
        AND user_id = v_user_id
      ) THEN
        RETURN TRUE; -- Already processed successfully
      END IF;
    END IF;
    
    RAISE EXCEPTION 'Invitation not found or already processed';
  END IF;

  -- Delete any existing accepted invitations for this team/user
  -- This handles the unique constraint on (team_id, invitee_id, status)
  -- We need to do this BEFORE updating to avoid constraint violations
  DELETE FROM team_invitations
  WHERE team_id = v_invitation.team_id
    AND invitee_id = v_user_id
    AND status = 'accepted'
    AND id != invitation_id;

  -- Delete any other pending invitations for this team/user to avoid conflicts
  -- (Only keep the one being accepted)
  DELETE FROM team_invitations
  WHERE team_id = v_invitation.team_id
    AND invitee_id = v_user_id
    AND status = 'pending'
    AND id != invitation_id;

  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = v_invitation.team_id
    AND user_id = v_user_id
  ) THEN
    -- User is already a member, just update invitation status
    UPDATE team_invitations
    SET status = 'accepted', updated_at = NOW()
    WHERE id = invitation_id;
    RETURN TRUE;
  END IF;

  -- Update invitation status to accepted
  UPDATE team_invitations
  SET status = 'accepted', updated_at = NOW()
  WHERE id = invitation_id;

  -- Add user to team
  INSERT INTO team_members (team_id, user_id, role, joined_at)
  VALUES (v_invitation.team_id, v_user_id, 'member', NOW())
  ON CONFLICT (team_id, user_id) DO NOTHING;

  RETURN TRUE;
EXCEPTION
  WHEN unique_violation THEN
    -- Unique constraint violation - invitation might already be accepted
    -- Check if user is already a member
    IF EXISTS (
      SELECT 1 FROM team_members
      WHERE team_id = v_invitation.team_id
      AND user_id = v_user_id
    ) THEN
      -- User is already a member, check if there's an accepted invitation
      IF EXISTS (
        SELECT 1 FROM team_invitations
        WHERE team_id = v_invitation.team_id
        AND invitee_id = v_user_id
        AND status = 'accepted'
      ) THEN
        RETURN TRUE; -- Already processed successfully
      END IF;
    END IF;
    RAISE WARNING 'Unique constraint violation accepting team invitation: %', SQLERRM;
    RETURN FALSE;
  WHEN OTHERS THEN
    -- Log the error and return FALSE
    RAISE WARNING 'Error accepting team invitation: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION accept_team_invitation(UUID) TO authenticated;

