/*
  # Remove jobs_remaining field from user_profiles

  This migration removes the jobs_remaining field from user_profiles table
  since job submissions are now unlimited.

  1. Changes
    - Drop `jobs_remaining` column from `user_profiles` table
*/

-- Remove jobs_remaining column from user_profiles table
ALTER TABLE user_profiles DROP COLUMN IF EXISTS jobs_remaining;
