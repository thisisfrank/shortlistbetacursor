-- Clean up client@test.com data definitively
-- This addresses the Jason Gonzalez / Bullnose Design issue at the database level

-- Show current state
SELECT 'BEFORE - client@test.com data:' as status;
SELECT id, email, contact_name, company_name, created_at FROM clients WHERE email = 'client@test.com';

-- Delete ALL existing client records for client@test.com
DELETE FROM clients WHERE email = 'client@test.com';

-- Create a clean client record
INSERT INTO clients (
  user_id,
  company_name,
  contact_name,
  email,
  phone,
  available_credits,
  jobs_remaining,
  has_received_free_shortlist,
  created_at
) VALUES (
  (SELECT id FROM user_profiles WHERE email = 'client@test.com'),
  'My Company',
  'Client User',
  'client@test.com',
  '555-0123',
  20,
  1,
  false,
  NOW()
);

-- Show final state
SELECT 'AFTER - client@test.com data:' as status;
SELECT id, email, contact_name, company_name, created_at FROM clients WHERE email = 'client@test.com'; 