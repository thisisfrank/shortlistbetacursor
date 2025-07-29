-- Add RLS policies for user_profiles table
-- Allows users to view and update their own profile
-- Allows admins to view, update, and delete all profiles
-- Keeps existing insert policy (users can insert their own profile)

-- Enable RLS if not already enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile or admins can view all" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile or admins can update all" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Only admins can delete profiles" ON user_profiles;

-- SELECT policy: users can view their own profile, admins can view all
CREATE POLICY "Users can view their own profile or admins can view all"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR role = 'admin'
  );

-- UPDATE policy: users can update their own profile, admins can update all
CREATE POLICY "Users can update their own profile or admins can update all"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid() OR role = 'admin'
  );

-- INSERT policy: users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    id = auth.uid()
  );

-- DELETE policy: only admins can delete profiles
CREATE POLICY "Only admins can delete profiles"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (
    role = 'admin'
  ); 