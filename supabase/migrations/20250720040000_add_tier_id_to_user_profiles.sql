-- Add tier_id column to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS tier_id uuid;

-- Backfill existing users to Free tier if null and role is client
UPDATE user_profiles SET tier_id = '5841d1d6-20d7-4360-96f8-0444305fac5b' WHERE tier_id IS NULL AND role = 'client';
UPDATE user_profiles SET tier_id = NULL WHERE role IN ('admin', 'sourcer');

-- Drop the old trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create new function to set tier_id to Free tier only for clients
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_role text;
BEGIN
  -- Determine role (default to client, but allow for special emails)
  IF NEW.email = 'thisisfrankgonzalez@gmail.com' THEN
    user_role := 'admin';
  ELSIF NEW.email = 'thisisjasongonzalez@gmail.com' THEN
    user_role := 'sourcer';
  ELSE
    user_role := 'client';
  END IF;

  IF user_role = 'client' THEN
    INSERT INTO user_profiles (id, email, role, tier_id)
    VALUES (
      NEW.id,
      NEW.email,
      user_role,
      '5841d1d6-20d7-4360-96f8-0444305fac5b'
    );
  ELSE
    INSERT INTO user_profiles (id, email, role, tier_id)
    VALUES (
      NEW.id,
      NEW.email,
      user_role,
      NULL
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user(); 