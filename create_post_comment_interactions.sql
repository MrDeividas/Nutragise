-- Create post_comment_likes table
CREATE TABLE IF NOT EXISTS post_comment_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Create post_comment_replies table
CREATE TABLE IF NOT EXISTS post_comment_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_comment_id UUID NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reply_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create post_reply_likes table
CREATE TABLE IF NOT EXISTS post_reply_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reply_id UUID NOT NULL REFERENCES post_comment_replies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reply_id, user_id)
);

-- Add RLS policies for post_comment_likes
ALTER TABLE post_comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all post comment likes" ON post_comment_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own post comment likes" ON post_comment_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own post comment likes" ON post_comment_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Add RLS policies for post_comment_replies
ALTER TABLE post_comment_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all post comment replies" ON post_comment_replies
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own post comment replies" ON post_comment_replies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own post comment replies" ON post_comment_replies
  FOR DELETE USING (auth.uid() = user_id);

-- Add RLS policies for post_reply_likes
ALTER TABLE post_reply_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all post reply likes" ON post_reply_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own post reply likes" ON post_reply_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own post reply likes" ON post_reply_likes
  FOR DELETE USING (auth.uid() = user_id);
