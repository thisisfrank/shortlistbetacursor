


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."job_status" AS ENUM (
    'Unclaimed',
    'Claimed',
    'Completed'
);


ALTER TYPE "public"."job_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'client',
    'sourcer',
    'admin'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_all_users"() RETURNS TABLE("id" "uuid", "email" "text", "name" "text", "role" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "tier_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
    SELECT up.id, up.email, up.name, up.role, up.created_at, up.updated_at, up.tier_id
    FROM user_profiles up
    ORDER BY 
      CASE up.role 
        WHEN 'admin' THEN 1
        WHEN 'sourcer' THEN 2  
        WHEN 'client' THEN 3
        ELSE 4
      END,
      up.email;
END;
$$;


ALTER FUNCTION "public"."get_all_users"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_role text;
BEGIN
  -- Determine role (default to client, but allow for special emails)
  IF NEW.email = 'thisisfrankgonzalez@gmail.com' THEN
    user_role := 'admin';
  ELSIF NEW.email = 'thisisjasongonzalez@gmail.com' THEN
    user_role := 'sourcer';
  ELSE
    user_role := 'client';
  END IF;

  -- ONLY create profile for special admin/sourcer emails
  -- Regular client signups will be handled by the frontend application
  IF user_role IN ('admin', 'sourcer') THEN
    INSERT INTO user_profiles (id, email, role, tier_id, name)
    VALUES (
      NEW.id,
      NEW.email,
      user_role,
      NULL,
      SPLIT_PART(NEW.email, '@', 1)
    );
  -- DO NOTHING for regular client signups - let frontend handle them
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."candidate_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid",
    "candidate_id" "uuid",
    "job_order_id" "uuid",
    "rating" integer,
    "notes" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "candidate_feedback_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."candidate_feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."candidates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid",
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "linkedin_url" "text" NOT NULL,
    "headline" "text",
    "location" "text",
    "experience" "jsonb",
    "education" "jsonb",
    "skills" "text"[] DEFAULT '{}'::"text"[],
    "summary" "text",
    "submitted_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."candidates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "transaction_type" "text" NOT NULL,
    "amount" integer NOT NULL,
    "description" "text",
    "job_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "credit_transactions_transaction_type_check" CHECK (("transaction_type" = ANY (ARRAY['deduction'::"text", 'addition'::"text", 'reset'::"text"])))
);


ALTER TABLE "public"."credit_transactions" OWNER TO "postgres";


COMMENT ON TABLE "public"."credit_transactions" IS 'Audit trail for all credit transactions (deductions, additions, resets)';



CREATE TABLE IF NOT EXISTS "public"."jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "seniority_level" "text" NOT NULL,
    "work_arrangement" "text",
    "location" "text" NOT NULL,
    "salary_range_min" integer NOT NULL,
    "salary_range_max" integer NOT NULL,
    "status" "public"."job_status" DEFAULT 'Unclaimed'::"public"."job_status",
    "sourcer_name" "text",
    "completion_link" "text",
    "candidates_requested" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "company_name" "text" NOT NULL,
    "user_id" "uuid",
    "user_email" "text" NOT NULL,
    "must_have_skills" "text"[] DEFAULT '{}'::"text"[]
);


ALTER TABLE "public"."jobs" OWNER TO "postgres";


COMMENT ON COLUMN "public"."jobs"."user_email" IS 'Email of the user who submitted the job';



CREATE TABLE IF NOT EXISTS "public"."shortlist_candidates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shortlist_id" "uuid",
    "candidate_id" "uuid",
    "added_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."shortlist_candidates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shortlists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."shortlists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tiers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "monthly_job_allotment" integer NOT NULL,
    "monthly_candidate_allotment" integer NOT NULL,
    "includes_company_emails" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tiers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "role" "public"."user_role" DEFAULT 'client'::"public"."user_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tier_id" "text" DEFAULT 'tier-free'::"text",
    "available_credits" integer DEFAULT 20,
    "jobs_remaining" integer DEFAULT 1,
    "credits_reset_date" timestamp with time zone DEFAULT ("now"() + '30 days'::interval),
    "name" "text" NOT NULL,
    "stripe_customer_id" "text",
    "subscription_status" "text" DEFAULT 'free'::"text",
    "subscription_period_end" timestamp with time zone
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_profiles" IS 'User profiles are created by: 1) Frontend for regular client signups (with full name), 2) handle_new_user() trigger only for special admin/sourcer emails';



ALTER TABLE ONLY "public"."candidate_feedback"
    ADD CONSTRAINT "candidate_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."candidates"
    ADD CONSTRAINT "candidates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shortlist_candidates"
    ADD CONSTRAINT "shortlist_candidates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shortlist_candidates"
    ADD CONSTRAINT "shortlist_candidates_shortlist_id_candidate_id_key" UNIQUE ("shortlist_id", "candidate_id");



ALTER TABLE ONLY "public"."shortlists"
    ADD CONSTRAINT "shortlists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tiers"
    ADD CONSTRAINT "tiers_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."tiers"
    ADD CONSTRAINT "tiers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_credit_transactions_created_at" ON "public"."credit_transactions" USING "btree" ("created_at");



CREATE INDEX "idx_credit_transactions_user_id" ON "public"."credit_transactions" USING "btree" ("user_id");



CREATE INDEX "idx_jobs_user_email" ON "public"."jobs" USING "btree" ("user_email");



CREATE OR REPLACE TRIGGER "update_jobs_updated_at" BEFORE UPDATE ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."candidate_feedback"
    ADD CONSTRAINT "candidate_feedback_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."candidate_feedback"
    ADD CONSTRAINT "candidate_feedback_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."candidate_feedback"
    ADD CONSTRAINT "candidate_feedback_job_order_id_fkey" FOREIGN KEY ("job_order_id") REFERENCES "public"."jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."candidates"
    ADD CONSTRAINT "candidates_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shortlist_candidates"
    ADD CONSTRAINT "shortlist_candidates_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shortlist_candidates"
    ADD CONSTRAINT "shortlist_candidates_shortlist_id_fkey" FOREIGN KEY ("shortlist_id") REFERENCES "public"."shortlists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shortlists"
    ADD CONSTRAINT "shortlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can delete candidates" ON "public"."candidates" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can manage all candidates" ON "public"."candidates" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can manage all jobs" ON "public"."jobs" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can read all candidates" ON "public"."candidates" FOR SELECT USING (("auth"."uid"() IN ( SELECT "user_profiles"."id"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."role" = 'admin'::"public"."user_role"))));



CREATE POLICY "Admins can read all jobs" ON "public"."jobs" FOR SELECT USING (("auth"."uid"() IN ( SELECT "user_profiles"."id"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."role" = 'admin'::"public"."user_role"))));



CREATE POLICY "Admins can update candidates" ON "public"."candidates" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Allow authenticated users to insert their own profile" ON "public"."user_profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Allow public read access on tiers" ON "public"."tiers" FOR SELECT USING (true);



CREATE POLICY "Job update policy" ON "public"."jobs" FOR UPDATE TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = 'admin'::"public"."user_role")))) OR ("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = 'sourcer'::"public"."user_role"))))));



CREATE POLICY "Only admins can delete profiles" ON "public"."user_profiles" FOR DELETE TO "authenticated" USING (("role" = 'admin'::"public"."user_role"));



CREATE POLICY "Sourcers can insert candidates" ON "public"."candidates" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = ANY (ARRAY['sourcer'::"public"."user_role", 'admin'::"public"."user_role"]))))));



CREATE POLICY "Sourcers can read available jobs" ON "public"."jobs" FOR SELECT USING ((("auth"."uid"() IN ( SELECT "user_profiles"."id"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."role" = 'sourcer'::"public"."user_role"))) AND (("status" = 'Unclaimed'::"public"."job_status") OR ("sourcer_name" IN ( SELECT "user_profiles"."email"
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = 'sourcer'::"public"."user_role")))))));



CREATE POLICY "Sourcers can read candidates for claimed jobs" ON "public"."candidates" FOR SELECT USING (("job_id" IN ( SELECT "jobs"."id"
   FROM "public"."jobs"
  WHERE ("jobs"."sourcer_name" IN ( SELECT "user_profiles"."email"
           FROM "public"."user_profiles"
          WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = 'sourcer'::"public"."user_role")))))));



CREATE POLICY "Sourcers can read unclaimed jobs" ON "public"."jobs" FOR SELECT TO "authenticated" USING ((("status" = 'Unclaimed'::"public"."job_status") AND (EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = 'sourcer'::"public"."user_role"))))));



CREATE POLICY "System can insert credit transactions" ON "public"."credit_transactions" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Users can insert own jobs" ON "public"."jobs" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own profile" ON "public"."user_profiles" FOR INSERT TO "authenticated" WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "Users can read candidates for own jobs" ON "public"."candidates" FOR SELECT TO "authenticated" USING (("job_id" IN ( SELECT "jobs"."id"
   FROM "public"."jobs"
  WHERE ("jobs"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can read candidates for their jobs" ON "public"."candidates" FOR SELECT TO "authenticated" USING (("job_id" IN ( SELECT "j"."id"
   FROM "public"."jobs" "j"
  WHERE ("j"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can read own jobs" ON "public"."jobs" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can read own profile" ON "public"."user_profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can read their own credit transactions" ON "public"."credit_transactions" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own jobs" ON "public"."jobs" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own profile" ON "public"."user_profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own profile or admins can update all" ON "public"."user_profiles" FOR UPDATE TO "authenticated" USING ((("id" = "auth"."uid"()) OR ("role" = 'admin'::"public"."user_role")));



CREATE POLICY "Users can view their own profile or admins can view all" ON "public"."user_profiles" FOR SELECT TO "authenticated" USING ((("id" = "auth"."uid"()) OR ("role" = 'admin'::"public"."user_role")));



ALTER TABLE "public"."credit_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tiers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."get_all_users"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_users"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_users"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."candidate_feedback" TO "anon";
GRANT ALL ON TABLE "public"."candidate_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."candidate_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."candidates" TO "anon";
GRANT ALL ON TABLE "public"."candidates" TO "authenticated";
GRANT ALL ON TABLE "public"."candidates" TO "service_role";



GRANT ALL ON TABLE "public"."credit_transactions" TO "anon";
GRANT ALL ON TABLE "public"."credit_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."jobs" TO "anon";
GRANT ALL ON TABLE "public"."jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."jobs" TO "service_role";



GRANT ALL ON TABLE "public"."shortlist_candidates" TO "anon";
GRANT ALL ON TABLE "public"."shortlist_candidates" TO "authenticated";
GRANT ALL ON TABLE "public"."shortlist_candidates" TO "service_role";



GRANT ALL ON TABLE "public"."shortlists" TO "anon";
GRANT ALL ON TABLE "public"."shortlists" TO "authenticated";
GRANT ALL ON TABLE "public"."shortlists" TO "service_role";



GRANT ALL ON TABLE "public"."tiers" TO "anon";
GRANT ALL ON TABLE "public"."tiers" TO "authenticated";
GRANT ALL ON TABLE "public"."tiers" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























