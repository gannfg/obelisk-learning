-- Quizzes table to store quiz questions
-- Run this after schema.sql

CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  questions JSONB NOT NULL, -- Array of quiz questions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(lesson_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_quizzes_lesson ON quizzes(lesson_id);

-- Enable RLS
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- Public read access to quizzes
DROP POLICY IF EXISTS "Public can view quizzes" ON quizzes;
CREATE POLICY "Public can view quizzes" ON quizzes FOR SELECT USING (true);

-- Authenticated users can insert quizzes
DROP POLICY IF EXISTS "Authenticated can insert quizzes" ON quizzes;
CREATE POLICY "Authenticated can insert quizzes" ON quizzes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Authenticated users can update quizzes
DROP POLICY IF EXISTS "Authenticated can update quizzes" ON quizzes;
CREATE POLICY "Authenticated can update quizzes" ON quizzes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Authenticated users can delete quizzes
DROP POLICY IF EXISTS "Authenticated can delete quizzes" ON quizzes;
CREATE POLICY "Authenticated can delete quizzes" ON quizzes
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_quizzes_updated_at ON quizzes;
CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON quizzes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

