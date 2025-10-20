ALTER TABLE profiles 
ADD COLUMN selected_daily_habits text[] 
DEFAULT ARRAY['gym', 'reflect', 'focus', 'sleep', 'water', 'run', 'microlearn', 'cold_shower'];
