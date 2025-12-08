-- Advertisements table for homepage carousel
CREATE TABLE IF NOT EXISTS advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  cta_text TEXT NOT NULL,
  href TEXT NOT NULL,
  icon_name TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for ordering
CREATE INDEX IF NOT EXISTS idx_advertisements_order ON advertisements(order_index);

-- Create index for active advertisements
CREATE INDEX IF NOT EXISTS idx_advertisements_active ON advertisements(active) WHERE active = true;

-- Enable RLS
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active advertisements
CREATE POLICY "Public can view active advertisements"
  ON advertisements
  FOR SELECT
  USING (active = true);

-- Policy: Admins can manage all advertisements
-- Note: This assumes you have a way to check admin status
-- You may need to adjust this based on your auth setup
CREATE POLICY "Admins can manage advertisements"
  ON advertisements
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION update_advertisements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_advertisements_updated_at
  BEFORE UPDATE ON advertisements
  FOR EACH ROW
  EXECUTE FUNCTION update_advertisements_updated_at();

