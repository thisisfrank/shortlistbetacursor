-- Fix RLS policy for sourcers to allow claiming unclaimed jobs
-- The existing policy only allows updating "claimed" jobs, but sourcers need to claim unclaimed ones

-- Drop the overly restrictive existing policy
DROP POLICY IF EXISTS "Sourcers can update claimed jobs" ON jobs;

-- Create a new policy that allows sourcers to:
-- 1. Claim unclaimed jobs (change status from Unclaimed to Claimed)
-- 2. Update jobs they have claimed (where sourcer_name matches their user ID)
-- 3. Complete jobs they have claimed
CREATE POLICY "Sourcers can claim and update their jobs"
  ON jobs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'sourcer'
    ) AND (
      -- Can claim unclaimed jobs
      status = 'Unclaimed' OR
      -- Can update jobs they've claimed (sourcer_name should match their user ID as text)
      sourcer_name = auth.uid()::text
    )
  ); 