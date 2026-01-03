-- Add is_pro_only column to challenges table
ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS is_pro_only BOOLEAN DEFAULT false;

