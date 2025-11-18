-- Migration: Add username column to users table
-- Run this if you already have the users table and need to add username support

-- Add username column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'username'
  ) THEN
    ALTER TABLE users ADD COLUMN username TEXT;
    RAISE NOTICE 'Username column added successfully';
  ELSE
    RAISE NOTICE 'Username column already exists';
  END IF;
END $$;

-- Create index on username for faster lookups (if username column exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'username'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE username IS NOT NULL;
    RAISE NOTICE 'Username index created successfully';
  END IF;
END $$;

