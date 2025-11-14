-- Add company field to user_profiles table (if it doesn't exist)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' 
                   AND column_name = 'company') THEN
        ALTER TABLE user_profiles ADD COLUMN company TEXT;
    END IF;
END $$;

-- Add comment to document the new field
COMMENT ON COLUMN user_profiles.company IS 'Company name provided during user signup';
