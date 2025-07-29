-- Drop and recreate get_all_users function to include name field
DROP FUNCTION IF EXISTS get_all_users();

CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  name text,
  role text,
  created_at timestamptz,
  updated_at timestamptz,
  tier_id uuid
) AS $$
BEGIN
  RETURN QUERY
    SELECT up.id, up.email, up.name, up.role, up.created_at, up.updated_at, up.tier_id
    FROM user_profiles up
    ORDER BY 
      CASE up.role 
        WHEN 'admin' THEN 1
        WHEN 'sourcer' THEN 2  
        WHEN 'client' THEN 3
        ELSE 4
      END,
      up.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 