-- Messaging and Social Features Database Schema
-- Run this SQL in your Auth Supabase SQL editor
-- This schema enables user-to-user messaging and collaboration features

-- ============================================
-- 1. CONVERSATIONS TABLE
-- ============================================
-- Stores conversation metadata (direct messages or group chats)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. CONVERSATION PARTICIPANTS TABLE
-- ============================================
-- Tracks which users are in which conversations
CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY (conversation_id, user_id)
);

-- ============================================
-- 3. MESSAGES TABLE
-- ============================================
-- Stores individual messages in conversations
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  edited_at TIMESTAMP WITH TIME ZONE,
  -- Note: read_at can be tracked per participant in conversation_participants.last_read_at
  CONSTRAINT messages_content_not_empty CHECK (length(trim(content)) > 0)
);

-- ============================================
-- 4. USER COLLABORATION STATUS TABLE
-- ============================================
-- Stores user preferences for collaboration (looking for collaborators, skills, availability)
CREATE TABLE IF NOT EXISTS user_collaboration_status (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  looking_for_collaborators BOOLEAN DEFAULT false,
  collaboration_interests TEXT[], -- Array of interests/skills (e.g., ['Web3', 'Solana', 'React'])
  availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'away')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================
-- Conversation indexes
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);

-- Conversation participants indexes
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at DESC);

-- User collaboration status indexes
CREATE INDEX IF NOT EXISTS idx_user_collaboration_status_looking ON user_collaboration_status(looking_for_collaborators) WHERE looking_for_collaborators = true;
CREATE INDEX IF NOT EXISTS idx_user_collaboration_status_availability ON user_collaboration_status(availability_status);

-- ============================================
-- 6. TRIGGERS FOR UPDATED_AT
-- ============================================
-- Use existing update_updated_at_column function (defined in auth-schema.sql)
-- If it doesn't exist, it will be created here

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update conversation.updated_at when a new message is added
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_on_message ON messages;
CREATE TRIGGER trigger_update_conversation_on_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_on_message();

-- Trigger for user_collaboration_status.updated_at
DROP TRIGGER IF EXISTS update_user_collaboration_status_updated_at ON user_collaboration_status;
CREATE TRIGGER update_user_collaboration_status_updated_at
    BEFORE UPDATE ON user_collaboration_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_collaboration_status ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CONVERSATIONS POLICIES
-- ============================================

-- Users can view conversations they participate in
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (
    id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    )
  );

-- Users can create conversations (but they must add themselves as participant)
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (true); -- Participants are validated via conversation_participants policies

-- Users can update conversations they participate in (for group chat settings, etc.)
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;
CREATE POLICY "Users can update their conversations"
  ON conversations FOR UPDATE
  USING (
    id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- CONVERSATION_PARTICIPANTS POLICIES
-- ============================================

-- Users can view participants of conversations they're in
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON conversation_participants;
CREATE POLICY "Users can view participants of their conversations"
  ON conversation_participants FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    )
  );

-- Users can add themselves to conversations
-- Users can add others to conversations they're already in (for group chats)
DROP POLICY IF EXISTS "Users can add participants to conversations" ON conversation_participants;
CREATE POLICY "Users can add participants to conversations"
  ON conversation_participants FOR INSERT
  WITH CHECK (
    -- Can add themselves
    user_id = auth.uid()
    OR
    -- Can add others if already a participant (for group chats)
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    )
  );

-- Users can update their own participant record (last_read_at, etc.)
DROP POLICY IF EXISTS "Users can update their own participant record" ON conversation_participants;
CREATE POLICY "Users can update their own participant record"
  ON conversation_participants FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can remove themselves from conversations
-- Can remove others if they're the only other participant (for leaving conversations)
DROP POLICY IF EXISTS "Users can remove participants from conversations" ON conversation_participants;
CREATE POLICY "Users can remove participants from conversations"
  ON conversation_participants FOR DELETE
  USING (
    user_id = auth.uid()
    OR
    -- Can remove others if it's a direct conversation and you're removing the other person
    (conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    ) AND (
      SELECT COUNT(*) FROM conversation_participants
      WHERE conversation_id = conversation_participants.conversation_id
    ) = 2)
  );

-- ============================================
-- MESSAGES POLICIES
-- ============================================

-- Users can view messages in conversations they participate in
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    )
  );

-- Users can send messages to conversations they participate in
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;
CREATE POLICY "Users can send messages to their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    )
  );

-- Users can edit/delete their own messages
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;
CREATE POLICY "Users can delete their own messages"
  ON messages FOR DELETE
  USING (sender_id = auth.uid());

-- ============================================
-- USER_COLLABORATION_STATUS POLICIES
-- ============================================

-- Users can view all collaboration statuses (for discovery)
DROP POLICY IF EXISTS "Users can view collaboration statuses" ON user_collaboration_status;
CREATE POLICY "Users can view collaboration statuses"
  ON user_collaboration_status FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Users can create/update their own collaboration status
DROP POLICY IF EXISTS "Users can manage their own collaboration status" ON user_collaboration_status;
CREATE POLICY "Users can manage their own collaboration status"
  ON user_collaboration_status FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- 8. HELPER FUNCTIONS
-- ============================================

-- Function to find or create a direct conversation between two users
CREATE OR REPLACE FUNCTION find_or_create_direct_conversation(user1_id UUID, user2_id UUID)
RETURNS UUID AS $$
DECLARE
  conversation_uuid UUID;
BEGIN
  -- Check if a direct conversation already exists between these two users
  SELECT c.id INTO conversation_uuid
  FROM conversations c
  WHERE c.type = 'direct'
    AND EXISTS (
      SELECT 1 FROM conversation_participants cp1
      WHERE cp1.conversation_id = c.id AND cp1.user_id = user1_id
    )
    AND EXISTS (
      SELECT 1 FROM conversation_participants cp2
      WHERE cp2.conversation_id = c.id AND cp2.user_id = user2_id
    )
    AND (
      SELECT COUNT(*) FROM conversation_participants
      WHERE conversation_id = c.id
    ) = 2
  LIMIT 1;
  
  -- If no conversation exists, create one
  IF conversation_uuid IS NULL THEN
    INSERT INTO conversations (type) VALUES ('direct')
    RETURNING id INTO conversation_uuid;
    
    -- Add both users as participants
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES (conversation_uuid, user1_id), (conversation_uuid, user2_id);
  END IF;
  
  RETURN conversation_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. GRANT PERMISSIONS
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON conversation_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_collaboration_status TO authenticated;

-- ============================================
-- NOTES
-- ============================================
-- 1. This schema assumes the users table already exists in the auth Supabase
-- 2. Run this after auth-schema.sql has been executed
-- 3. For real-time messaging, enable Supabase Realtime on the messages table:
--    - Go to Database > Replication in Supabase dashboard
--    - Enable replication for: messages, conversations, conversation_participants
-- 4. To enable real-time subscriptions in the app, use:
--    supabase.channel('messages').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, ...)

