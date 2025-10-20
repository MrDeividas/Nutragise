-- ============================================
-- ADD MISSING DELETE POLICIES FOR DM TABLES
-- ============================================
-- This adds DELETE policies so users can delete their own chats/messages
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. CHATS TABLE - Add DELETE policy
-- ============================================

-- Users can delete chats they're part of
CREATE POLICY "Users can delete their chats"
  ON chats FOR DELETE
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- ============================================
-- 2. MESSAGES TABLE - Add DELETE policy
-- ============================================

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages"
  ON messages FOR DELETE
  USING (auth.uid() = sender_id);

-- ============================================
-- Verification
-- ============================================
-- Show all policies for DM tables
SELECT 
  tablename,
  policyname,
  cmd as "Operation"
FROM pg_policies 
WHERE tablename IN ('chats', 'messages')
ORDER BY tablename, cmd, policyname;

