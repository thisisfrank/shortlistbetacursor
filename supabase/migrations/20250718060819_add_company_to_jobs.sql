-- Add companyName field to jobs table
-- This allows each job to have its own company, independent of the client

-- Add the companyName column
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_name text;

-- Update existing jobs to use a default value (can be updated later)
UPDATE jobs SET company_name = 'Unknown Company' WHERE company_name IS NULL;

-- Make the column required for future jobs
ALTER TABLE jobs ALTER COLUMN company_name SET NOT NULL; 