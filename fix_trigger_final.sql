-- Fix the trigger function with the correct tier ID
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role text;
  user_name text;
  free_tier_id uuid;
BEGIN
  -- Get the actual Free tier ID
  SELECT id INTO free_tier_id FROM public.tiers WHERE name = 'Free' LIMIT 1;
  
  -- Determine role (default to client, but allow for special emails)
  IF NEW.email = 'thisisfrankgonzalez@gmail.com' THEN
    user_role := 'admin';
  ELSIF NEW.email = 'thisisjasongonzalez@gmail.com' THEN
    user_role := 'sourcer';
  ELSE
    user_role := 'client';
  END IF;

  user_name := SPLIT_PART(NEW.email, '@', 1);

  -- Use explicit schema reference and handle any errors gracefully
  BEGIN
    IF user_role = 'client' THEN
      INSERT INTO public.user_profiles (id, email, role, tier_id, name)
      VALUES (
        NEW.id,
        NEW.email,
        user_role,
        free_tier_id,  -- Use the actual Free tier ID
        user_name
      );
    ELSE
      INSERT INTO public.user_profiles (id, email, role, tier_id, name)
      VALUES (
        NEW.id,
        NEW.email,
        user_role,
        NULL,  -- Non-clients don't get a tier
        user_name
      );
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail user creation
      RAISE WARNING 'Failed to create user profile for %: %', NEW.email, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now manually create the profile for the existing user
INSERT INTO public.user_profiles (id, email, role, tier_id, name)
VALUES (
  '23d32ee5-e911-42f4-974d-cc65a6a90c96',
  'client@test.com',
  'client',
  '53e97fd9-2be2-4908-a356-dd7704b1ac20',  -- Correct Free tier ID
  'client'
)
ON CONFLICT (id) DO NOTHING;

SELECT 'Trigger function fixed with correct tier ID and existing user profile created' as status;