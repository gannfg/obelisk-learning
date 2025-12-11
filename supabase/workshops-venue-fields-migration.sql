-- Add venue location fields to workshops table
-- Migration for venue search and Google Maps URL support

-- Add venue address field
ALTER TABLE workshops
ADD COLUMN IF NOT EXISTS venue_address TEXT;

-- Add venue latitude field
ALTER TABLE workshops
ADD COLUMN IF NOT EXISTS venue_lat NUMERIC(10, 8);

-- Add venue longitude field
ALTER TABLE workshops
ADD COLUMN IF NOT EXISTS venue_lng NUMERIC(11, 8);

-- Add Google Maps URL field
ALTER TABLE workshops
ADD COLUMN IF NOT EXISTS google_maps_url TEXT;

-- Add indexes for location-based queries (optional, for future use)
CREATE INDEX IF NOT EXISTS idx_workshops_venue_lat_lng ON workshops(venue_lat, venue_lng) WHERE venue_lat IS NOT NULL AND venue_lng IS NOT NULL;

-- Add comment to document the fields
COMMENT ON COLUMN workshops.venue_address IS 'Full address of the venue when searched via Nominatim';
COMMENT ON COLUMN workshops.venue_lat IS 'Latitude of the venue location';
COMMENT ON COLUMN workshops.venue_lng IS 'Longitude of the venue location';
COMMENT ON COLUMN workshops.google_maps_url IS 'Google Maps URL fallback when venue search is unavailable';

