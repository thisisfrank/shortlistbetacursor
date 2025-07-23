/*
  # Create candidates table for candidate management

  1. New Tables
    - `candidates`
      - `id` (uuid, primary key)
      - `job_id` (uuid, references jobs.id)
      - `first_name` (text)
      - `last_name` (text)
      - `linkedin_url` (text)
      - `headline` (text)
      - `location` (text)
      - `experience` (jsonb)
      - `education` (jsonb)
      - `skills` (text array)
      - `summary` (text)
      - `submitted_at` (timestamp)

  2. Security
    - Enable RLS on `candidates` table
    - Add policies for candidate access
*/

-- Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  linkedin_url text NOT NULL,
  headline text,
  location text,
  experience jsonb,
  education jsonb,
  skills text[] DEFAULT '{}',
  summary text,
  submitted_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read candidates for their jobs"
  ON candidates
  FOR SELECT
  TO authenticated
  USING (
    job_id IN (
      SELECT j.id FROM jobs j
      JOIN clients c ON j.client_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "Sourcers can insert candidates"
  ON candidates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('sourcer', 'admin')
    )
  );

-- Admins can manage all candidates
CREATE POLICY "Admins can manage all candidates"
  ON candidates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );