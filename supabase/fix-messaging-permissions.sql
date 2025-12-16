-- Fix messaging permissions
-- Run this if you're having issues with conversations/messages

-- Grant execute permission on the RPC function
GRANT EXECUTE ON FUNCTION find_or_create_direct_conversation(UUID, UUID) TO authenticated;

-- Verify the function exists and is accessible
SELECT proname, prosecdef 
FROM pg_proc 
WHERE proname = 'find_or_create_direct_conversation';

