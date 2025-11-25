-- Migration to update users table for Supabase Auth
-- This migration updates the schema from Clerk-based to Supabase Auth-based

-- Step 1: Remove clerk_user_id column if it exists (no longer needed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'clerk_user_id'
  ) THEN
    -- Drop index first
    DROP INDEX IF EXISTS idx_users_clerk_user_id;
    -- Drop the column
    ALTER TABLE users DROP COLUMN clerk_user_id;
    RAISE NOTICE 'Removed clerk_user_id column';
  ELSE
    RAISE NOTICE 'clerk_user_id column does not exist, skipping';
  END IF;
END $$;

-- Step 2: Ensure id column is UUID and references auth.users
DO $$
BEGIN
  -- Check if id column exists and is UUID
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'id'
  ) THEN
    -- Check if foreign key constraint already exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'users_id_fkey' 
      AND table_name = 'users'
    ) THEN
      -- Add foreign key constraint to auth.users
      ALTER TABLE users 
      ADD CONSTRAINT users_id_fkey 
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
      RAISE NOTICE 'Added foreign key constraint to auth.users';
    ELSE
      RAISE NOTICE 'Foreign key constraint already exists';
    END IF;
  END IF;
END $$;

-- Step 3: Create or replace the trigger function for auto-creating user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, image_url, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'full_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'last_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.avatar_url, NULL),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Update RLS policies for Supabase Auth
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Allow user sync operations" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create new policies for Supabase Auth
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Migration completed successfully!
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
END $$;

