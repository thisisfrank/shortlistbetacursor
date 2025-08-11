/*
  # Remove monthly_job_allotment field from tiers table

  This migration removes the monthly_job_allotment field from tiers table
  since job submissions are now unlimited.

  1. Changes
    - Drop `monthly_job_allotment` column from `tiers` table
*/

-- Remove monthly_job_allotment column from tiers table
ALTER TABLE tiers DROP COLUMN IF EXISTS monthly_job_allotment;
