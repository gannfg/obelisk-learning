-- RLS Policies for missions table to allow admins to manage missions
-- Run this in the same Supabase project where the learning-platform-schema.sql was applied.
-- This script is idempotent - safe to run multiple times.

-- NOTE (MVP simplification):
-- The learning Supabase project does NOT share auth with the auth Supabase project,
-- so auth.jwt() in this database does not contain the logged-in user's email/uid.
-- That means we currently *cannot* reliably detect admins here.
--
-- To keep development moving, we relax RLS on missions to allow all inserts/updates/deletes.
-- The *UI* still restricts access to the Admin pages to known admin emails.
-- When we later wire auth into the learning project, we can tighten this policy again.

-- Drop existing write policies if they exist (so we can re-run this script safely)
DROP POLICY IF EXISTS "Authenticated can insert missions" ON missions;
DROP POLICY IF EXISTS "Authenticated can update missions" ON missions;
DROP POLICY IF EXISTS "Authenticated can delete missions" ON missions;
DROP POLICY IF EXISTS "Admins can manage missions" ON missions;

-- Allow admins to insert/update/delete missions.
-- We keep the existing public read policy from learning-platform-schema.sql:
--   CREATE POLICY "Public can view missions" ON missions FOR SELECT USING (true);
CREATE POLICY "Anyone can manage missions (dev)" ON missions
  FOR ALL
  USING (true)
  WITH CHECK (true);


