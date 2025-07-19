-- Create missing user profiles for existing users
-- This fixes the issue where users were created before the trigger was working

-- Insert missing profiles for existing users
INSERT INTO user_profiles (id, email, role)
SELECT 
  au.id,
  au.email,
  CASE 
    WHEN au.email = 'thisisfrankgonzalez@gmail.com' THEN 'admin'
    WHEN au.email = 'thisisjasongonzalez@gmail.com' THEN 'sourcer'
    WHEN au.email = 'client@test.com' THEN 'client'
    ELSE 'client'
  END
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles up WHERE up.id = au.id
)
AND au.email IN (
  'thisisfrankgonzalez@gmail.com',
  'thisisjasongonzalez@gmail.com', 
  'client@test.com'
); 