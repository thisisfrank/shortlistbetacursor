-- Add user_email column to jobs table
-- This is required for the job submission to work properly

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS user_email text;

-- Update existing jobs to have user_email from user_profiles
-- Note: At this point in migration timeline, the column is still called client_id
-- It gets renamed to user_id in a later migration (20250725000002_fix_jobs_table_user_id.sql)
UPDATE jobs 
SET user_email = up.email 
FROM user_profiles up, clients c
WHERE jobs.client_id = c.id 
AND c.user_id = up.id
AND jobs.user_email IS NULL;

-- Make user_email NOT NULL after populating existing data
ALTER TABLE jobs ALTER COLUMN user_email SET NOT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_jobs_user_email ON jobs(user_email);

-- Add comment
COMMENT ON COLUMN jobs.user_email IS 'Email of the user who submitted the job'; 