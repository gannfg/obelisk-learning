-- Fix RLS policy for team_invitations to allow invitees to update their invitations
-- This ensures users can accept/reject invitations

-- Drop existing UPDATE policy
DROP POLICY IF EXISTS "Invitees can update their invitations" ON team_invitations;

-- Create a permissive UPDATE policy
-- USING: allows selecting rows where user is the invitee
-- WITH CHECK: allows updates where user remains the invitee and status change is valid
CREATE POLICY "Invitees can update their invitations"
  ON team_invitations
  FOR UPDATE
  USING (auth.uid() = invitee_id)
  WITH CHECK (auth.uid() = invitee_id);

