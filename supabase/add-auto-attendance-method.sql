-- Add 'auto' as a valid method for class_attendance
-- This allows automatic attendance marking when modules are completed

-- Drop the existing constraint
ALTER TABLE class_attendance 
DROP CONSTRAINT IF EXISTS class_attendance_method_check;

-- Add the new constraint with 'auto' included
ALTER TABLE class_attendance 
ADD CONSTRAINT class_attendance_method_check 
CHECK (method IN ('qr', 'manual', 'auto'));

-- Update the comment to reflect the new method
COMMENT ON COLUMN class_attendance.method IS 'How attendance was recorded: qr (QR code scan), manual (manual check-in), or auto (automatic when module completed)';

-- Update RLS policy to allow users to update their own attendance (for upsert operations)
DROP POLICY IF EXISTS "Users can mark own attendance" ON class_attendance;
CREATE POLICY "Users can mark own attendance"
  ON class_attendance FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    is_enrolled(auth.uid(), class_id)
  );

-- Allow users to update their own attendance (needed for upsert)
DROP POLICY IF EXISTS "Users can update own attendance" ON class_attendance;
CREATE POLICY "Users can update own attendance"
  ON class_attendance FOR UPDATE
  USING (
    user_id = auth.uid() AND
    is_enrolled(auth.uid(), class_id)
  )
  WITH CHECK (
    user_id = auth.uid() AND
    is_enrolled(auth.uid(), class_id)
  );

