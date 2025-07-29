/*
  # Core Schema v2 - User Management, Tiers, and Companies
  
  Creates the foundation for user management, subscription tiers, 
  and company organization. Incorporates all schema improvements.
*/

-- Create user role enum
CREATE TYPE user_role AS ENUM ('client', 'sourcer', 'admin');

-- Create job status enum  
CREATE TYPE job_status AS ENUM ('Unclaimed', 'Claimed', 'Completed');

-- Create candidate status enum
CREATE TYPE candidate_status AS ENUM ('pending', 'analyzing', 'accepted', 'rejected');

-- Create tiers table for subscription management
CREATE TABLE tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  monthly_job_allotment integer NOT NULL,
  monthly_candidate_allotment integer NOT NULL,
  includes_company_emails boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Insert tier definitions with fixed UUID for Free tier
INSERT INTO tiers (id, name, monthly_job_allotment, monthly_candidate_allotment, includes_company_emails) VALUES
  ('5841d1d6-20d7-4360-96f8-0444305fac5b', 'Free', 1, 20, false),
  (gen_random_uuid(), 'Tier 1', 1, 50, true),
  (gen_random_uuid(), 'Tier 2', 3, 150, true),
  (gen_random_uuid(), 'Tier 3', 10, 400, true);

-- Create companies table for job organization
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create user_profiles table (single source of truth for all users)
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role user_role NOT NULL DEFAULT 'client',
  tier_id uuid REFERENCES tiers(id),
  -- Client-specific fields (only populated for role='client')
  company_name text,
  phone text,
  available_credits integer DEFAULT 20,
  jobs_remaining integer DEFAULT 1,
  credits_reset_date timestamptz DEFAULT (now() + interval '30 days'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create utility function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;



-- Create function to get all users (for admin use)
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  name text,
  role text,
  created_at timestamptz,
  updated_at timestamptz,
  tier_id uuid
) AS $$
BEGIN
  RETURN QUERY
    SELECT up.id, up.email, up.name, up.role::text, up.created_at, up.updated_at, up.tier_id
    FROM user_profiles up
    ORDER BY 
      CASE up.role 
        WHEN 'admin' THEN 1
        WHEN 'sourcer' THEN 2  
        WHEN 'client' THEN 3
        ELSE 4
      END,
      up.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_user_profiles_tier_id ON user_profiles(tier_id);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_companies_name ON companies(name);

-- Comments
COMMENT ON TABLE tiers IS 'Subscription tiers with job and candidate limits';
COMMENT ON TABLE user_profiles IS 'All user information including client-specific data';
COMMENT ON TABLE companies IS 'Company information for job organization';
