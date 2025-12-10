-- Update RLS policies for team_members to allow users to add themselves when accepting invitations
-- This allows users to join teams when they accept invitations

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Team owners/admins can add members" ON team_members;
DROP POLICY IF EXISTS "Users can join teams via invitation" ON team_members;

-- Policy 1: Team owners/admins can add members
CREATE POLICY "Team owners/admins can add members"
  ON team_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

-- Policy 2: Users can add themselves when accepting an invitation
-- This checks that there's a pending invitation for this user
CREATE POLICY "Users can join teams via invitation"
  ON team_members
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM team_invitations ti
      WHERE ti.team_id = team_members.team_id
      AND ti.invitee_id = auth.uid()
      AND ti.status = 'pending'
    )
  );

-- Alternative simpler policy (if the above is too restrictive):
-- Uncomment this and comment out the above if needed:
/*
DROP POLICY IF EXISTS "Users can join teams via invitation" ON team_members;

CREATE POLICY "Users can join teams via invitation"
  ON team_members
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );
*/

