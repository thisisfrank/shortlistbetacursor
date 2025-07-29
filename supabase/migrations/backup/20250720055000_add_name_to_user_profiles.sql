-- Add name field to user_profiles table
ALTER TABLE user_profiles ADD COLUMN name text;

-- Update existing users with a default name based on their email
UPDATE user_profiles SET name = SPLIT_PART(email, '@', 1) WHERE name IS NULL;

-- Make the name column required for future users
ALTER TABLE user_profiles ALTER COLUMN name SET NOT NULL; 