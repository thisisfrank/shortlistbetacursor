-- Fix candidates table RLS policies
-- The old policies reference the clients table which no longer exists

-- Drop old policies
DROP POLICY IF EXISTS "Users can read candidates for their jobs" ON candidates;
DROP POLICY IF EXISTS "Sourcers can insert candidates" ON candidates;
DROP POLICY IF EXISTS "Admins can manage all candidates" ON candidates;

-- Create new policies that work with the current schema
CREATE POLICY "Users can read candidates for their jobs"
  ON candidates
  FOR SELECT
  TO authenticated
  USING (
    job_id IN (
      SELECT j.id FROM jobs j, clients c
      WHERE j.client_id = c.id 
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Sourcers can insert candidates"
  ON candidates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('sourcer', 'admin')
    )
  );

CREATE POLICY "Admins can manage all candidates"
  ON candidates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add policy for updating candidates (for admins)
CREATE POLICY "Admins can update candidates"
  ON candidates
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add policy for deleting candidates (for admins)
CREATE POLICY "Admins can delete candidates"
  ON candidates
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  ); 