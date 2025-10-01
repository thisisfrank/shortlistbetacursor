-- Add avatar field to user_profiles table (if it doesn't exist)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' 
                   AND column_name = 'avatar') THEN
        ALTER TABLE public.user_profiles ADD COLUMN avatar TEXT DEFAULT '👤';
    END IF;
END $$;

-- Add comment for the new field
COMMENT ON COLUMN public.user_profiles.avatar IS 'User selected avatar emoji for profile display';
