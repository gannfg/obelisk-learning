-- Add image_url column to advertisements table
ALTER TABLE advertisements ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Make old columns optional (nullable) since we're simplifying to just image and link
-- Only run these if the columns exist and have NOT NULL constraints
DO $$ 
BEGIN
  -- Drop NOT NULL constraint on title if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'advertisements' AND column_name = 'title' AND is_nullable = 'NO') THEN
    ALTER TABLE advertisements ALTER COLUMN title DROP NOT NULL;
  END IF;
  
  -- Drop NOT NULL constraint on description if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'advertisements' AND column_name = 'description' AND is_nullable = 'NO') THEN
    ALTER TABLE advertisements ALTER COLUMN description DROP NOT NULL;
  END IF;
  
  -- Drop NOT NULL constraint on cta_text if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'advertisements' AND column_name = 'cta_text' AND is_nullable = 'NO') THEN
    ALTER TABLE advertisements ALTER COLUMN cta_text DROP NOT NULL;
  END IF;
END $$;

