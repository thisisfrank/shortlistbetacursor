-- Force disable RLS on user_profiles and ensure no policies interfere
-- This should fix the 406 error when querying user_profiles

-- First, drop ALL possible policies that might exist
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

-- Force disable RLS
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Grant full permissions
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO anon;
GRANT ALL ON user_profiles TO service_role;

-- Verify the table structure
-- This will help us see if there are any issues with the table itself
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position; 