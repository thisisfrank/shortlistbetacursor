-- Enable Row Level Security on jobs and candidates tables
-- These tables had RLS policies defined but RLS was never enabled

ALTER TABLE "public"."jobs" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."candidates" ENABLE ROW LEVEL SECURITY;

