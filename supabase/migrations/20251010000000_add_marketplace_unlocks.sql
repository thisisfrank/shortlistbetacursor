-- Create user_marketplace_unlocks table
CREATE TABLE IF NOT EXISTS user_marketplace_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_marketplace_unlocks_user_id ON user_marketplace_unlocks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_marketplace_unlocks_item_id ON user_marketplace_unlocks(item_id);

-- Enable RLS
ALTER TABLE user_marketplace_unlocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own unlocks
CREATE POLICY "Users can view their own unlocks"
  ON user_marketplace_unlocks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own unlocks
CREATE POLICY "Users can unlock items for themselves"
  ON user_marketplace_unlocks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all unlocks
CREATE POLICY "Admins can view all unlocks"
  ON user_marketplace_unlocks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Add comment
COMMENT ON TABLE user_marketplace_unlocks IS 'Tracks which marketplace items each user has unlocked';

