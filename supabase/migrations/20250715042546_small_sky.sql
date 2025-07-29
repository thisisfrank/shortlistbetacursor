/*
  # Create tiers table for subscription management

  1. New Tables
    - `tiers`
      - `id` (uuid, primary key)
      - `name` (text, unique) - tier names like 'Free', 'Tier 1', etc.
      - `monthly_job_allotment` (integer) - number of jobs allowed per month
      - `monthly_candidate_allotment` (integer) - number of candidate credits per month
      - `includes_company_emails` (boolean) - whether tier includes company email feature
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `tiers` table
    - Add policy for public read access to tiers

  3. Initial Data
    - Insert the four tier definitions (Free, Tier 1, Tier 2, Tier 3)
*/

CREATE TABLE IF NOT EXISTS tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  monthly_job_allotment integer NOT NULL,
  monthly_candidate_allotment integer NOT NULL,
  includes_company_emails boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on tiers"
  ON tiers
  FOR SELECT
  TO public
  USING (true);

-- Insert the tier definitions
INSERT INTO tiers (name, monthly_job_allotment, monthly_candidate_allotment, includes_company_emails) VALUES
  ('Free', 1, 20, false),
  ('Tier 1', 1, 50, true),
  ('Tier 2', 3, 150, true),
  ('Tier 3', 10, 400, true);