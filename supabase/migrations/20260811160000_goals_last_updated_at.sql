-- Add last_updated_at for goal progress / activity timestamps
alter table public.goals
  add column if not exists last_updated_at timestamptz;

comment on column public.goals.last_updated_at is
  'Last time the goal was updated (progress bump, edit, etc.)';
