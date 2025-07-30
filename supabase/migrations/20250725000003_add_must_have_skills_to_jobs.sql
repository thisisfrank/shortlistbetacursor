-- Add must_have_skills column to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS must_have_skills text[];

-- Set key_selling_points to NULL for all jobs
UPDATE jobs SET key_selling_points = NULL; 