-- Teams and Projects Database Schema
-- Run this SQL in your Supabase SQL editor to create the necessary tables
-- IMPORTANT: Tables must be created in this order due to foreign key dependencies

-- Teams table (created first - no dependencies)
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  avatar TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Team members table (depends on teams)
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Projects table (depends on teams)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  thumbnail TEXT,
  status TEXT NOT NULL CHECK (status IN ('planning', 'in-progress', 'completed', 'archived')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  tags TEXT[] DEFAULT '{}',
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  repository_url TEXT,
  live_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project members table (depends on projects)
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_team_id ON projects(team_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_teams_created_by ON teams(created_by);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Policies for projects
CREATE POLICY "Users can view all projects"
  ON projects FOR SELECT
  USING (true);

CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = created_by OR auth.uid() IN (
    SELECT user_id FROM project_members 
    WHERE project_id = projects.id AND role IN ('owner', 'admin')
  ));

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = created_by);

-- Policies for project_members
CREATE POLICY "Users can view project members"
  ON project_members FOR SELECT
  USING (true);

CREATE POLICY "Project owners/admins can add members"
  ON project_members FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT created_by FROM projects WHERE id = project_id
      UNION
      SELECT user_id FROM project_members 
      WHERE project_id = project_members.project_id AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can leave projects"
  ON project_members FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT created_by FROM projects WHERE id = project_id
    UNION
    SELECT user_id FROM project_members 
    WHERE project_id = project_members.project_id AND role IN ('owner', 'admin')
  ));

-- Policies for teams
CREATE POLICY "Users can view all teams"
  ON teams FOR SELECT
  USING (true);

CREATE POLICY "Users can create teams"
  ON teams FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team owners/admins can update teams"
  ON teams FOR UPDATE
  USING (auth.uid() = created_by OR auth.uid() IN (
    SELECT user_id FROM team_members 
    WHERE team_id = teams.id AND role IN ('owner', 'admin')
  ));

CREATE POLICY "Team owners can delete teams"
  ON teams FOR DELETE
  USING (auth.uid() = created_by);

-- Policies for team_members
CREATE POLICY "Users can view team members"
  ON team_members FOR SELECT
  USING (true);

CREATE POLICY "Team owners/admins can add members"
  ON team_members FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT created_by FROM teams WHERE id = team_id
      UNION
      SELECT user_id FROM team_members 
      WHERE team_id = team_members.team_id AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can leave teams"
  ON team_members FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT created_by FROM teams WHERE id = team_id
    UNION
    SELECT user_id FROM team_members 
    WHERE team_id = team_members.team_id AND role IN ('owner', 'admin')
  ));

