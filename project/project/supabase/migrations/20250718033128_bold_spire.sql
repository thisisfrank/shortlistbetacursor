/*
  # Create jobs table for job management

  1. New Tables
    - `jobs`
      - `id` (uuid, primary key)
      - `client_id` (uuid, references clients.id)
      - `title` (text)
      - `description` (text)
      - `seniority_level` (text)
      - `work_arrangement` (text)
      - `location` (text)
      - `salary_range_min` (integer)
      - `salary_range_max` (integer)
      - `key_selling_points` (text array)
      - `status` (enum)
      - `sourcer_name` (text)
      - `completion_link` (text)
      - `candidates_requested` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `jobs` table
    - Add policies for job access
*/

-- Create enum for job status
CREATE TYPE job_status AS ENUM ('Unclaimed', 'Claimed', 'Completed');

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  seniority_level text NOT NULL,
  work_arrangement text,
  location text NOT NULL,
  salary_range_min integer NOT NULL,
  salary_range_max integer NOT NULL,
  key_selling_points text[] DEFAULT '{}',
  status job_status DEFAULT 'Unclaimed',
  sourcer_name text,
  completion_link text,
  candidates_requested integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read jobs for their clients"
  ON jobs
  FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert jobs for their clients"
  ON jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update jobs for their clients"
  ON jobs
  FOR UPDATE
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

-- Sourcers can read all unclaimed jobs
CREATE POLICY "Sourcers can read unclaimed jobs"
  ON jobs
  FOR SELECT
  TO authenticated
  USING (
    status = 'Unclaimed' AND 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'sourcer'
    )
  );

-- Sourcers can update jobs they've claimed
CREATE POLICY "Sourcers can update claimed jobs"
  ON jobs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'sourcer'
    )
  );

-- Admins can do everything
CREATE POLICY "Admins can manage all jobs"
  ON jobs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create trigger to update updated_at
DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();