-- Create tables for Habit Accountability Partner System

-- 1. Habit Accountability Partners Table
CREATE TABLE IF NOT EXISTS habit_accountability_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_type TEXT NOT NULL, -- 'core' or 'custom'
  habit_key TEXT, -- For core habits: 'sleep', 'water', 'run', 'gym', etc.
  custom_habit_id UUID REFERENCES custom_habits(id) ON DELETE CASCADE, -- For custom habits
  mode TEXT NOT NULL CHECK (mode IN ('supportive', 'competitive')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE
);

-- Create a unique index that handles NULLs by coalescing them to empty strings
-- This ensures a user can't invite the same person to the same habit twice
CREATE UNIQUE INDEX IF NOT EXISTS idx_habit_partners_unique ON habit_accountability_partners (
  inviter_id, 
  invitee_id, 
  habit_type, 
  (COALESCE(habit_key, '')), 
  (COALESCE(custom_habit_id::text, ''))
);

COMMENT ON TABLE habit_accountability_partners IS 'Stores 1-on-1 accountability partnerships for habits.';

CREATE INDEX IF NOT EXISTS idx_habit_partners_inviter ON habit_accountability_partners(inviter_id, status);
CREATE INDEX IF NOT EXISTS idx_habit_partners_invitee ON habit_accountability_partners(invitee_id, status);
CREATE INDEX IF NOT EXISTS idx_habit_partners_active ON habit_accountability_partners(inviter_id, invitee_id, status) WHERE status = 'accepted';

ALTER TABLE habit_accountability_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view partnerships where they are involved"
  ON habit_accountability_partners
  FOR SELECT
  USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

CREATE POLICY "Users can insert partnerships as inviter"
  ON habit_accountability_partners
  FOR INSERT
  WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Users can update partnerships they are involved in"
  ON habit_accountability_partners
  FOR UPDATE
  USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

CREATE POLICY "Users can delete their own partnerships"
  ON habit_accountability_partners
  FOR DELETE
  USING (auth.uid() = inviter_id);

-- 2. Habit Partner Progress Table (for competitive mode tracking)
CREATE TABLE IF NOT EXISTS habit_partner_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partnership_id UUID NOT NULL REFERENCES habit_accountability_partners(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  streak_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(partnership_id, user_id, date)
);

COMMENT ON TABLE habit_partner_progress IS 'Tracks completion stats for competitive habit partnerships.';

CREATE INDEX IF NOT EXISTS idx_habit_partner_progress_partnership ON habit_partner_progress(partnership_id);
CREATE INDEX IF NOT EXISTS idx_habit_partner_progress_user_date ON habit_partner_progress(user_id, date);

ALTER TABLE habit_partner_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view progress for their partnerships"
  ON habit_partner_progress
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM habit_accountability_partners p
      WHERE p.id = habit_partner_progress.partnership_id
      AND (p.inviter_id = auth.uid() OR p.invitee_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert/update their own progress"
  ON habit_partner_progress
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable Realtime for the tables
-- This allows Supabase to publish changes to subscribers
ALTER PUBLICATION supabase_realtime ADD TABLE habit_partner_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE habit_accountability_partners;

