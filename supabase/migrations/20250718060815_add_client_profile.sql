-- Add missing client profile for existing user
INSERT INTO user_profiles (id, email, role)
VALUES (
  '11b897ee-24d7-43c2-aa21-ccb218bb4d2f',
  'client@test.com',
  'client'
)
ON CONFLICT (id) DO NOTHING; 