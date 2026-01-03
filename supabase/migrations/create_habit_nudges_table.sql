-- Create habit_nudges table to track when users nudge their accountability partners
CREATE TABLE IF NOT EXISTS habit_nudges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partnership_id UUID NOT NULL REFERENCES habit_accountability_partners(id) ON DELETE CASCADE,
  nudger_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nudged_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  habit_type TEXT NOT NULL CHECK (habit_type IN ('core', 'custom')),
  habit_key TEXT, -- For core habits
  custom_habit_id UUID, -- For custom habits
  nudged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_habit_nudges_partnership_id ON habit_nudges(partnership_id);
CREATE INDEX IF NOT EXISTS idx_habit_nudges_nudger_id ON habit_nudges(nudger_id);
CREATE INDEX IF NOT EXISTS idx_habit_nudges_nudged_user_id ON habit_nudges(nudged_user_id);
CREATE INDEX IF NOT EXISTS idx_habit_nudges_nudged_at ON habit_nudges(nudged_at);

-- Composite index for checking recent nudges
CREATE INDEX IF NOT EXISTS idx_habit_nudges_partnership_time ON habit_nudges(partnership_id, nudged_at DESC);

-- Enable RLS
ALTER TABLE habit_nudges ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view nudges they sent or received
CREATE POLICY "Users can view their own nudges" ON habit_nudges
  FOR SELECT
  USING (nudger_id = auth.uid() OR nudged_user_id = auth.uid());

-- Policy: Users can create nudges for partnerships they are part of
CREATE POLICY "Users can create nudges for their partnerships" ON habit_nudges
  FOR INSERT
  WITH CHECK (
    nudger_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM habit_accountability_partners
      WHERE id = partnership_id
      AND (inviter_id = auth.uid() OR invitee_id = auth.uid())
      AND status = 'accepted'
    )
  );

-- Add comment
COMMENT ON TABLE habit_nudges IS 'Tracks when users nudge their accountability partners to complete habits';
COMMENT ON COLUMN habit_nudges.nudged_at IS 'Timestamp when the nudge was sent (used for 3-hour cooldown)';

