-- Fix sourcer RLS policies to work with UUIDs instead of emails
-- This resolves the job claiming issue where sourcerId (UUID) is stored in sourcer_name
-- but RLS policies were expecting email addresses

-- Update the main sourcer job read policy to work with UUIDs
DROP POLICY IF EXISTS "Sourcers can read available jobs" ON "public"."jobs";

CREATE POLICY "Sourcers can read available jobs" ON "public"."jobs" FOR SELECT 
USING ((("auth"."uid"() IN ( SELECT "user_profiles"."id"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."role" = 'sourcer'::"public"."user_role"))) 
  AND (("status" = 'Unclaimed'::"public"."job_status") 
  OR ("sourcer_name" IN ( SELECT "user_profiles"."id"::text
     FROM "public"."user_profiles"
    WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = 'sourcer'::"public"."user_role")))))));

-- Also update the candidates read policy for consistency
DROP POLICY IF EXISTS "Sourcers can read candidates for claimed jobs" ON "public"."candidates";

CREATE POLICY "Sourcers can read candidates for claimed jobs" ON "public"."candidates" FOR SELECT 
USING (("job_id" IN ( SELECT "jobs"."id"
   FROM "public"."jobs"
  WHERE ("jobs"."sourcer_name" IN ( SELECT "user_profiles"."id"::text
           FROM "public"."user_profiles"
          WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = 'sourcer'::"public"."user_role")))))));

-- Add comment explaining the change
COMMENT ON POLICY "Sourcers can read available jobs" ON "public"."jobs" IS 
'Allows sourcers to read unclaimed jobs and jobs they have claimed. Updated to work with UUID stored in sourcer_name field.';

COMMENT ON POLICY "Sourcers can read candidates for claimed jobs" ON "public"."candidates" IS 
'Allows sourcers to read candidates for jobs they have claimed. Updated to work with UUID stored in sourcer_name field.';
