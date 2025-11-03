-- Add is_archived field to jobs table for persistent archiving
ALTER TABLE jobs 
ADD COLUMN is_archived BOOLEAN DEFAULT FALSE NOT NULL;

-- Add index for faster queries filtering by archived status
CREATE INDEX idx_jobs_is_archived ON jobs(is_archived);

-- Add index for user_id + is_archived combination for efficient user-specific queries
CREATE INDEX idx_jobs_user_archived ON jobs(user_id, is_archived);





























