-- RLS Policies for Lessons table to allow authenticated users to manage lessons
-- This assumes admins are authenticated users (you may want to add role-based checks)
--
-- This script is idempotent - safe to run multiple times

-- Drop existing policies if they exist (to allow re-running this script)
DROP POLICY IF EXISTS "Authenticated can insert lessons" ON lessons;
DROP POLICY IF EXISTS "Authenticated can update lessons" ON lessons;
DROP POLICY IF EXISTS "Authenticated can delete lessons" ON lessons;

-- Allow authenticated users to insert lessons
CREATE POLICY "Authenticated can insert lessons" ON lessons 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update lessons
CREATE POLICY "Authenticated can update lessons" ON lessons 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete lessons
CREATE POLICY "Authenticated can delete lessons" ON lessons 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() IS NOT NULL);

