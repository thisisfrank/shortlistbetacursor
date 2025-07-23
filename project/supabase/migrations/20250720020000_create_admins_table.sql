-- Create a dedicated admins table to avoid RLS recursion
CREATE TABLE IF NOT EXISTS admins (
  user_id uuid PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- Populate admins table with existing admin users from user_profiles
INSERT INTO admins (user_id)
SELECT id FROM user_profiles WHERE role = 'admin'
ON CONFLICT DO NOTHING;

-- Add comment for clarity
COMMENT ON TABLE admins IS 'Holds user IDs of admin users for RLS checks without recursion.'; 