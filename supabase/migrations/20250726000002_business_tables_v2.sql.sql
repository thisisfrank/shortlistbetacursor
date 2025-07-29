/*
  # Business Tables v2 - Jobs, Candidates, and Transactions
  
  Creates the core business logic tables with proper relationships,
  constraints, and all necessary fields for the complete workflow.
*/

-- Create jobs table with company relationship and business constraints
CREATE TABLE jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  seniority_level text NOT NULL,
  work_arrangement text,
  location text NOT NULL,
  salary_range_min integer NOT NULL,
  salary_range_max integer NOT NULL,
  key_selling_points text[] DEFAULT '{}',
  status job_status DEFAULT 'Unclaimed',
  sourcer_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  completion_link text,
  candidates_requested integer DEFAULT 1 CHECK (candidates_requested > 0 AND candidates_requested <= 10),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create function to validate status transitions (with admin override)
CREATE OR REPLACE FUNCTION validate_job_status_transition()
RETURNS TRIGGER AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Check if current user is admin (admins can override any transition)
  SELECT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) INTO is_admin;
  
  -- Admins can do anything, bypass validation
  IF is_admin THEN
    RETURN NEW;
  END IF;
  
  -- For non-admins, enforce business workflow rules
  IF NEW.status = 'Unclaimed' AND NEW.sourcer_id IS NOT NULL THEN
    RAISE EXCEPTION 'Unclaimed jobs cannot have a sourcer assigned';
  END IF;
  
  IF NEW.status IN ('Claimed', 'Completed') AND NEW.sourcer_id IS NULL THEN
    RAISE EXCEPTION 'Claimed/Completed jobs must have a sourcer assigned';
  END IF;
  
  -- Prevent invalid backward transitions for non-admins
  IF OLD.status = 'Completed' AND NEW.status IN ('Unclaimed', 'Claimed') THEN
    RAISE EXCEPTION 'Cannot move completed job back to previous status (admin required)';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for status validation
CREATE TRIGGER validate_job_status_transition_trigger
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION validate_job_status_transition();

-- Create candidates table with AI analysis support
CREATE TABLE candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  linkedin_url text NOT NULL,
  headline text,
  location text,
  experience jsonb,
  education jsonb,
  skills text[] DEFAULT '{}',
  summary text,
  status candidate_status DEFAULT 'pending',
  anthropic_analysis jsonb,
  anthropic_score numeric(3,2),
  rejection_reason text,
  accepted_at timestamptz,
  rejected_at timestamptz,
  submitted_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create credit transactions table for audit trail
CREATE TABLE credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('deduction', 'addition', 'reset')),
  amount integer NOT NULL,
  description text,
  job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create function to enforce candidate limits
CREATE OR REPLACE FUNCTION check_candidate_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count integer;
  max_candidates integer;
BEGIN
  -- Get current candidate count and limit for this job
  SELECT 
    COUNT(*),
    j.candidates_requested
  INTO current_count, max_candidates
  FROM candidates c
  JOIN jobs j ON c.job_id = j.id
  WHERE c.job_id = NEW.job_id
  GROUP BY j.candidates_requested;
  
  -- Check if adding this candidate would exceed the limit
  IF current_count >= max_candidates THEN
    RAISE EXCEPTION 'Cannot submit more than % candidates for this job', max_candidates;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to sync user email to jobs table
CREATE OR REPLACE FUNCTION sync_jobs_user_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE jobs 
  SET user_email = NEW.email 
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to enforce candidate limits
CREATE TRIGGER enforce_candidate_limit
  BEFORE INSERT ON candidates
  FOR EACH ROW EXECUTE FUNCTION check_candidate_limit();

-- Create trigger to sync email changes
CREATE TRIGGER sync_user_email
  AFTER UPDATE OF email ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION sync_jobs_user_email();

-- Create indexes for performance
CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_jobs_user_email ON jobs(user_email);
CREATE INDEX idx_jobs_company_id ON jobs(company_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_sourcer_id ON jobs(sourcer_id);
CREATE INDEX idx_candidates_job_id ON candidates(job_id);
CREATE INDEX idx_candidates_status ON candidates(status);
CREATE INDEX idx_candidates_submitted_at ON candidates(submitted_at);
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at);

-- Comments
COMMENT ON TABLE jobs IS 'Job postings with sourcing workflow and company relationship';
COMMENT ON TABLE candidates IS 'Candidate submissions with AI analysis and scoring';
COMMENT ON TABLE credit_transactions IS 'Audit trail for all credit transactions';
COMMENT ON COLUMN jobs.user_email IS 'Email of the user who submitted the job';
COMMENT ON COLUMN candidates.anthropic_score IS 'AI confidence score (0-1), auto-accept if >0.6';