-- Fix RLS policy to allow team creators to add themselves as members during team creation
-- This ensures that when a team is created, the creator can immediately add themselves as a member

-- Drop the existing policy
DROP POLICY IF EXISTS "Team owners/admins can add members" ON team_members;

-- Create updated policy that explicitly allows team creators to add themselves
CREATE POLICY "Team owners/admins can add members"
  ON team_members
  FOR INSERT
  WITH CHECK (
    -- Allow if user is the creator of the team
    auth.uid() IN (
      SELECT created_by FROM teams WHERE id = team_id
    )
    OR
    -- Allow if user is already an owner/admin of the team
    auth.uid() IN (
      SELECT user_id FROM team_members 
      WHERE team_id = team_members.team_id AND role IN ('owner', 'admin')
    )
  );
