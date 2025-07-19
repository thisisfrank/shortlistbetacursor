-- Check what tables currently exist in the database
-- This will help us see if there's a job_submissions table that needs to be removed

SELECT 'Current tables in database:' as info;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

SELECT 'Columns in jobs table:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'jobs' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Check if job_submissions table exists:' as info;
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'job_submissions' 
  AND table_schema = 'public'
) as job_submissions_exists;

SELECT 'Current data in jobs table:' as info;
SELECT id, user_id, company_name, title, status, created_at 
FROM jobs 
ORDER BY created_at DESC 
LIMIT 5; 