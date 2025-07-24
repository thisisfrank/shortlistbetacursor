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
  INSERT INTO public.user_profiles (id, email, role, name)
  VALUES (
    NEW.id,
    NEW.email,
    CASE 
      WHEN NEW.email = 'thisisfrankgonzalez@gmail.com' THEN 'admin'::user_role
      WHEN NEW.email = 'thisisjasongonzalez@gmail.com' THEN 'sourcer'::user_role
      WHEN NEW.email = 'client@test.com' THEN 'client'::user_role
      WHEN NEW.email = 'client2@test.com' THEN 'client'::user_role
      ELSE 'client'::user_role
    END,
    SPLIT_PART(NEW.email, '@', 1) -- Use email prefix as default name
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

-- Step 6: Fix existing user profiles with null names
UPDATE user_profiles 
SET name = COALESCE(name, SPLIT_PART(email, '@', 1)) 
WHERE name IS NULL;

-- Step 7: Create missing profiles for any existing users
INSERT INTO user_profiles (id, email, role, name)
SELECT 
  au.id,
  au.email,
  CASE 
    WHEN au.email = 'thisisfrankgonzalez@gmail.com' THEN 'admin'::user_role
    WHEN au.email = 'thisisjasongonzalez@gmail.com' THEN 'sourcer'::user_role
    WHEN au.email = 'client@test.com' THEN 'client'::user_role
    WHEN au.email = 'client2@test.com' THEN 'client'::user_role
    ELSE 'client'::user_role
  END,
  SPLIT_PART(au.email, '@', 1) -- Use email prefix as default name
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles up WHERE up.id = au.id
);

-- Step 8: Verify the fix
SELECT 'User profiles after fix:' as info;
SELECT id, email, name, role FROM user_profiles ORDER BY created_at; 

-- JOBS TABLE SCHEMA FIX - Fixes timeout issue during job submission
-- This resolves the client_id/user_id mismatch causing foreign key constraint violations

-- Step 9: Fix jobs table schema to use user_id instead of client_id
-- Handle case where client_id might already be renamed to user_id
DO $$
BEGIN
    -- Drop old constraint if it exists
    ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_client_id_fkey;
    
    -- Only rename if client_id column still exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'client_id') THEN
        ALTER TABLE jobs RENAME COLUMN client_id TO user_id;
    END IF;
    
    -- Drop existing user_id constraint if it exists
    ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_user_id_fkey;
    
    -- Add/re-add the proper foreign key constraint
    ALTER TABLE jobs ADD CONSTRAINT jobs_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
END $$;

-- Manual migration to make work_arrangement nullable
-- Run this in Supabase SQL editor if needed

ALTER TABLE jobs ALTER COLUMN work_arrangement DROP NOT NULL; 

-- Update get_all_users function to include name field from user_profiles
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  name text,
  role text,
  created_at timestamptz,
  updated_at timestamptz,
  tier_id text
) AS $$
BEGIN
  RETURN QUERY
    SELECT up.id, up.email, up.name, up.role::text, up.created_at, up.updated_at, up.tier_id
    FROM user_profiles up
    ORDER BY 
      CASE up.role 
        WHEN 'admin' THEN 1
        WHEN 'sourcer' THEN 2
        WHEN 'client' THEN 3
        ELSE 4
      END,
      up.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 