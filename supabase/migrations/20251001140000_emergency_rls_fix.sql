-- Emergency RLS fix for production signup issues
-- This migration specifically fixes the 406/403 errors

-- Drop conflicting RLS policies (use IF EXISTS to avoid errors)
DROP POLICY IF EXISTS "Allow authenticated users to insert their own profile" ON "public"."user_profiles";
DROP POLICY IF EXISTS "Users can insert their own profile" ON "public"."user_profiles";
DROP POLICY IF EXISTS "Users can read own profile" ON "public"."user_profiles";
DROP POLICY IF EXISTS "Users can update own profile" ON "public"."user_profiles";

-- CRITICAL: Allow service role to bypass RLS for trigger operations (if not exists)
DROP POLICY IF EXISTS "Service role can manage all profiles" ON "public"."user_profiles";
CREATE POLICY "Service role can manage all profiles" 
ON "public"."user_profiles" 
FOR ALL TO "service_role" 
USING (true) 
WITH CHECK (true);

-- Allow users to insert their own profile (for manual profile creation)
DROP POLICY IF EXISTS "Users can insert their own profile" ON "public"."user_profiles";
CREATE POLICY "Users can insert their own profile" 
ON "public"."user_profiles" 
FOR INSERT TO "authenticated" 
WITH CHECK ("id" = "auth"."uid"());

-- Update the trigger functions to handle existing users
-- This will create profiles for users who are already confirmed but missing profiles
CREATE OR REPLACE FUNCTION public.create_missing_profile_for_user(user_id uuid)
RETURNS void AS $$
DECLARE
  user_record record;
  user_role text;
  user_name text;
  user_company text;
BEGIN
  -- Get user data from auth.users
  SELECT * INTO user_record FROM auth.users WHERE id = user_id;
  
  IF user_record.id IS NULL THEN
    RETURN; -- User doesn't exist
  END IF;
  
  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM public.user_profiles WHERE id = user_id) THEN
    RETURN; -- Profile already exists
  END IF;
  
  -- Get role from user metadata if available, otherwise determine by email
  user_role := COALESCE(user_record.raw_user_meta_data->>'role', 'client');
  
  -- Override role for special admin/sourcer emails
  IF user_record.email = 'thisisfrankgonzalez@gmail.com' THEN
    user_role := 'admin';
  ELSIF user_record.email = 'thisisjasongonzalez@gmail.com' THEN
    user_role := 'sourcer';
  END IF;

  -- Get name and company from metadata
  user_name := COALESCE(user_record.raw_user_meta_data->>'name', '');
  user_company := user_record.raw_user_meta_data->>'company';

  -- Create the profile
  INSERT INTO public.user_profiles (
    id, 
    email, 
    role, 
    tier_id, 
    name,
    company,
    available_credits,
    jobs_remaining,
    subscription_status,
    created_at,
    updated_at
  ) VALUES (
    user_record.id,
    user_record.email,
    user_role::public.user_role,
    '5841d1d6-20d7-4360-96f8-0444305fac5b', -- Free tier ID
    CASE 
      WHEN user_role IN ('admin', 'sourcer') AND user_name = '' THEN SPLIT_PART(user_record.email, '@', 1)
      ELSE user_name
    END,
    user_company,
    20, -- Default credits
    1,  -- Default jobs remaining
    'free', -- Default subscription status
    NOW(),
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create profile for the specific user having issues
SELECT public.create_missing_profile_for_user('4a149c7a-02ab-4317-a74f-5f858ae011a7'::uuid);

-- Add helpful comment
COMMENT ON FUNCTION public.create_missing_profile_for_user(uuid) IS 
'Emergency function to create missing profiles for existing confirmed users. Uses SECURITY DEFINER to bypass RLS.';
