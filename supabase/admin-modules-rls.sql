-- RLS Policies for Modules table to allow authenticated users to manage modules
-- This assumes admins are authenticated users (you may want to add role-based checks)
--
-- IMPORTANT: Make sure you have run supabase/schema.sql first to create the modules table!
-- If you get an error that "modules" table does not exist, run schema.sql first.

-- Check if modules table exists before creating policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'modules') THEN
    RAISE EXCEPTION 'The modules table does not exist. Please run supabase/schema.sql first to create the tables.';
  END IF;
END $$;

-- Drop existing policies if they exist (to allow re-running this script)
DROP POLICY IF EXISTS "Authenticated can insert modules" ON modules;
DROP POLICY IF EXISTS "Authenticated can update modules" ON modules;
DROP POLICY IF EXISTS "Authenticated can delete modules" ON modules;

-- Allow authenticated users to insert modules
CREATE POLICY "Authenticated can insert modules" ON modules 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update modules
CREATE POLICY "Authenticated can update modules" ON modules 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete modules
CREATE POLICY "Authenticated can delete modules" ON modules 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() IS NOT NULL);

