# Supabase Configuration Guide

## Overview
This project uses Supabase for authentication, database, and edge functions. Follow these steps to configure Supabase properly.

## 1. Environment Variables Setup

Create a `.env` file in the project root with the following variables:

```env
# Required: Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Additional API Keys
VITE_APIFY_API_TOKEN=your_apify_api_token

# Optional: GHL Integration
VITE_SIGNUP_THANK_YOU_URL=your_ghl_webhook_url
VITE_GHL_JOB_SUBMISSION_CONFIRMATION_WEBHOOK_URL=your_ghl_webhook_url
VITE_GHL_JOB_COMPLETION_NOTIFICATION_WEBHOOK_URL=your_ghl_webhook_url
```

## 2. Supabase Project Setup

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key from Settings > API

### Step 2: Configure Environment Variables
1. Copy your project URL to `VITE_SUPABASE_URL`
2. Copy your anon key to `VITE_SUPABASE_ANON_KEY`

### Step 3: Run Database Migrations
The project includes migrations in `supabase/migrations/`. Run them in order:

```bash
# If using Supabase CLI locally
supabase db push

# Or manually run the SQL files in order:
# 20250125000001_fix_get_all_users_add_name.sql
# 20250126000001_replace_selling_points_with_skills.sql
# ... (all other migration files)
```

## 3. Edge Functions Setup

The project uses several edge functions that need to be deployed:

### Required Edge Functions:
- `stripe-checkout` - Handles Stripe checkout sessions
- `stripe-webhook` - Processes Stripe webhooks
- `stripe-portal` - Manages Stripe customer portal
- `generate-summary` - AI-powered candidate summaries
- `generate-match-score` - AI-powered candidate scoring
- `daily-renewals` - Handles daily credit renewals
- `anthropic-proxy` - Proxies requests to Anthropic API

### Deploy Edge Functions:
```bash
# Deploy all functions
supabase functions deploy

# Or deploy individually
supabase functions deploy stripe-checkout
supabase functions deploy stripe-webhook
supabase functions deploy stripe-portal
supabase functions deploy generate-summary
supabase functions deploy generate-match-score
supabase functions deploy daily-renewals
supabase functions deploy anthropic-proxy
```

## 4. Environment Variables for Edge Functions

Set these in your Supabase project dashboard under Settings > Edge Functions:

### Required Variables:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### For Stripe Integration:
```
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

## 5. Database Schema

The project uses these main tables:
- `user_profiles` - User authentication and roles
- `jobs` - Job postings and requirements
- `candidates` - Scraped candidate profiles
- `tiers` - Subscription tier definitions
- `stripe_customers` - Stripe customer data
- `stripe_subscriptions` - Stripe subscription data
- `stripe_orders` - Stripe order data

## 6. Authentication Setup

### Auth Configuration:
- Email signup is enabled
- Password reset is configured
- Redirect URLs are set for local development
- JWT expiry is set to 1 hour

### Test Users:
The system supports these user types:
- **Clients**: Can submit jobs and view candidates
- **Sourcers**: Can claim jobs and submit candidates
- **Admins**: Full platform management

## 7. Local Development

### Start Local Supabase:
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Start local Supabase
supabase start

# This will give you local URLs to use in your .env file
```

### Development Environment Variables:
```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=your_local_anon_key
```

## 8. Production Deployment

### Netlify Environment Variables:
Set these in your Netlify project settings:
```
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key
```

### Supabase Production Setup:
1. Create a production Supabase project
2. Run all migrations
3. Deploy all edge functions
4. Configure production environment variables
5. Set up Stripe webhook endpoints

## 9. Testing Configuration

### Verify Setup:
1. Start the development server: `npm run dev`
2. Check browser console for environment variable status
3. Try signing up as a client or sourcer
4. Test authentication flow

### Debug Information:
The app includes debug logging that shows:
- Environment variable status
- Supabase connection status
- Authentication state

## 10. Troubleshooting

### Common Issues:
1. **Missing Environment Variables**: Check that `.env` file exists and has correct values
2. **Database Connection**: Verify Supabase URL and keys are correct
3. **Edge Functions**: Ensure all functions are deployed with correct environment variables
4. **Authentication**: Check redirect URLs in Supabase dashboard

### Debug Steps:
1. Check browser console for error messages
2. Verify environment variables are loaded
3. Test Supabase connection directly
4. Check edge function logs in Supabase dashboard

## 11. Security Considerations

- Never commit `.env` files to version control
- Use service role key only in edge functions
- Use anon key for client-side operations
- Enable Row Level Security (RLS) on all tables
- Regularly rotate API keys

## 12. Next Steps

After completing this setup:
1. Test all user flows (client, sourcer, admin)
2. Verify AI integrations work
3. Test Stripe payment flows
4. Deploy to production
5. Monitor logs and performance 