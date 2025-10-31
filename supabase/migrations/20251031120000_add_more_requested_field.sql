-- Add more_requested field to jobs table to track when clients request additional candidates
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS more_requested BOOLEAN DEFAULT false;

-- Add helpful comment
COMMENT ON COLUMN jobs.more_requested IS 'Indicates when a client has requested more candidates for this job. Shows badge in sourcer hub.';

