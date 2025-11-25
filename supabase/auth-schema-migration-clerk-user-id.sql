-- Migration: Add clerk_user_id column to users table
-- This allows us to store Clerk user IDs separately from the UUID primary key
-- Run this migration if your users table has id as UUID type

-- Step 1: Add clerk_user_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'clerk_user_id'
  ) THEN
    ALTER TABLE users ADD COLUMN clerk_user_id TEXT UNIQUE;
    
    -- Create index on clerk_user_id for faster lookups
    CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id) WHERE clerk_user_id IS NOT NULL;
    
    RAISE NOTICE 'Added clerk_user_id column to users table';
  ELSE
    RAISE NOTICE 'clerk_user_id column already exists';
  END IF;
END $$;

-- Step 2: If id is TEXT type, migrate existing Clerk IDs to clerk_user_id
-- This handles tables created with the old schema where id was TEXT
DO $$
DECLARE
  id_type TEXT;
  row_count INTEGER;
BEGIN
  -- Check the current type of the id column
  SELECT data_type INTO id_type
  FROM information_schema.columns
  WHERE table_name = 'users' AND column_name = 'id';
  
  -- If id is TEXT, copy those values to clerk_user_id
  IF id_type = 'text' THEN
    -- Copy existing TEXT ids to clerk_user_id where clerk_user_id is NULL
    UPDATE users 
    SET clerk_user_id = id 
    WHERE clerk_user_id IS NULL AND id IS NOT NULL;
    
    GET DIAGNOSTICS row_count = ROW_COUNT;
    RAISE NOTICE 'Migrated % existing Clerk user IDs to clerk_user_id column', row_count;
    
    -- Note: The id column will remain as TEXT for now to avoid breaking existing references
    -- You may want to create a separate migration to convert id to UUID if needed
    RAISE NOTICE 'Note: id column is still TEXT. Consider running a separate migration to convert to UUID if needed.';
  ELSE
    RAISE NOTICE 'id column is not TEXT type (current type: %). No migration needed.', id_type;
  END IF;
END $$;

