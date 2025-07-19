-- Clean up any job_submissions table confusion
-- Ensure we only have the jobs table as the single source of truth

-- Check if job_submissions table exists and drop it if it does
DROP TABLE IF EXISTS job_submissions CASCADE;

-- Also check for any potential variations
DROP TABLE IF EXISTS "job_submissions" CASCADE;
DROP TABLE IF EXISTS job_submission CASCADE;
DROP TABLE IF EXISTS "job_submission" CASCADE;

-- Ensure jobs table is the only table for job data
-- This should already exist from previous migrations, but let's make sure it's correct

-- Verify jobs table structure is correct
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS seniority_level text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS work_arrangement text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_range_min integer;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_range_max integer;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS key_selling_points text[];
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS status text DEFAULT 'Unclaimed';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS sourcer_name text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS completion_link text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS candidates_requested integer DEFAULT 1;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Remove any old client_id column if it still exists
ALTER TABLE jobs DROP COLUMN IF EXISTS client_id;

-- Ensure proper constraints
ALTER TABLE jobs ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE jobs ALTER COLUMN company_name SET NOT NULL;
ALTER TABLE jobs ALTER COLUMN title SET NOT NULL;
ALTER TABLE jobs ALTER COLUMN description SET NOT NULL;

-- Add comment to clarify the architecture
COMMENT ON TABLE jobs IS 'Job submissions - each job represents a client job submission with its own company info';

-- Show final table structure
SELECT 'Final table list (should only show jobs, not job_submissions):' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
AND table_name LIKE '%job%'
ORDER BY table_name; 