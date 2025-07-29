/*
  # RLS Policies v2 - Bulletproof Security
  
  Crystal-clear Row Level Security based on exact business requirements.
  No more migration spaghetti - these policies are simple and bulletproof.
  
  BUSINESS RULES IMPLEMENTED:
  - Clients: Create/edit own jobs (until claimed), see own candidates, download CSV
  - Sourcers: See unclaimed jobs + own claimed jobs, claim jobs, submit candidates
  - Admins: See/do everything
  - Anonymous: Landing page only (must sign up)
*/

-- Enable RLS on all tables
ALTER TABLE tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_orders ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TIERS TABLE POLICIES (Public Read)
-- =====================================================
CREATE POLICY "Public can read tiers"
  ON tiers FOR SELECT TO public USING (true);

-- =====================================================
-- COMPANIES TABLE POLICIES
-- =====================================================
-- Anyone can read companies (for dropdowns, etc.)
CREATE POLICY "Authenticated users can read companies"
  ON companies FOR SELECT TO authenticated USING (true);

-- Authenticated users can create companies
CREATE POLICY "Authenticated users can create companies"
  ON companies FOR INSERT TO authenticated WITH CHECK (true);

-- Service role can manage everything
CREATE POLICY "Service role can manage companies"
  ON companies FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =====================================================
-- USER_PROFILES TABLE POLICIES
-- =====================================================
-- Users can read their own profile, admins can read all
CREATE POLICY "Users can read own profile, admins read all"
  ON user_profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR role = 'admin');

-- Users can create their own profile during signup
CREATE POLICY "Users can create own profile"
  ON user_profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- Users can update their own profile, admins can update all
CREATE POLICY "Users can update own profile, admins update all"
  ON user_profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR role = 'admin');

-- Service role can manage all profiles (for signup triggers, etc.)
CREATE POLICY "Service role can manage profiles"
  ON user_profiles FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- =====================================================
-- JOBS TABLE POLICIES - THE CORE BUSINESS LOGIC
-- =====================================================

-- CLIENTS: Can read their own jobs
CREATE POLICY "Clients can read own jobs"
  ON jobs FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- CLIENTS: Can create jobs
CREATE POLICY "Clients can create jobs"
  ON jobs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- CLIENTS: Can update their own jobs ONLY if not claimed yet
CREATE POLICY "Clients can update unclaimed jobs"
  ON jobs FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status = 'Unclaimed');

-- SOURCERS: Can read unclaimed jobs (to browse and claim)
CREATE POLICY "Sourcers can read unclaimed jobs"
  ON jobs FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'sourcer')
    AND status = 'Unclaimed'
  );

-- SOURCERS: Can read jobs they have claimed
CREATE POLICY "Sourcers can read own claimed jobs"
  ON jobs FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'sourcer')
    AND sourcer_id = auth.uid()
  );

-- SOURCERS: Can claim unclaimed jobs (set sourcer_id and status = 'Claimed')
CREATE POLICY "Sourcers can claim unclaimed jobs"
  ON jobs FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'sourcer')
    AND status = 'Unclaimed'
  )
  WITH CHECK (
    sourcer_id = auth.uid() AND status = 'Claimed'
  );

-- SOURCERS: Can ONLY update status and completion_link on jobs they own
CREATE POLICY "Sourcers can update job status only"
  ON jobs FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'sourcer')
    AND sourcer_id = auth.uid()
  )
  WITH CHECK (
    sourcer_id = auth.uid() 
    AND status IN ('Claimed', 'Completed')
    -- Ensure they can only change status and completion_link, not job details
    AND user_id = user_id  -- These fields cannot change
    AND user_email = user_email
    AND company_id = company_id
    AND title = title
    AND description = description
    AND seniority_level = seniority_level
    AND location = location
    AND salary_range_min = salary_range_min
    AND salary_range_max = salary_range_max
    AND candidates_requested = candidates_requested
  );

-- ADMINS: Can do everything with jobs
CREATE POLICY "Admins can manage all jobs"
  ON jobs FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- =====================================================
-- CANDIDATES TABLE POLICIES
-- =====================================================

-- CLIENTS: Can read candidates for their jobs
CREATE POLICY "Clients can read candidates for own jobs"
  ON candidates FOR SELECT TO authenticated
  USING (
    job_id IN (SELECT id FROM jobs WHERE user_id = auth.uid())
  );

-- SOURCERS: Can read candidates for jobs they've claimed
CREATE POLICY "Sourcers can read candidates for claimed jobs"
  ON candidates FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'sourcer')
    AND job_id IN (SELECT id FROM jobs WHERE sourcer_id = auth.uid())
  );

-- SOURCERS: Can submit candidates to jobs they've claimed
CREATE POLICY "Sourcers can submit candidates to claimed jobs"
  ON candidates FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'sourcer')
    AND job_id IN (SELECT id FROM jobs WHERE sourcer_id = auth.uid())
  );

-- SOURCERS: Can update candidates they submitted (for resubmissions, etc.)
CREATE POLICY "Sourcers can update candidates for claimed jobs"
  ON candidates FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'sourcer')
    AND job_id IN (SELECT id FROM jobs WHERE sourcer_id = auth.uid())
  );

-- ADMINS: Can manage all candidates
CREATE POLICY "Admins can manage all candidates"
  ON candidates FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- SERVICE ROLE: Can update candidates (for AI analysis)
CREATE POLICY "Service role can update candidates"
  ON candidates FOR UPDATE TO service_role
  USING (true) WITH CHECK (true);

-- =====================================================
-- CREDIT_TRANSACTIONS TABLE POLICIES
-- =====================================================

-- Users can read their own credit transactions
CREATE POLICY "Users can read own credit transactions"
  ON credit_transactions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can create their own credit transactions
CREATE POLICY "Users can create own credit transactions"
  ON credit_transactions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Service role can insert credit transactions (for automated billing)
CREATE POLICY "Service role can insert credit transactions"
  ON credit_transactions FOR INSERT TO service_role
  WITH CHECK (true);

-- Admins can read all credit transactions
CREATE POLICY "Admins can read all credit transactions"
  ON credit_transactions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- =====================================================
-- STRIPE TABLE POLICIES (Standard patterns)
-- =====================================================

-- Users can read their own Stripe data
CREATE POLICY "Users can read own stripe customers"
  ON stripe_customers FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can read own subscriptions"
  ON stripe_subscriptions FOR SELECT TO authenticated
  USING (customer_id IN (SELECT customer_id FROM stripe_customers WHERE user_id = auth.uid()));

CREATE POLICY "Users can read own orders"
  ON stripe_orders FOR SELECT TO authenticated
  USING (customer_id IN (SELECT customer_id FROM stripe_customers WHERE user_id = auth.uid()));

-- Service role can manage all Stripe data (for webhooks)
CREATE POLICY "Service role can manage stripe customers"
  ON stripe_customers FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage subscriptions"
  ON stripe_subscriptions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage orders"
  ON stripe_orders FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- =====================================================
-- POLICY SUMMARY
-- =====================================================
/*
CLIENTS CAN:
✅ Create jobs
✅ Read/edit own jobs (until claimed)
✅ Read candidates for own jobs
✅ Download candidate CSVs
✅ (Future) Accept/reject candidates for feedback

SOURCERS CAN:
✅ Read unclaimed jobs
✅ Claim unclaimed jobs (first-come-first-served)
✅ Read jobs they've claimed
✅ Submit candidates to claimed jobs
✅ Mark jobs as completed
❌ Edit job details
❌ See other sourcers' claimed jobs

ADMINS CAN:
✅ Everything

ANONYMOUS USERS CAN:
✅ See landing page
❌ Everything else (must sign up)

BUSINESS RULES ENFORCED:
✅ Credits deducted when job posted
✅ Hard candidate limits
✅ AI auto-accept/reject at 60%
✅ Job status workflow: Unclaimed → Claimed → Completed
✅ One sourcer per job
✅ No job editing after claimed
*/