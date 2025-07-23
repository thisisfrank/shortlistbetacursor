/*
  # Create initial admin user
  This migration shows how to create an admin user directly in the database
  Replace 'admin@example.com' with the actual admin email you want to use
*/

-- Method 1: Create admin user if they already exist in auth.users
-- Replace 'admin@example.com' with the actual email
INSERT INTO user_profiles (id, email, role)
SELECT 
  au.id,
  au.email,
  'admin'
FROM auth.users au
WHERE au.email = 'admin@example.com'
AND NOT EXISTS (
  SELECT 1 FROM user_profiles up WHERE up.id = au.id
);

-- Method 2: Update existing user to admin role
-- Replace 'admin@example.com' with the actual email
UPDATE user_profiles 
SET role = 'admin', updated_at = now()
WHERE email = 'admin@example.com';

-- Method 3: Create admin user with specific UUID (if you know the user ID)
-- Replace the UUID with the actual user ID from auth.users
-- UPDATE user_profiles 
-- SET role = 'admin', updated_at = now()
-- WHERE id = 'your-user-uuid-here'; 