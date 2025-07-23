/*
  # Allow unauthenticated client insertions

  1. Security Changes
    - Update INSERT policy on `clients` table to allow unauthenticated users
    - Allow `user_id` to be NULL for free tier submissions
    - Maintain security for authenticated users

  This enables the free shortlist feature where users can submit without creating an account first.
*/

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert own client data" ON clients;

-- Create new INSERT policy that allows both authenticated and unauthenticated insertions
CREATE POLICY "Allow client insertions for free tier and authenticated users"
  ON clients
  FOR INSERT
  TO public
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());