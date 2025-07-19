-- Test basic RLS policy for user_profiles
-- Let's start with the most basic policy and test

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
 
-- Add the most basic policy - users can read their own profile
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid()); 