/*
  # Payment Integration v2 - Stripe Tables and Views
  
  Creates Stripe integration tables for handling subscriptions,
  one-time payments, and customer management. No changes from v1.
*/

-- Create stripe_customers table
CREATE TABLE stripe_customers (
  id SERIAL PRIMARY KEY,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  customer_id text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz DEFAULT NULL
);

-- Create stripe_subscriptions table
CREATE TABLE stripe_subscriptions (
  id SERIAL PRIMARY KEY,
  customer_id text REFERENCES stripe_customers(customer_id) ON DELETE CASCADE NOT NULL,
  subscription_id text UNIQUE DEFAULT NULL,
  price_id text DEFAULT NULL,
  current_period_start bigint DEFAULT NULL,
  current_period_end bigint DEFAULT NULL,
  cancel_at_period_end boolean DEFAULT false,
  payment_method_brand text DEFAULT NULL,
  payment_method_last4 text DEFAULT NULL,
  status text CHECK (status IN ('not_started', 'incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused')) DEFAULT 'not_started',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz DEFAULT NULL
);

-- Create stripe_orders table
CREATE TABLE stripe_orders (
  id SERIAL PRIMARY KEY,
  checkout_session_id text UNIQUE NOT NULL,
  payment_intent_id text NOT NULL,
  customer_id text REFERENCES stripe_customers(customer_id) ON DELETE CASCADE NOT NULL,
  amount_subtotal integer NOT NULL,
  amount_total integer NOT NULL,
  currency text NOT NULL,
  payment_status text NOT NULL,
  status text CHECK (status IN ('pending', 'completed', 'canceled')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz DEFAULT NULL
);

-- Create updated_at triggers for Stripe tables
CREATE TRIGGER update_stripe_customers_updated_at
  BEFORE UPDATE ON stripe_customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stripe_subscriptions_updated_at
  BEFORE UPDATE ON stripe_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stripe_orders_updated_at
  BEFORE UPDATE ON stripe_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create stripe_user_subscriptions view
CREATE OR REPLACE VIEW stripe_user_subscriptions AS
SELECT 
  sc.user_id as customer_id,
  ss.subscription_id,
  ss.status as subscription_status,
  ss.price_id,
  ss.current_period_start,
  ss.current_period_end,
  ss.cancel_at_period_end,
  ss.payment_method_brand,
  ss.payment_method_last4
FROM stripe_customers sc
LEFT JOIN stripe_subscriptions ss ON sc.customer_id = ss.customer_id
WHERE sc.deleted_at IS NULL AND (ss.deleted_at IS NULL OR ss.deleted_at IS NOT NULL);

-- Create stripe_user_orders view
CREATE OR REPLACE VIEW stripe_user_orders AS
SELECT 
  sc.user_id as customer_id,
  so.id as order_id,
  so.checkout_session_id,
  so.payment_intent_id,
  so.amount_subtotal,
  so.amount_total,
  so.currency,
  so.payment_status,
  so.status as order_status,
  so.created_at as order_date
FROM stripe_customers sc
JOIN stripe_orders so ON sc.customer_id = so.customer_id
WHERE sc.deleted_at IS NULL AND so.deleted_at IS NULL;

-- Create indexes
CREATE INDEX idx_stripe_customers_user_id ON stripe_customers(user_id);
CREATE INDEX idx_stripe_customers_customer_id ON stripe_customers(customer_id);
CREATE INDEX idx_stripe_subscriptions_customer_id ON stripe_subscriptions(customer_id);
CREATE INDEX idx_stripe_orders_customer_id ON stripe_orders(customer_id);

-- Comments
COMMENT ON TABLE stripe_customers IS 'Links Supabase users to Stripe customer IDs';
COMMENT ON TABLE stripe_subscriptions IS 'Stores subscription data from Stripe webhooks';
COMMENT ON TABLE stripe_orders IS 'Stores one-time payment data from Stripe webhooks';
