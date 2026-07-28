-- Enable Supabase Realtime on the notifications table so the app
-- can instantly reflect new / updated notifications via postgres_changes.
alter publication supabase_realtime add table public.notifications;
