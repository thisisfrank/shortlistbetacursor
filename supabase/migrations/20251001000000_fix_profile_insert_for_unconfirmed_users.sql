-- Fix: Allow users to insert their profile during signup (before email confirmation)
-- The existing policy only allows "authenticated" users, but during signup the user is "anon"

-- Drop the duplicate/redundant INSERT policies
DROP POLICY IF EXISTS "Allow authenticated users to insert their own profile" ON "public"."user_profiles";
DROP POLICY IF EXISTS "Users can insert their own profile" ON "public"."user_profiles";

-- Create a new INSERT policy that works for both authenticated and anon (during signup)
-- This allows the profile to be created immediately after signup, even before email confirmation
CREATE POLICY "Users can insert their own profile during signup" 
ON "public"."user_profiles" 
FOR INSERT 
WITH CHECK ("id" = "auth"."uid"());

-- Note: This policy checks that the profile being inserted matches the user's ID
-- It works for both authenticated users and users in the signup flow (anon with uid)

