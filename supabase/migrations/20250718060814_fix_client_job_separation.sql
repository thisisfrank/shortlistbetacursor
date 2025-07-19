-- Fix the separation between client profile and job data
-- The client profile should not be updated with job submission data

-- First, let's see what we have in the database
SELECT 'Current clients:' as info;
SELECT id, company_name, contact_name, email FROM clients;

SELECT 'Current jobs:' as info;
SELECT id, client_id, company_name, title FROM jobs;

-- Update any clients that have job company names to have generic company names
UPDATE clients 
SET company_name = 'My Company' 
WHERE company_name IN (
  SELECT DISTINCT company_name FROM jobs WHERE company_name IS NOT NULL
);

-- Also ensure user_profiles don't have company names from jobs
UPDATE user_profiles 
SET company_name = NULL 
WHERE company_name IS NOT NULL;

-- Add a comment to clarify the separation
COMMENT ON TABLE clients IS 'Client profiles - separate from job submissions';
COMMENT ON TABLE jobs IS 'Job submissions - each job has its own company name independent of client profile'; 