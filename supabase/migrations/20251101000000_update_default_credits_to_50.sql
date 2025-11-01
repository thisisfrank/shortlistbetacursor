-- Update default credits from 20 to 50
-- This migration updates the trigger functions that create user profiles

-- Update handle_new_user function with new default credits
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
    50, -- Default credits (updated from 20 to 50)
    1,  -- Default jobs remaining
    'free', -- Default subscription status
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING; -- Prevent duplicate key errors
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update handle_user_email_confirmed function with new default credits
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
      50, -- Default credits (updated from 20 to 50)
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
COMMENT ON FUNCTION public.handle_new_user() IS 
'Creates user profile automatically when user signs up with confirmed email. Uses SECURITY DEFINER to bypass RLS. Default credits: 50';

COMMENT ON FUNCTION public.handle_user_email_confirmed() IS 
'Creates user profile when existing unconfirmed user confirms their email. Default credits: 50';

