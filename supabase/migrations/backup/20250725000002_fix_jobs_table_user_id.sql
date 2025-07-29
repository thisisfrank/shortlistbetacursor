-- Fix jobs table schema: change client_id to user_id and update foreign key
-- This resolves timeout issues during job submission caused by foreign key constraint violations

-- Drop the old foreign key constraint
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_client_id_fkey;

-- Rename client_id column to user_id
ALTER TABLE jobs RENAME COLUMN client_id TO user_id;

-- Add new foreign key constraint pointing to user_profiles
ALTER TABLE jobs ADD CONSTRAINT jobs_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Ensure work_arrangement is nullable (already done in previous migrations but ensuring consistency)
ALTER TABLE jobs ALTER COLUMN work_arrangement DROP NOT NULL; 