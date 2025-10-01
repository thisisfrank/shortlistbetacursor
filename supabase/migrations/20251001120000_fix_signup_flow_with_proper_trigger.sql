-- Fix signup flow with proper industry-standard trigger
-- This migration creates a trigger that fires ONLY when email is confirmed

-- First, update the handle_new_user function to create profiles for ALL users (not just admin/sourcer)
-- and make it work properly with email confirmation timing
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
  -- This ensures profiles are only created for verified users
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
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the proper trigger that fires ONLY when email gets confirmed
-- This replaces any existing trigger and ensures it fires at the right time
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();

-- Also create a trigger for when existing unconfirmed users get confirmed
-- This handles the case where user signs up, then later confirms email
CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
RETURNS trigger AS $$
DECLARE
  user_role text;
  user_name text;
  user_company text;
BEGIN
  -- Only act when email confirmation status changes from NULL to confirmed
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    
    -- Check if profile already exists (shouldn't happen, but safety check)
    IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = NEW.id) THEN
      
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
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for email confirmation updates
DROP TRIGGER IF EXISTS on_user_email_confirmed ON auth.users;

CREATE TRIGGER on_user_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_email_confirmed();

-- Add helpful comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates user profile automatically when user signs up with confirmed email';
COMMENT ON FUNCTION public.handle_user_email_confirmed() IS 'Creates user profile when existing unconfirmed user confirms their email';
