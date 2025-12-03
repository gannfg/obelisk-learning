-- RLS Policies for Courses table to allow authenticated users to manage courses
-- This assumes admins are authenticated users (you may want to add role-based checks)
--
-- This script is idempotent - safe to run multiple times

-- Drop existing policies if they exist (to allow re-running this script)
DROP POLICY IF EXISTS "Authenticated can update courses" ON courses;
DROP POLICY IF EXISTS "Authenticated can delete courses" ON courses;
DROP POLICY IF EXISTS "Authenticated can insert courses" ON courses;

-- Allow authenticated users to insert courses
CREATE POLICY "Authenticated can insert courses" ON courses 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update courses
CREATE POLICY "Authenticated can update courses" ON courses 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete courses
CREATE POLICY "Authenticated can delete courses" ON courses 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() IS NOT NULL);

