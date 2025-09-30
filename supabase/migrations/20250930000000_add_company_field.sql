-- Add company field to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN company TEXT;

-- Add comment to document the new field
COMMENT ON COLUMN user_profiles.company IS 'Company name provided during user signup';
