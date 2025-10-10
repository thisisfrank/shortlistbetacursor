-- Reset user 44944ee9-5e3c-451d-9573-98dae4daa766 to 120 points for testing
-- This will give them: 2 jobs (100pts) + ~2 days active (20pts) = 120 points total

-- Step 1: Check current state
SELECT 
  u.id,
  u.email,
  up.created_at,
  EXTRACT(EPOCH FROM (NOW() - up.created_at)) / 86400 as days_active,
  COUNT(j.id) as job_count,
  (COUNT(j.id) * 50 + (EXTRACT(EPOCH FROM (NOW() - up.created_at)) / 86400)::int * 10) as current_points
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
LEFT JOIN jobs j ON j.user_id = u.id
WHERE u.id = '44944ee9-5e3c-451d-9573-98dae4daa766'
GROUP BY u.id, u.email, up.created_at;

-- Step 2: Clear marketplace unlocks (so they can test unlocking)
DELETE FROM user_marketplace_unlocks 
WHERE user_id = '44944ee9-5e3c-451d-9573-98dae4daa766';

-- Step 3: Delete all jobs except 2
-- First, let's keep only the 2 most recent jobs
WITH keep_jobs AS (
  SELECT id 
  FROM jobs 
  WHERE user_id = '44944ee9-5e3c-451d-9573-98dae4daa766'
  ORDER BY created_at DESC
  LIMIT 2
)
DELETE FROM jobs 
WHERE user_id = '44944ee9-5e3c-451d-9573-98dae4daa766'
  AND id NOT IN (SELECT id FROM keep_jobs);

-- If they have fewer than 2 jobs, create test jobs
INSERT INTO jobs (
  id,
  user_id,
  company_name,
  title,
  description,
  seniority_level,
  location,
  salary_range_min,
  salary_range_max,
  must_have_skills,
  status,
  completion_link,
  candidates_requested,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  '44944ee9-5e3c-451d-9573-98dae4daa766',
  'Test Company ' || series,
  'Test Position ' || series,
  'Test job for points testing',
  'Mid',
  'Remote',
  100000,
  150000,
  ARRAY['Testing'],
  'Unclaimed',
  NULL,
  5,
  NOW(),
  NOW()
FROM generate_series(1, 2 - COALESCE((SELECT COUNT(*) FROM jobs WHERE user_id = '44944ee9-5e3c-451d-9573-98dae4daa766'), 0)) AS series
WHERE (SELECT COUNT(*) FROM jobs WHERE user_id = '44944ee9-5e3c-451d-9573-98dae4daa766') < 2;

-- Step 4: Set account creation date to ~2 days ago
-- This gives: 2 jobs (100pts) + 2 days (20pts) = 120 points
UPDATE user_profiles
SET created_at = NOW() - INTERVAL '2 days'
WHERE id = '44944ee9-5e3c-451d-9573-98dae4daa766';

-- Step 5: Verify final state (should show 120 points)
SELECT 
  u.id,
  u.email,
  up.created_at,
  EXTRACT(EPOCH FROM (NOW() - up.created_at)) / 86400 as days_active,
  COUNT(j.id) as job_count,
  (COUNT(j.id) * 50 + (EXTRACT(EPOCH FROM (NOW() - up.created_at)) / 86400)::int * 10) as total_points
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
LEFT JOIN jobs j ON j.user_id = u.id
WHERE u.id = '44944ee9-5e3c-451d-9573-98dae4daa766'
GROUP BY u.id, u.email, up.created_at;

