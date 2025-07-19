-- Fix the SELECT policy for user_profiles
-- The issue is likely type casting between auth.uid() and the id column

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
 
-- Create a fixed policy with proper type casting
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT
  TO authenticated
  USING (id::text = auth.uid()::text); 