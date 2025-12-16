-- Fix RLS policies for conversation_participants to allow conversation creation
-- Run this in your Auth Supabase SQL editor
-- This fixes the issue where users cannot add themselves as participants when creating new conversations

-- First, check current policies
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'conversation_participants'
ORDER BY policyname;

-- Drop ALL existing insert policies on conversation_participants
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'conversation_participants' 
      AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON conversation_participants', r.policyname);
  END LOOP;
END $$;

-- Create a new, more permissive policy that allows:
-- 1. Users to always add themselves as participants (needed for new conversations)
-- 2. Users to add others if they're already a participant (for group chats)
CREATE POLICY "Users can add participants to conversations"
  ON conversation_participants
  FOR INSERT
  WITH CHECK (
    -- Always allowed to add themselves (this is the key fix)
    user_id = auth.uid()
    OR
    -- Allowed to add others if already a participant in that conversation
    conversation_id IN (
      SELECT conversation_id
      FROM conversation_participants
      WHERE user_id = auth.uid()
    )
  );

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'conversation_participants'
  AND policyname = 'Users can add participants to conversations';

-- Also verify RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'conversation_participants';

