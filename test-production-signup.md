# Production Signup Test

## Current Issue
User `hello@cleancutsystems.com` is getting 406/403 errors when trying to load/create profile.

## Errors Analysis
- **406 Error**: "Not Acceptable" - usually RLS policy blocking access
- **403 Error**: "Forbidden" - usually insufficient permissions

## Likely Causes
1. User exists in auth.users but no profile in user_profiles
2. RLS policies are blocking profile access/creation
3. Database trigger didn't fire when user was originally created

## Next Steps
1. Check if user exists in auth.users
2. Check if profile exists in user_profiles  
3. Verify RLS policies are correct
4. Test with a fresh signup to see if triggers work

## Test Plan
1. Try signing up with a completely new email
2. Check if profile gets created automatically
3. If not, debug the trigger setup
