-- Fix the trigger to run with SECURITY DEFINER
-- This allows the trigger to bypass RLS policies

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS trigger_increment_unread_count ON messages;
DROP FUNCTION IF EXISTS increment_unread_count();

-- Recreate the function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION increment_unread_count()
RETURNS TRIGGER 
SECURITY DEFINER  -- This makes the function run with the creator's privileges, bypassing RLS
SET search_path = public
AS $$
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
  
  -- Upsert unread count (will work because function has SECURITY DEFINER)
  INSERT INTO unread_counts (user_id, chat_id, unread_count)
  VALUES (recipient_id, NEW.chat_id, 1)
  ON CONFLICT (user_id, chat_id)
  DO UPDATE SET unread_count = unread_counts.unread_count + 1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_increment_unread_count
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION increment_unread_count();

