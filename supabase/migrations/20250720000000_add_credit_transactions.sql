-- Add credit transactions table for audit trail
-- This tracks all credit deductions and additions for billing purposes

CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('deduction', 'addition', 'reset')),
  amount integer NOT NULL,
  description text,
  job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own credit transactions"
  ON credit_transactions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert credit transactions"
  ON credit_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);

-- Add comment
COMMENT ON TABLE credit_transactions IS 'Audit trail for all credit transactions (deductions, additions, resets)'; 