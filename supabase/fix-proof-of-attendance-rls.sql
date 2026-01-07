-- Fix RLS policy for proof_of_attendance table
-- This allows admins to manually check in users and the trigger to create POA records

-- Update the trigger function to use SECURITY DEFINER so it can bypass RLS
CREATE OR REPLACE FUNCTION create_proof_of_attendance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO proof_of_attendance (workshop_id, user_id, attendance_id)
  VALUES (NEW.workshop_id, NEW.user_id, NEW.id)
  ON CONFLICT (workshop_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can insert POA" ON proof_of_attendance;

-- Add INSERT policy for admins (for manual check-ins)
CREATE POLICY "Admins can insert POA" ON proof_of_attendance
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = TRUE
    )
  );

-- Grant INSERT permission
GRANT INSERT ON proof_of_attendance TO authenticated;
