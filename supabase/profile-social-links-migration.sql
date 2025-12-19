-- Add social link fields to users table
-- Run this in your Auth Supabase SQL editor

-- Add Twitter/X URL field
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'twitter_url'
  ) THEN
    ALTER TABLE users ADD COLUMN twitter_url TEXT;
  END IF;
END $$;

-- Add LinkedIn URL field
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'linkedin_url'
  ) THEN
    ALTER TABLE users ADD COLUMN linkedin_url TEXT;
  END IF;
END $$;

-- Add GitHub URL field
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'github_url'
  ) THEN
    ALTER TABLE users ADD COLUMN github_url TEXT;
  END IF;
END $$;

-- Add Website URL field
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'website_url'
  ) THEN
    ALTER TABLE users ADD COLUMN website_url TEXT;
  END IF;
END $$;
