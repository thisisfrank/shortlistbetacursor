-- Add user_email column to jobs table
-- This is required for the job submission to work properly

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS user_email text;

-- Update existing jobs to have user_email from user_profiles
UPDATE jobs 
SET user_email = up.email 
FROM user_profiles up 
WHERE jobs.user_id = up.id 
AND jobs.user_email IS NULL;

-- Make user_email NOT NULL after populating existing data
ALTER TABLE jobs ALTER COLUMN user_email SET NOT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_jobs_user_email ON jobs(user_email);

-- Add comment
COMMENT ON COLUMN jobs.user_email IS 'Email of the user who submitted the job'; 