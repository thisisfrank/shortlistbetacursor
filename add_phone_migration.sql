-- Add phone number column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN phone_number text;

-- Add comment for the new column
COMMENT ON COLUMN public.user_profiles.phone_number IS 'Optional phone number for user contact';
