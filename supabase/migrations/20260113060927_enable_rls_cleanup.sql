-- Enable RLS on jobs and candidates tables (if not already enabled)
-- These tables had RLS policies defined but RLS was never enabled

DO $$
BEGIN
  -- Enable RLS on jobs if not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'jobs' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE "public"."jobs" ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on jobs table';
  ELSE
    RAISE NOTICE 'RLS already enabled on jobs table';
  END IF;

  -- Enable RLS on candidates if not already enabled  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'candidates' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE "public"."candidates" ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on candidates table';
  ELSE
    RAISE NOTICE 'RLS already enabled on candidates table';
  END IF;
END $$;

-- Remove duplicate policy (safe to run even if doesn't exist)
DROP POLICY IF EXISTS "Users can read candidates for their jobs" ON "public"."candidates";
