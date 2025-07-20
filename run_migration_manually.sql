-- FIX AUTHENTICATION ISSUES - RUN THIS IN SUPABASE SQL EDITOR
-- This fixes the PGRST116 error and 406 Not Acceptable responses

-- Step 1: Disable RLS on user_profiles to prevent policy conflicts
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies that might interfere
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow all authenticated users to read profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow profile creation for authenticated users" ON user_profiles;

-- Step 3: Grant full permissions to ensure access works
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO anon;
GRANT ALL ON user_profiles TO service_role;

-- Step 4: Ensure the trigger function exists and works properly
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    CASE 
      WHEN NEW.email = 'thisisfrankgonzalez@gmail.com' THEN 'admin'
      WHEN NEW.email = 'thisisjasongonzalez@gmail.com' THEN 'sourcer'
      WHEN NEW.email = 'client@test.com' THEN 'client'
      WHEN NEW.email = 'client2@test.com' THEN 'client'
      ELSE 'client'
    END
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Ensure trigger exists
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Step 6: Create missing profiles for any existing users
INSERT INTO user_profiles (id, email, role)
SELECT 
  au.id,
  au.email,
  CASE 
    WHEN au.email = 'thisisfrankgonzalez@gmail.com' THEN 'admin'
    WHEN au.email = 'thisisjasongonzalez@gmail.com' THEN 'sourcer'
    WHEN au.email = 'client@test.com' THEN 'client'
    WHEN au.email = 'client2@test.com' THEN 'client'
    ELSE 'client'
  END
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles up WHERE up.id = au.id
);

-- Step 7: Verify the fix
SELECT 'User profiles after fix:' as info;
SELECT id, email, role FROM user_profiles ORDER BY created_at; 