/*
  # Create shortlists feature

  1. New Tables
    - `shortlists`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles.id)
      - `name` (text) - shortlist name
      - `description` (text, optional) - shortlist description
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `shortlist_candidates`
      - `id` (uuid, primary key)
      - `shortlist_id` (uuid, references shortlists.id)
      - `candidate_id` (uuid, references candidates.id)
      - `added_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for shortlist access
*/

-- Create shortlists table
CREATE TABLE IF NOT EXISTS shortlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create shortlist_candidates junction table
CREATE TABLE IF NOT EXISTS shortlist_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shortlist_id uuid REFERENCES shortlists(id) ON DELETE CASCADE,
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  UNIQUE(shortlist_id, candidate_id)
);

-- Enable RLS
ALTER TABLE shortlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortlist_candidates ENABLE ROW LEVEL SECURITY;

-- Shortlists policies
CREATE POLICY "Users can read own shortlists"
  ON shortlists
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own shortlists"
  ON shortlists
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own shortlists"
  ON shortlists
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own shortlists"
  ON shortlists
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Shortlist candidates policies
CREATE POLICY "Users can read shortlist candidates for their shortlists"
  ON shortlist_candidates
  FOR SELECT
  TO authenticated
  USING (
    shortlist_id IN (
      SELECT id FROM shortlists WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add candidates to their shortlists"
  ON shortlist_candidates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    shortlist_id IN (
      SELECT id FROM shortlists WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove candidates from their shortlists"
  ON shortlist_candidates
  FOR DELETE
  TO authenticated
  USING (
    shortlist_id IN (
      SELECT id FROM shortlists WHERE user_id = auth.uid()
    )
  );

-- Admin policies
CREATE POLICY "Admins can manage all shortlists"
  ON shortlists
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all shortlist candidates"
  ON shortlist_candidates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create trigger to update updated_at on shortlists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_shortlists_updated_at ON shortlists;
CREATE TRIGGER update_shortlists_updated_at
  BEFORE UPDATE ON shortlists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();