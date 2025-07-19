-- Fix the association between client@test.com and Jason Gonzalez/Bullnose Design
-- This addresses the specific issue where client@test.com shows Jason Gonzalez and Bullnose Design

-- First, let's see what's currently in the database
SELECT 'Current state for client@test.com:' as info;
SELECT id, company_name, contact_name, email FROM clients WHERE email = 'client@test.com';

-- Update any client records for client@test.com that have Jason Gonzalez data
UPDATE clients 
SET 
  company_name = 'My Company',
  contact_name = 'Client User'
WHERE email = 'client@test.com' 
  AND (contact_name ILIKE '%jason%' OR company_name ILIKE '%bullnose%');

-- Also check and update user_profiles if needed
SELECT 'Current user profile for client@test.com:' as info;
SELECT id, email, role FROM user_profiles WHERE email = 'client@test.com';

-- Remove any extra fields that might be causing the issue
UPDATE user_profiles 
SET company_name = NULL
WHERE email = 'client@test.com' AND company_name IS NOT NULL;

-- Ensure there's only one client record for client@test.com
DELETE FROM clients 
WHERE email = 'client@test.com' 
  AND id NOT IN (
    SELECT id FROM clients 
    WHERE email = 'client@test.com' 
    ORDER BY created_at DESC 
    LIMIT 1
  );

-- Show the final state
SELECT 'Final state for client@test.com:' as info;
SELECT id, company_name, contact_name, email, created_at FROM clients WHERE email = 'client@test.com'; 