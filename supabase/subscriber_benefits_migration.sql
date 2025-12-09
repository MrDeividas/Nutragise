-- Create store_items table
CREATE TABLE IF NOT EXISTS store_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price_tokens INTEGER NOT NULL,
  level_required INTEGER DEFAULT 1,
  image_url TEXT,
  is_pro_only BOOLEAN DEFAULT TRUE,
  type TEXT NOT NULL, -- 'raffle_ticket', 'item', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_inventory table
CREATE TABLE IF NOT EXISTS user_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES store_items(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 0,
  acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- Create raffles table
CREATE TABLE IF NOT EXISTS raffles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  prize_amount NUMERIC,
  draw_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'upcoming', -- 'upcoming', 'active', 'completed'
  ticket_item_id UUID REFERENCES store_items(id), -- Required ticket type to enter
  winner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create raffle_entries table
CREATE TABLE IF NOT EXISTS raffle_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  raffle_id UUID NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_used_id UUID REFERENCES user_inventory(id), -- Track which inventory item was used
  entered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns to profiles if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'tokens') THEN
        ALTER TABLE profiles ADD COLUMN tokens INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_pro') THEN
        ALTER TABLE profiles ADD COLUMN is_pro BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'level') THEN
        ALTER TABLE profiles ADD COLUMN level INTEGER DEFAULT 1;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE raffles ENABLE ROW LEVEL SECURITY;
ALTER TABLE raffle_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Store Items: Everyone can view, only admin can edit (assuming admin roles, simplified here)
CREATE POLICY "Public view store items" ON store_items FOR SELECT USING (true);

-- User Inventory: Users can view their own items
CREATE POLICY "Users view own inventory" ON user_inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own inventory" ON user_inventory FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own inventory" ON user_inventory FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Raffles: Everyone can view
CREATE POLICY "Public view raffles" ON raffles FOR SELECT USING (true);

-- Raffle Entries: Users can view their own entries, everyone can view (to see winners/participants count)
CREATE POLICY "Public view raffle entries" ON raffle_entries FOR SELECT USING (true);
CREATE POLICY "Users enter raffles" ON raffle_entries FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update all existing users to be PRO for testing
UPDATE profiles SET is_pro = TRUE;

-- Insert sample store item (Monthly Raffle Ticket)
INSERT INTO store_items (name, description, price_tokens, level_required, is_pro_only, type)
VALUES ('Monthly Raffle Ticket', 'Entry ticket for the £150 Monthly Giveaway', 1, 1, TRUE, 'raffle_ticket')
ON CONFLICT DO NOTHING;

-- Insert sample raffle
INSERT INTO raffles (title, description, prize_amount, draw_date, status, ticket_item_id)
SELECT 'Treat your hard work', 'Win £150 cash! Draw happens at the end of the month.', 150.00, NOW() + INTERVAL '30 days', 'active', id
FROM store_items WHERE name = 'Monthly Raffle Ticket'
LIMIT 1;

