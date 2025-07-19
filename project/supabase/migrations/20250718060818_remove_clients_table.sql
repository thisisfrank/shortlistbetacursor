-- Remove the clients table confusion and move everything to user level
-- This fixes the architectural flaw where users and clients were conflated

-- Step 1: Add subscription fields to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS tier_id TEXT DEFAULT 'tier-free';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS available_credits INTEGER DEFAULT 20;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS jobs_remaining INTEGER DEFAULT 1;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS credits_reset_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days');
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS has_received_free_shortlist BOOLEAN DEFAULT false;

-- Step 2: Update jobs table to reference users directly instead of clients
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_client_id_fkey;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Step 3: Migrate existing data (if any jobs exist)
UPDATE jobs 
SET user_id = (
  SELECT up.id 
  FROM user_profiles up 
  JOIN clients c ON c.user_id = up.id 
  WHERE c.id = jobs.client_id
) 
WHERE client_id IS NOT NULL;

-- Step 4: Remove the client_id column from jobs
ALTER TABLE jobs DROP COLUMN IF EXISTS client_id;

-- Step 5: Drop the clients table entirely
DROP TABLE IF EXISTS clients CASCADE;

-- Step 6: Initialize user subscription data
UPDATE user_profiles 
SET 
  tier_id = 'tier-free',
  available_credits = 20,
  jobs_remaining = 1,
  credits_reset_date = NOW() + INTERVAL '30 days',
  has_received_free_shortlist = false
WHERE tier_id IS NULL;

-- Show the clean new structure
SELECT 'New user_profiles structure:' as info;
SELECT id, email, role, tier_id, available_credits, jobs_remaining FROM user_profiles;

SELECT 'New jobs structure:' as info;
SELECT id, user_id, company_name, title FROM jobs LIMIT 5; 