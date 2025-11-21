-- Create optimized RPC function to get user chats with all related data in one query
-- This prevents N+1 queries and improves performance

CREATE OR REPLACE FUNCTION get_user_chats_optimized(p_user_id UUID)
RETURNS TABLE (
  chat_id UUID,
  participant_1 UUID,
  participant_2 UUID,
  last_message_id UUID,
  last_message_preview TEXT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  other_user_id UUID,
  other_user_username TEXT,
  other_user_display_name TEXT,
  other_user_avatar_url TEXT,
  unread_count INTEGER,
  is_following BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id::UUID AS chat_id,
    c.participant_1::UUID,
    c.participant_2::UUID,
    c.last_message_id::UUID,
    c.last_message_preview::TEXT,
    c.last_message_at::TIMESTAMPTZ,
    c.created_at::TIMESTAMPTZ,
    c.updated_at::TIMESTAMPTZ,
    -- Other user info
    (CASE 
      WHEN c.participant_1 = p_user_id THEN c.participant_2
      ELSE c.participant_1
    END)::UUID AS other_user_id,
    COALESCE(p.username, '')::TEXT AS other_user_username,
    COALESCE(p.display_name, '')::TEXT AS other_user_display_name,
    p.avatar_url::TEXT AS other_user_avatar_url,
    -- Unread count
    COALESCE(uc.unread_count, 0)::INTEGER AS unread_count,
    -- Following status
    (CASE 
      WHEN f.follower_id IS NOT NULL THEN TRUE
      ELSE FALSE
    END)::BOOLEAN AS is_following
  FROM chats c
  -- Join with profiles to get other user info
  LEFT JOIN profiles p ON (
    p.id = CASE 
      WHEN c.participant_1 = p_user_id THEN c.participant_2
      ELSE c.participant_1
    END
  )
  -- Join with unread_counts
  LEFT JOIN unread_counts uc ON (
    uc.chat_id = c.id AND uc.user_id = p_user_id
  )
  -- Join with followers to check following status
  LEFT JOIN followers f ON (
    f.follower_id = p_user_id AND 
    f.following_id = CASE 
      WHEN c.participant_1 = p_user_id THEN c.participant_2
      ELSE c.participant_1
    END
  )
  WHERE 
    c.participant_1 = p_user_id OR c.participant_2 = p_user_id
  ORDER BY c.updated_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_chats_optimized(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_user_chats_optimized IS 'Optimized function to fetch user chats with profiles, unread counts, and following status in a single query';

