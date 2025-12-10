-- Team Invitations Schema
-- This table stores team invitation records

CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL,
  invitee_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, invitee_id, status) DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_team_invitations_team_id ON team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_invitee_id ON team_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status);
CREATE INDEX IF NOT EXISTS idx_team_invitations_pending ON team_invitations(invitee_id, status) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own invitations" ON team_invitations;
CREATE POLICY "Users can view their own invitations"
  ON team_invitations
  FOR SELECT
  USING (auth.uid() = invitee_id OR auth.uid() = inviter_id);

DROP POLICY IF EXISTS "Team members can create invitations" ON team_invitations;
CREATE POLICY "Team members can create invitations"
  ON team_invitations
  FOR INSERT
  WITH CHECK (
    auth.uid() = inviter_id AND
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_invitations.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Invitees can update their invitations" ON team_invitations;
CREATE POLICY "Invitees can update their invitations"
  ON team_invitations
  FOR UPDATE
  USING (auth.uid() = invitee_id)
  WITH CHECK (auth.uid() = invitee_id);

DROP POLICY IF EXISTS "Invitees can delete their invitations" ON team_invitations;
CREATE POLICY "Invitees can delete their invitations"
  ON team_invitations
  FOR DELETE
  USING (auth.uid() = invitee_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_team_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_team_invitations_updated_at_trigger ON team_invitations;
CREATE TRIGGER update_team_invitations_updated_at_trigger
  BEFORE UPDATE ON team_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_team_invitations_updated_at();

