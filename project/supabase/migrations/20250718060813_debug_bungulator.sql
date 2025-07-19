-- Debug migration to find where "Bungulator" is coming from

-- Check what's in the jobs table
SELECT 'Jobs table contents:' as info;
SELECT id, client_id, company_name, title FROM jobs WHERE company_name ILIKE '%bungulator%';

-- Check what's in the clients table
SELECT 'Clients table contents:' as info;
SELECT id, company_name, email FROM clients WHERE company_name ILIKE '%bungulator%';

-- Check if there are any functions that might be setting this
SELECT 'Functions that might set company_name:' as info;
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_definition ILIKE '%bungulator%';

-- Check if there are any triggers on the jobs table
SELECT 'Triggers on jobs table:' as info;
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'jobs';

-- Check if there are any default values
SELECT 'Default values for company_name:' as info;
SELECT column_name, column_default 
FROM information_schema.columns 
WHERE table_name = 'jobs' AND column_name = 'company_name'; 