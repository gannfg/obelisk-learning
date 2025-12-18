-- Advertisements Table Schema
-- This creates the advertisements table if it doesn't exist and adds missing columns

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create advertisements table if it doesn't exist
CREATE TABLE IF NOT EXISTS advertisements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  cta_text TEXT NOT NULL,
  href TEXT NOT NULL,
  image_url TEXT,
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add is_active column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'advertisements' 
      AND column_name = 'is_active'
  ) THEN
    ALTER TABLE advertisements ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
    RAISE NOTICE 'Added is_active column to advertisements table';
  ELSE
    RAISE NOTICE 'is_active column already exists in advertisements table';
  END IF;
END $$;

-- Make order_index nullable if it has NOT NULL constraint
DO $$ 
BEGIN
  -- Check if order_index has NOT NULL constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'advertisements' 
      AND column_name = 'order_index'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE advertisements ALTER COLUMN order_index DROP NOT NULL;
    RAISE NOTICE 'Made order_index nullable in advertisements table';
  ELSE
    RAISE NOTICE 'order_index is already nullable in advertisements table';
  END IF;
END $$;

-- Create index on is_active for faster filtering
CREATE INDEX IF NOT EXISTS idx_advertisements_is_active ON advertisements(is_active) WHERE is_active = TRUE;

-- Create index on order_index for sorting
CREATE INDEX IF NOT EXISTS idx_advertisements_order_index ON advertisements(order_index) WHERE order_index IS NOT NULL;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_advertisements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_advertisements_updated_at_trigger ON advertisements;
CREATE TRIGGER update_advertisements_updated_at_trigger
  BEFORE UPDATE ON advertisements
  FOR EACH ROW
  EXECUTE FUNCTION update_advertisements_updated_at();
