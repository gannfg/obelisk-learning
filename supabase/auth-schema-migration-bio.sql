-- Migration: Add bio column to users table
-- This allows users to add a bio/description to their profile

-- Add bio column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'bio'
  ) THEN
    ALTER TABLE users ADD COLUMN bio TEXT;
    RAISE NOTICE 'Added bio column to users table';
  ELSE
    RAISE NOTICE 'bio column already exists';
  END IF;
END $$;

