-- Completely remove any "Bungulator" references and clean up client data

-- First, let's see what we have
SELECT 'Current clients with Bungulator:' as info;
SELECT id, company_name, email FROM clients WHERE company_name ILIKE '%bungulator%';

-- Update any clients with Bungulator to have a proper company name
UPDATE clients 
SET company_name = 'Test Company' 
WHERE company_name ILIKE '%bungulator%';

-- Also update any user profiles that might have incorrect company names
UPDATE user_profiles 
SET company_name = 'Test Company' 
WHERE company_name ILIKE '%bungulator%';

-- Delete any test/mock client records that might be causing issues
DELETE FROM clients 
WHERE email = 'client@test.com' AND company_name = 'Bungulator';

-- Ensure the client@test.com user has a proper client record
INSERT INTO clients (
  user_id,
  company_name,
  contact_name,
  email,
  phone,
  available_credits,
  jobs_remaining,
  has_received_free_shortlist
) VALUES (
  (SELECT id FROM user_profiles WHERE email = 'client@test.com'),
  'Test Company',
  'Test Contact',
  'client@test.com',
  '555-1234',
  20,
  1,
  false
) ON CONFLICT (email) DO UPDATE SET
  company_name = EXCLUDED.company_name,
  contact_name = EXCLUDED.contact_name,
  phone = EXCLUDED.phone;

-- Show the final state
SELECT 'Final client state:' as info;
SELECT id, company_name, email FROM clients WHERE email = 'client@test.com'; 