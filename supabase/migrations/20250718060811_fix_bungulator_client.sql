-- Fix the client record that has "Bungulator" as company name
UPDATE clients 
SET company_name = 'Test Company' 
WHERE company_name = 'Bungulator' OR company_name ILIKE '%bungulator%';
 
-- Also update any user profiles that might have incorrect company names
UPDATE user_profiles 
SET company_name = 'Test Company' 
WHERE company_name = 'Bungulator' OR company_name ILIKE '%bungulator%'; 