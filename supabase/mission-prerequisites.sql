-- Mission Prerequisites System
-- Allows missions to require completion of one or more classes before access

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create junction table for mission prerequisites (many-to-many relationship)
-- This assumes both missions and classes tables already exist
CREATE TABLE IF NOT EXISTS mission_prerequisites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id UUID NOT NULL,
  class_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(mission_id, class_id)
);

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
  -- Add mission_id foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'mission_prerequisites_mission_id_fkey' 
    AND table_name = 'mission_prerequisites'
  ) THEN
    ALTER TABLE mission_prerequisites
    ADD CONSTRAINT mission_prerequisites_mission_id_fkey
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE;
  END IF;

  -- Add class_id foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'mission_prerequisites_class_id_fkey' 
    AND table_name = 'mission_prerequisites'
  ) THEN
    ALTER TABLE mission_prerequisites
    ADD CONSTRAINT mission_prerequisites_class_id_fkey
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_mission_prerequisites_mission_id ON mission_prerequisites(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_prerequisites_class_id ON mission_prerequisites(class_id);

-- Add comment
COMMENT ON TABLE mission_prerequisites IS 'Links missions to prerequisite classes. Users must complete all prerequisite classes before accessing a mission.';

