-- Add tier_id column to user_profiles for tier management
ALTER TABLE user_profiles ADD COLUMN tier_id uuid NULL;

-- Add foreign key constraint to tiers(id)
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_tier_id_fkey FOREIGN KEY (tier_id) REFERENCES tiers(id);

-- Optional: Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_tier_id ON user_profiles(tier_id); 