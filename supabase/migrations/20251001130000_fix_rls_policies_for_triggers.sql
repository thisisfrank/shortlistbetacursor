-- Fix RLS policies to allow database triggers to work properly
-- This migration resolves the 406/403 errors by fixing conflicting policies

-- First, drop the conflicting/duplicate RLS policies
DROP POLICY IF EXISTS "Allow authenticated users to insert their own profile" ON "public"."user_profiles";
DROP POLICY IF EXISTS "Users can insert their own profile" ON "public"."user_profiles";
DROP POLICY IF EXISTS "Users can read own profile" ON "public"."user_profiles";
DROP POLICY IF EXISTS "Users can update own profile" ON "public"."user_profiles";

-- Create clean, non-conflicting RLS policies for user_profiles
-- Allow users to read their own profile OR admins to read all profiles
CREATE POLICY "Users can view their own profile or admins can view all" 
ON "public"."user_profiles" 
FOR SELECT TO "authenticated" 
USING (
  ("id" = "auth"."uid"()) OR 
  ("role" = 'admin'::"public"."user_role")
);

-- Allow users to update their own profile OR admins to update all profiles  
CREATE POLICY "Users can update their own profile or admins can update all" 
ON "public"."user_profiles" 
FOR UPDATE TO "authenticated" 
USING (
  ("id" = "auth"."uid"()) OR 
  ("role" = 'admin'::"public"."user_role")
);

-- Allow users to insert their own profile (for manual profile creation)
-- AND allow service role to insert any profile (for database triggers)
CREATE POLICY "Users can insert their own profile" 
ON "public"."user_profiles" 
FOR INSERT TO "authenticated" 
WITH CHECK ("id" = "auth"."uid"());

-- CRITICAL: Allow service role to bypass RLS for trigger operations
-- This is what allows our database triggers to create profiles automatically
CREATE POLICY "Service role can manage all profiles" 
ON "public"."user_profiles" 
FOR ALL TO "service_role" 
USING (true) 
WITH CHECK (true);

-- Update the trigger functions to use SECURITY DEFINER with service role permissions
-- This ensures triggers run with elevated permissions to bypass RLS

-- Update handle_new_user function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_role text;
  user_name text;
  user_company text;
BEGIN
  -- Get role from user metadata if available, otherwise determine by email
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
  
  -- Override role for special admin/sourcer emails
  IF NEW.email = 'thisisfrankgonzalez@gmail.com' THEN
    user_role := 'admin';
  ELSIF NEW.email = 'thisisjasongonzalez@gmail.com' THEN
    user_role := 'sourcer';
  END IF;

  -- Get name and company from metadata
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', '');
  user_company := NEW.raw_user_meta_data->>'company';

  -- Create profile for ALL users when they get email confirmed
  -- Using INSERT with ON CONFLICT to handle any race conditions
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
    NEW.id,
    NEW.email,
    user_role::public.user_role,
    '5841d1d6-20d7-4360-96f8-0444305fac5b', -- Free tier ID
    CASE 
      WHEN user_role IN ('admin', 'sourcer') AND user_name = '' THEN SPLIT_PART(NEW.email, '@', 1)
      ELSE user_name
    END,
    user_company,
    20, -- Default credits
    1,  -- Default jobs remaining
    'free', -- Default subscription status
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING; -- Prevent duplicate key errors
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update handle_user_email_confirmed function similarly
CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
RETURNS trigger AS $$
DECLARE
  user_role text;
  user_name text;
  user_company text;
BEGIN
  -- Only act when email confirmation status changes from NULL to confirmed
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    
    -- Get role from user metadata if available, otherwise determine by email
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
    
    -- Override role for special admin/sourcer emails
    IF NEW.email = 'thisisfrankgonzalez@gmail.com' THEN
      user_role := 'admin';
    ELSIF NEW.email = 'thisisjasongonzalez@gmail.com' THEN
      user_role := 'sourcer';
    END IF;

    -- Get name and company from metadata
    user_name := COALESCE(NEW.raw_user_meta_data->>'name', '');
    user_company := NEW.raw_user_meta_data->>'company';

    -- Create the profile with ON CONFLICT to handle race conditions
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
      NEW.id,
      NEW.email,
      user_role::public.user_role,
      '5841d1d6-20d7-4360-96f8-0444305fac5b', -- Free tier ID
      CASE 
        WHEN user_role IN ('admin', 'sourcer') AND user_name = '' THEN SPLIT_PART(NEW.email, '@', 1)
        ELSE user_name
      END,
      user_company,
      20, -- Default credits
      1,  -- Default jobs remaining
      'free', -- Default subscription status
      NOW(),
      NOW()
    ) ON CONFLICT (id) DO NOTHING; -- Prevent duplicate key errors
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helpful comments
COMMENT ON POLICY "Service role can manage all profiles" ON "public"."user_profiles" IS 
'Allows service role (used by database triggers) to bypass RLS and create/manage profiles automatically';

COMMENT ON FUNCTION public.handle_new_user() IS 
'Creates user profile automatically when user signs up with confirmed email. Uses SECURITY DEFINER to bypass RLS.';

COMMENT ON FUNCTION public.handle_user_email_confirmed() IS 
'Creates user profile when existing unconfirmed user confirms their email. Uses SECURITY DEFINER to bypass RLS.';
