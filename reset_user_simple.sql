-- Simple script to reset user to 120 points
-- User: 44944ee9-5e3c-451d-9573-98dae4daa766

-- Step 1: Clear marketplace unlocks
DELETE FROM user_marketplace_unlocks 
WHERE user_id = '44944ee9-5e3c-451d-9573-98dae4daa766';

-- Step 2: Delete all their jobs
DELETE FROM jobs 
WHERE user_id = '44944ee9-5e3c-451d-9573-98dae4daa766';

-- Step 3: Create 2 test jobs (get user email first)
INSERT INTO jobs (
  user_id,
  user_email,
  company_name,
  title,
  description,
  seniority_level,
  location,
  salary_range_min,
  salary_range_max,
  must_have_skills,
  status,
  candidates_requested
) 
SELECT 
  '44944ee9-5e3c-451d-9573-98dae4daa766',
  u.email,
  'Test Company ' || series,
  'Test Position ' || series,
  'Test job for points testing',
  'Mid',
  'Remote',
  100000,
  150000,
  ARRAY['Testing'],
  'Unclaimed',
  5
FROM auth.users u, generate_series(1, 2) AS series
WHERE u.id = '44944ee9-5e3c-451d-9573-98dae4daa766';

-- Step 4: Set account to 2 days old
UPDATE user_profiles
SET created_at = NOW() - INTERVAL '2 days'
WHERE id = '44944ee9-5e3c-451d-9573-98dae4daa766';

-- Step 5: Verify (should show 120 points: 2 jobs * 50 + 2 days * 10)
SELECT 
  COUNT(j.id) as job_count,
  EXTRACT(EPOCH FROM (NOW() - up.created_at)) / 86400 as days_active,
  (COUNT(j.id) * 50 + (EXTRACT(EPOCH FROM (NOW() - up.created_at)) / 86400)::int * 10) as total_points
FROM user_profiles up
LEFT JOIN jobs j ON j.user_id = up.id
WHERE up.id = '44944ee9-5e3c-451d-9573-98dae4daa766'
GROUP BY up.id, up.created_at;

