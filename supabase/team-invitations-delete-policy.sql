-- Add delete policy for team_invitations
-- This allows invitees to delete their own invitations (useful for cleaning up duplicates)

DROP POLICY IF EXISTS "Invitees can delete their invitations" ON team_invitations;
CREATE POLICY "Invitees can delete their invitations"
  ON team_invitations
  FOR DELETE
  USING (auth.uid() = invitee_id);

