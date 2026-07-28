-- Track last calendar day pillar decay was applied (prevents double-apply on reopen)
ALTER TABLE pillar_progress
  ADD COLUMN IF NOT EXISTS last_decay_date date;
