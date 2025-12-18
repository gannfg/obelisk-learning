-- Add DELETE policy for notifications
-- This allows users to delete their own notifications

-- Drop existing delete policy if it exists
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

-- Create delete policy
-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant DELETE permission
GRANT DELETE ON notifications TO anon, authenticated;
