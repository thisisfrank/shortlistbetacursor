/*
  # Fix RLS policies for authentication and client submission

  1. User Profiles Table
    - Update SELECT policy to allow authenticated users to read their own profiles
    - Ensure policy uses correct auth.uid() function

  2. Clients Table  
    - Add policy to allow anonymous users to insert clients with null user_id
    - Keep existing policies for authenticated users

  3. Security
    - Maintain data isolation between users
    - Allow unauthenticated client submissions for free tier
*/

-- Fix user_profiles SELECT policy for authenticated users
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;

CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Add policy to allow anonymous users to insert clients
CREATE POLICY "Allow anonymous users to insert clients"
  ON clients
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Update existing policy name for clarity
DROP POLICY IF EXISTS "Allow client insertions for free tier and authenticated users" ON clients;

CREATE POLICY "Allow authenticated users to insert own clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());