-- Schema for lantaidua-universal-auth Supabase database
-- This database stores Clerk-synced user accounts

-- Create users table for Clerk user sync
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, -- Clerk user ID
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public inserts/updates for user sync (since we're using Clerk, not Supabase Auth)
-- This allows the anon key to insert/update users during sync operations
CREATE POLICY "Allow user sync operations"
  ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Note: Since we're using Clerk for authentication (not Supabase Auth), 
-- we need permissive RLS policies to allow the sync operations.
-- The anon key will be used for sync, so we allow all operations.
-- In production, you might want to add additional security measures.

