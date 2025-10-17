-- Chats table (conversation between two users)
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_1 UUID REFERENCES profiles(id) ON DELETE CASCADE,
  participant_2 UUID REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_id UUID,
  last_message_preview TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(participant_1, participant_2),
  CHECK (participant_1 < participant_2) -- Ensure consistent ordering
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Typing indicators table (ephemeral, cleared periodically)
CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  is_typing BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(chat_id, user_id)
);

-- Unread message counts (denormalized for performance)
CREATE TABLE IF NOT EXISTS unread_counts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  unread_count INTEGER DEFAULT 0,
  UNIQUE(user_id, chat_id)
);

-- Push tokens table
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chats_participant_1 ON chats(participant_1);
CREATE INDEX IF NOT EXISTS idx_chats_participant_2 ON chats(participant_2);
CREATE INDEX IF NOT EXISTS idx_chats_last_message_at ON chats(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_chat_id ON typing_indicators(chat_id);
CREATE INDEX IF NOT EXISTS idx_unread_counts_user_id ON unread_counts(user_id);

-- RLS Policies
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE unread_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Chats policies
CREATE POLICY "Users can view their own chats"
  ON chats FOR SELECT
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can create chats"
  ON chats FOR INSERT
  WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can update their own chats"
  ON chats FOR UPDATE
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- Messages policies
CREATE POLICY "Users can view messages in their chats"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND (chats.participant_1 = auth.uid() OR chats.participant_2 = auth.uid())
    )
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = sender_id);

-- Typing indicators policies
CREATE POLICY "Users can view typing in their chats"
  ON typing_indicators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = typing_indicators.chat_id
      AND (chats.participant_1 = auth.uid() OR chats.participant_2 = auth.uid())
    )
  );

CREATE POLICY "Users can update their typing status"
  ON typing_indicators FOR ALL
  USING (auth.uid() = user_id);

-- Unread counts policies
CREATE POLICY "Users can view their unread counts"
  ON unread_counts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their unread counts"
  ON unread_counts FOR INSERT
  WITH CHECK (true);  -- Allow trigger to insert for any user

CREATE POLICY "Users can update their unread counts"
  ON unread_counts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their unread counts"
  ON unread_counts FOR DELETE
  USING (auth.uid() = user_id);

-- Push tokens policies
CREATE POLICY "Users can manage their own push tokens"
  ON push_tokens FOR ALL
  USING (auth.uid() = user_id);

-- Function to update chat's last message
CREATE OR REPLACE FUNCTION update_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chats
  SET 
    last_message_id = NEW.id,
    last_message_preview = LEFT(NEW.content, 100),
    last_message_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.chat_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_chat_last_message ON messages;
CREATE TRIGGER trigger_update_chat_last_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_chat_last_message();

-- Function to increment unread count
CREATE OR REPLACE FUNCTION increment_unread_count()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
BEGIN
  -- Get the recipient (the participant who is NOT the sender)
  SELECT CASE
    WHEN participant_1 = NEW.sender_id THEN participant_2
    ELSE participant_1
  END INTO recipient_id
  FROM chats
  WHERE id = NEW.chat_id;
  
  -- Upsert unread count
  INSERT INTO unread_counts (user_id, chat_id, unread_count)
  VALUES (recipient_id, NEW.chat_id, 1)
  ON CONFLICT (user_id, chat_id)
  DO UPDATE SET unread_count = unread_counts.unread_count + 1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_unread_count ON messages;
CREATE TRIGGER trigger_increment_unread_count
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION increment_unread_count();

