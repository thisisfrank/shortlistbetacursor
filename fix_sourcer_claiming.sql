-- Fix sourcer job claiming RLS policy
-- Run this SQL directly in your Supabase SQL editor or database

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can update jobs for their clients" ON jobs;

-- Create a new policy that allows clients to update their own jobs, but doesn't block sourcers
CREATE POLICY "Users can update jobs for their clients"
  ON jobs FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid() AND 
    NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'sourcer')
  );

-- Also update the sourcer read policy to allow reading claimed jobs
DROP POLICY IF EXISTS "Sourcers can read unclaimed jobs" ON jobs;

CREATE POLICY "Sourcers can read jobs"
  ON jobs FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'sourcer') AND (
      status = 'Unclaimed' OR sourcer_id = auth.uid()
    )
  );

-- Verify the policies are working
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'jobs'; 