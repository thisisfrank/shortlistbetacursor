-- Enable RLS on clients table
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Clients are viewable by their owner" ON clients;
DROP POLICY IF EXISTS "Clients are insertable by their owner" ON clients;
DROP POLICY IF EXISTS "Clients are updatable by their owner" ON clients;
DROP POLICY IF EXISTS "Clients are deletable by their owner" ON clients;

-- Create policy for clients to see their own data
CREATE POLICY "Clients are viewable by their owner" ON clients
  FOR SELECT USING (auth.uid()::text = user_id);

-- Create policy for clients to insert their own data
CREATE POLICY "Clients are insertable by their owner" ON clients
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Create policy for clients to update their own data
CREATE POLICY "Clients are updatable by their owner" ON clients
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Create policy for clients to delete their own data
CREATE POLICY "Clients are deletable by their owner" ON clients
  FOR DELETE USING (auth.uid()::text = user_id);

-- Create policy for sourcers and admins to view all clients
CREATE POLICY "Sourcers and admins can view all clients" ON clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('sourcer', 'admin')
    )
  ); 