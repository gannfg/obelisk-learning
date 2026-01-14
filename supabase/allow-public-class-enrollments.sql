-- Allow guests (anonymous users) to view enrollments for published classes
-- This enables public viewing of enrolled students on class pages

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Guests can view enrollments for published classes" ON class_enrollments;

-- Create policy to allow public read access to enrollments for published classes
-- This allows guests to see who is enrolled in a class (for browsing before enrollment)
CREATE POLICY "Guests can view enrollments for published classes"
  ON class_enrollments
  FOR SELECT
  USING (
    -- Only allow viewing enrollments for published classes
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = class_enrollments.class_id
      AND classes.published = TRUE
    )
  );

-- Note: This policy allows guests to see enrollments for published classes only
-- The existing policies for admins, mentors, and users viewing their own enrollments remain in effect
-- This policy is additive and doesn't restrict existing access
