-- Add category and end_date columns to missions table
-- Run this migration to add the missing columns

-- Add category column (optional, can be NULL)
ALTER TABLE missions
ADD COLUMN IF NOT EXISTS category TEXT;

-- Add end_date column (optional, can be NULL)
ALTER TABLE missions
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN missions.category IS 'Category for the mission (e.g., Developer, Design, Marketing, etc.)';
COMMENT ON COLUMN missions.end_date IS 'End date for the mission';





