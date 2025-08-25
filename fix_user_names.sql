-- Fix existing users who have email-based names
-- This script will clear names that are just the email prefix (before @ symbol)

-- First, let's see what we're working with
SELECT 
  id, 
  email, 
  name, 
  role,
  CASE 
    WHEN name = SPLIT_PART(email, '@', 1) THEN 'EMAIL_BASED_NAME'
    WHEN name = '' OR name IS NULL THEN 'EMPTY_NAME'
    ELSE 'GOOD_NAME'
  END as name_status
FROM user_profiles 
ORDER BY name_status, email;

-- Update users who have email-based names to have empty names
-- This will allow them to set proper names through the UI
UPDATE user_profiles 
SET name = '' 
WHERE name = SPLIT_PART(email, '@', 1) 
  AND name != '' 
  AND name IS NOT NULL;

-- Verify the changes
SELECT 
  id, 
  email, 
  name, 
  role,
  CASE 
    WHEN name = SPLIT_PART(email, '@', 1) THEN 'EMAIL_BASED_NAME'
    WHEN name = '' OR name IS NULL THEN 'EMPTY_NAME'
    ELSE 'GOOD_NAME'
  END as name_status
FROM user_profiles 
ORDER BY name_status, email;
