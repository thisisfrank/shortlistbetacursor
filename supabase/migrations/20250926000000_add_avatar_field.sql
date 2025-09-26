-- Add avatar field to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN avatar TEXT DEFAULT '👤';

-- Add comment for the new field
COMMENT ON COLUMN public.user_profiles.avatar IS 'User selected avatar emoji for profile display';
