-- Add profile fields for location, languages, and skills to users table
-- Run this in your Auth Supabase SQL editor

-- Add location (country) field
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'location'
  ) THEN
    ALTER TABLE users ADD COLUMN location TEXT;
  END IF;
END $$;

-- Add languages field (stored as TEXT array)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'languages'
  ) THEN
    ALTER TABLE users ADD COLUMN languages TEXT[];
  END IF;
END $$;

-- Add index for location (optional, for future location-based queries)
CREATE INDEX IF NOT EXISTS idx_users_location ON users(location) WHERE location IS NOT NULL;

-- Note: Skills/mastery are stored in user_collaboration_status.collaboration_interests
-- which already exists in the messaging-schema.sql

