-- Create or replace a function to get all users with their tier_id
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  role text,
  created_at timestamptz,
  updated_at timestamptz,
  tier_id uuid
) AS $$
BEGIN
  RETURN QUERY
    SELECT id, email, role, created_at, updated_at, tier_id
    FROM user_profiles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 