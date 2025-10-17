-- Optimization: Create a materialized view or optimize getUserChats query
-- This improves the N+1 query problem by using a single efficient query

-- Option 1: Create a function that returns enriched chat data
-- This is more efficient than making 4 separate queries

CREATE OR REPLACE FUNCTION get_user_chats_optimized(p_user_id UUID)
RETURNS TABLE (
  chat_id UUID,
  participant_1 UUID,
  participant_2 UUID,
  last_message_id UUID,
  last_message_preview TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  other_user_id UUID,
  other_user_username TEXT,
  other_user_display_name TEXT,
  other_user_avatar_url TEXT,
  unread_count INTEGER,
  is_following BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS chat_id,
    c.participant_1,
    c.participant_2,
    c.last_message_id,
    c.last_message_preview,
    c.last_message_at,
    c.created_at,
    c.updated_at,
    -- Determine the other user
    CASE 
      WHEN c.participant_1 = p_user_id THEN c.participant_2
      ELSE c.participant_1
    END AS other_user_id,
    -- Get other user's profile info (cast to TEXT to match return type)
    p.username::TEXT AS other_user_username,
    p.display_name::TEXT AS other_user_display_name,
    p.avatar_url::TEXT AS other_user_avatar_url,
    -- Get unread count (0 if no record)
    COALESCE(uc.unread_count, 0)::INTEGER AS unread_count,
    -- Check if following
    (CASE WHEN f.following_id IS NOT NULL THEN true ELSE false END)::BOOLEAN AS is_following
  FROM chats c
  LEFT JOIN profiles p ON p.id = CASE 
    WHEN c.participant_1 = p_user_id THEN c.participant_2
    ELSE c.participant_1
  END
  LEFT JOIN unread_counts uc ON uc.chat_id = c.id AND uc.user_id = p_user_id
  LEFT JOIN followers f ON f.follower_id = p_user_id AND f.following_id = CASE 
    WHEN c.participant_1 = p_user_id THEN c.participant_2
    ELSE c.participant_1
  END
  WHERE c.participant_1 = p_user_id OR c.participant_2 = p_user_id
  ORDER BY c.last_message_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_chats_optimized(UUID) TO authenticated;

-- Create an index to speed up the function
CREATE INDEX IF NOT EXISTS idx_chats_both_participants ON chats(participant_1, participant_2);
CREATE INDEX IF NOT EXISTS idx_followers_both ON followers(follower_id, following_id);

-- Note: To use this function in your app, call it from dmService:
-- const { data } = await supabase.rpc('get_user_chats_optimized', { p_user_id: userId });

