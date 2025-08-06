/*
  # Replace key_selling_points with must_have_skills in jobs table

  1. Changes
    - Add new `must_have_skills` column (text array)
    - Copy existing data from `key_selling_points` to `must_have_skills` 
    - Drop old `key_selling_points` column

  2. Data Migration
    - Preserves existing data during transition
    - Maintains same data type (text[])
    - Limits to 3 items to match new validation rules
*/

-- Add new must_have_skills column (if it doesn't already exist)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS must_have_skills text[] DEFAULT '{}';

-- Copy existing data from key_selling_points to must_have_skills
-- Only copy up to 3 items to match new validation rules
UPDATE jobs 
SET must_have_skills = (
  SELECT ARRAY(
    SELECT unnest(key_selling_points) 
    LIMIT 3
  )
) 
WHERE key_selling_points IS NOT NULL AND array_length(key_selling_points, 1) > 0;

-- Drop the old key_selling_points column (if it exists)
ALTER TABLE jobs DROP COLUMN IF EXISTS key_selling_points;
