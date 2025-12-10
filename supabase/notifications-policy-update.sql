-- Update RLS policies to allow team members to create notifications for invitees
-- This allows users to send team invitation notifications to other users

-- Drop the conflicting "Users can insert own notifications" policy
-- We'll replace it with a more permissive one
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;

-- Create a new policy that allows:
-- 1. Users to create notifications for themselves
-- 2. Users to create team invitation notifications (when they're team members/owners)
CREATE POLICY "Users can create notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (
    -- Users can create notifications for themselves
    auth.uid() = user_id
    OR
    -- Users can create team invitation notifications for others
    (
      type = 'team' 
      AND metadata->>'type' = 'team_invitation'
      AND EXISTS (
        -- Check that the inviter is a member/owner/admin of the team
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = (metadata->>'team_id')::uuid
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin', 'member')
      )
    )
  );

-- Alternative: If the above is too complex, use this simpler version that allows
-- any authenticated user to create notifications for team invitations
-- Uncomment this and comment out the above if the team_members check causes issues:

/*
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;

CREATE POLICY "Users can create notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR 
    (type = 'team' AND metadata->>'type' = 'team_invitation')
  );
*/

