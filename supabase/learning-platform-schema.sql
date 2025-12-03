-- Learning Platform Interactive Features Schema
-- Extends the existing courses/lessons schema with missions, sandboxes, snapshots, and AI features
--
-- NOTE: This schema can run independently. The missions table has an optional lesson_id
-- reference that will only be enforced if the lessons table exists. If you haven't
-- run the base schema.sql yet, missions will work fine without it.
--
-- To link missions to lessons (optional):
-- 1. Run supabase/schema.sql first to create lessons table
-- 2. Then run this schema
-- 3. The foreign key will be automatically added if lessons table exists

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Missions table: Atomic, goal-oriented lessons
-- Note: lesson_id is optional - missions can exist independently or be linked to lessons
CREATE TABLE IF NOT EXISTS missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID, -- Optional reference to lessons table (if it exists)
  title TEXT NOT NULL,
  goal TEXT NOT NULL, -- Short mission goal (e.g., "Add server-side validation to the API")
  description TEXT,
  image_url TEXT, -- Optional thumbnail / cover image for mission
  initial_files JSONB DEFAULT '{}', -- { "file.js": "// code", "package.json": "{}" }
  stack_type TEXT NOT NULL CHECK (stack_type IN ('nextjs', 'python', 'solana', 'node', 'react', 'other')),
  difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_time INTEGER, -- in minutes
  order_index INTEGER NOT NULL DEFAULT 0,
  badge_id UUID, -- Reference to badges table (optional)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add foreign key constraint only if lessons table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lessons') THEN
    -- Add foreign key constraint if lessons table exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'missions_lesson_id_fkey' 
      AND table_name = 'missions'
    ) THEN
      ALTER TABLE missions 
      ADD CONSTRAINT missions_lesson_id_fkey 
      FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Mission content (markdown-based lesson content with checklist)
CREATE TABLE IF NOT EXISTS mission_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  markdown_content TEXT NOT NULL,
  checklist JSONB DEFAULT '[]', -- [{"text": "Add validation", "completed": false}]
  advanced_tips TEXT, -- Hidden until requested
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(mission_id)
);

-- User sandboxes: Persistent workspaces per user per mission
CREATE TABLE IF NOT EXISTS sandboxes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  files JSONB DEFAULT '{}', -- Current state of files
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, mission_id)
);

-- Snapshots: Save/restore workspace states
CREATE TABLE IF NOT EXISTS snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sandbox_id UUID NOT NULL REFERENCES sandboxes(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  name TEXT,
  description TEXT,
  files JSONB NOT NULL, -- Snapshot of files at this point
  share_token TEXT UNIQUE, -- For sharing links
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Micro-checks: Automated tests that validate mission completion
CREATE TABLE IF NOT EXISTS micro_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  test_code TEXT NOT NULL, -- Code to run for the check (e.g., unit test)
  expected_result JSONB, -- Expected output/assertion
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Micro-check results: Track which checks pass/fail for each user
CREATE TABLE IF NOT EXISTS micro_check_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  micro_check_id UUID NOT NULL REFERENCES micro_checks(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  passed BOOLEAN NOT NULL,
  output TEXT, -- Test output/logs
  error_message TEXT,
  run_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, micro_check_id)
);

-- AI prompt templates: Pre-defined prompts per mission
CREATE TABLE IF NOT EXISTS ai_prompt_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Explain this code", "Generate tests", "Refactor to use transactions"
  prompt_text TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('explain', 'refactor', 'test', 'debug', 'optimize', 'general')),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- AI assistant interactions: Log AI requests and responses
CREATE TABLE IF NOT EXISTS ai_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
  prompt_template_id UUID REFERENCES ai_prompt_templates(id) ON DELETE SET NULL,
  user_prompt TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  code_diff JSONB, -- Suggested code changes as diff
  token_usage JSONB, -- { "input": 100, "output": 50 }
  model_used TEXT, -- e.g., "claude-3-sonnet", "gpt-4"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Saved prompts: User-saved prompts for reuse
CREATE TABLE IF NOT EXISTS saved_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Mission progress: Track completion and badges
CREATE TABLE IF NOT EXISTS mission_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  checklist_progress JSONB DEFAULT '[]', -- Track checklist items
  micro_checks_passed INTEGER DEFAULT 0,
  total_micro_checks INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, mission_id)
);

-- Badges: Achievement system
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- User badges: Track which badges users have earned
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  mission_id UUID REFERENCES missions(id) ON DELETE SET NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, badge_id, mission_id)
);

-- Sandbox runs: Log code execution for cost tracking and debugging
CREATE TABLE IF NOT EXISTS sandbox_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sandbox_id UUID NOT NULL REFERENCES sandboxes(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  files_snapshot JSONB NOT NULL, -- Files at time of run
  output TEXT,
  error_message TEXT,
  exit_code INTEGER,
  execution_time_ms INTEGER,
  resource_usage JSONB, -- { "cpu_time": 100, "memory_mb": 50 }
  run_type TEXT DEFAULT 'execute' CHECK (run_type IN ('execute', 'test', 'build')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Mentor reviews: Instructors can review snapshots and provide feedback
CREATE TABLE IF NOT EXISTS mentor_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mentor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_id UUID NOT NULL REFERENCES snapshots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  comments JSONB DEFAULT '[]', -- Inline comments: [{"line": 10, "text": "Good work!"}]
  overall_feedback TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- User quotas: Track resource usage for cost control
CREATE TABLE IF NOT EXISTS user_quotas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quota_type TEXT NOT NULL CHECK (quota_type IN ('sandbox_runs', 'ai_calls', 'storage_mb')),
  daily_limit INTEGER NOT NULL DEFAULT 100,
  daily_used INTEGER DEFAULT 0,
  monthly_limit INTEGER,
  monthly_used INTEGER DEFAULT 0,
  reset_at TIMESTAMP WITH TIME ZONE, -- Next reset time
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, quota_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_missions_lesson ON missions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_missions_stack ON missions(stack_type);
CREATE INDEX IF NOT EXISTS idx_missions_difficulty ON missions(difficulty);
CREATE INDEX IF NOT EXISTS idx_sandboxes_user_mission ON sandboxes(user_id, mission_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_user ON snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_share_token ON snapshots(share_token);
CREATE INDEX IF NOT EXISTS idx_micro_checks_mission ON micro_checks(mission_id);
CREATE INDEX IF NOT EXISTS idx_micro_check_results_user_mission ON micro_check_results(user_id, mission_id);
CREATE INDEX IF NOT EXISTS idx_ai_prompt_templates_mission ON ai_prompt_templates(mission_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_user ON ai_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_mission ON ai_interactions(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_progress_user_mission ON mission_progress(user_id, mission_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_runs_user ON sandbox_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_runs_mission ON sandbox_runs(mission_id);
CREATE INDEX IF NOT EXISTS idx_mentor_reviews_snapshot ON mentor_reviews(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_user_quotas_user ON user_quotas(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE sandboxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE micro_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE micro_check_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE sandbox_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quotas ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read access to missions and content
CREATE POLICY "Public can view missions" ON missions FOR SELECT USING (true);
CREATE POLICY "Public can view mission_content" ON mission_content FOR SELECT USING (true);
CREATE POLICY "Public can view micro_checks" ON micro_checks FOR SELECT USING (true);
CREATE POLICY "Public can view ai_prompt_templates" ON ai_prompt_templates FOR SELECT USING (true);
CREATE POLICY "Public can view badges" ON badges FOR SELECT USING (true);

-- RLS Policies: Users can only access their own sandboxes, snapshots, and progress
CREATE POLICY "Users can manage own sandboxes" ON sandboxes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own snapshots" ON snapshots
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own micro_check_results" ON micro_check_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own micro_check_results" ON micro_check_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own ai_interactions" ON ai_interactions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own saved_prompts" ON saved_prompts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own mission_progress" ON mission_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own user_badges" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sandbox_runs" ON sandbox_runs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own user_quotas" ON user_quotas
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies: Snapshots with share_token are publicly readable
CREATE POLICY "Public can view shared snapshots" ON snapshots
  FOR SELECT USING (share_token IS NOT NULL);

-- RLS Policies: Mentors can view and create reviews (assuming mentors have a role)
-- Note: You may want to add a user_roles table and check for mentor role
CREATE POLICY "Mentors can view reviews" ON mentor_reviews
  FOR SELECT USING (true); -- Adjust based on your role system

CREATE POLICY "Mentors can create reviews" ON mentor_reviews
  FOR INSERT WITH CHECK (auth.uid() = mentor_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_missions_updated_at BEFORE UPDATE ON missions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mission_content_updated_at BEFORE UPDATE ON mission_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sandboxes_updated_at BEFORE UPDATE ON sandboxes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_prompts_updated_at BEFORE UPDATE ON saved_prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mission_progress_updated_at BEFORE UPDATE ON mission_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mentor_reviews_updated_at BEFORE UPDATE ON mentor_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_quotas_updated_at BEFORE UPDATE ON user_quotas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to initialize user quotas on first access
CREATE OR REPLACE FUNCTION initialize_user_quota()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_quotas (user_id, quota_type, daily_limit, monthly_limit, reset_at)
  VALUES
    (NEW.id, 'sandbox_runs', 100, 2000, NOW() + INTERVAL '1 day'),
    (NEW.id, 'ai_calls', 50, 1000, NOW() + INTERVAL '1 day'),
    (NEW.id, 'storage_mb', 100, 2000, NOW() + INTERVAL '1 month')
  ON CONFLICT (user_id, quota_type) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to initialize quotas when user profile is created (runs on auth.users insert via trigger)
-- Note: This assumes you have a trigger on auth.users that creates a profile in public.users
-- You may need to adjust this based on your auth setup

