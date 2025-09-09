-- Add RLS policies for shortlist tables
-- This fixes the security gap where shortlist tables had no access controls

-- Enable Row Level Security on shortlists table
ALTER TABLE "public"."shortlists" ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security on shortlist_candidates table
ALTER TABLE "public"."shortlist_candidates" ENABLE ROW LEVEL SECURITY;

-- Allow clients, sourcers, and admins to manage all shortlists
-- This provides broad access while still requiring authentication
CREATE POLICY "Authenticated users can manage shortlists" 
ON "public"."shortlists" 
FOR ALL TO "authenticated" 
USING (
  EXISTS (
    SELECT 1 FROM "public"."user_profiles" 
    WHERE "id" = "auth"."uid"() 
    AND "role" IN ('client', 'sourcer', 'admin')
  )
);

-- Allow clients, sourcers, and admins to manage all shortlist candidates
-- This provides broad access while still requiring authentication
CREATE POLICY "Authenticated users can manage shortlist candidates" 
ON "public"."shortlist_candidates" 
FOR ALL TO "authenticated" 
USING (
  EXISTS (
    SELECT 1 FROM "public"."user_profiles" 
    WHERE "id" = "auth"."uid"() 
    AND "role" IN ('client', 'sourcer', 'admin')
  )
);

-- Add comments explaining the policies
COMMENT ON POLICY "Authenticated users can manage shortlists" ON "public"."shortlists" IS 
'Allows authenticated users with client, sourcer, or admin roles to manage shortlists. Provides broad access while maintaining authentication requirement.';

COMMENT ON POLICY "Authenticated users can manage shortlist candidates" ON "public"."shortlist_candidates" IS 
'Allows authenticated users with client, sourcer, or admin roles to manage shortlist candidates. Provides broad access while maintaining authentication requirement.';
