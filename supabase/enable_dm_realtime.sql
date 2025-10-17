-- Enable Realtime for DM tables via SQL publication
-- This works on all Supabase plans (including free tier)
-- Run this in Supabase Dashboard → SQL Editor

-- Add tables to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;
ALTER PUBLICATION supabase_realtime ADD TABLE chats;

-- Verify realtime is enabled (should show all 3 tables)
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('messages', 'typing_indicators', 'chats');

-- You should see output like:
-- schemaname | tablename
-- -----------+-------------------
-- public     | messages
-- public     | typing_indicators
-- public     | chats

