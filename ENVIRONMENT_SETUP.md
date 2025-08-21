# Environment Variable Management Guide

## Current Architecture ✅

Your current setup is **actually following best practices** by using platform-specific environment management:

### 1. Frontend (Netlify) 
- **Variables**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APIFY_API_TOKEN`
- **Location**: Netlify Dashboard > Site Settings > Environment Variables
- **Why**: Vite requires `VITE_` prefix for browser exposure, Netlify handles build-time injection

### 2. Backend (Supabase Edge Functions)
- **Variables**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Location**: Supabase Dashboard > Settings > Edge Functions > Secrets
- **Why**: Server-side secrets, automatically available to edge functions via `Deno.env.get()`

### 3. Local Development (Missing - Needs Setup)
- **File**: `.env` (create this file)
- **Why**: Local development needs all variables for testing

## Setup Instructions

### 1. Create Local Environment File

Create a `.env` file in your project root:

```env
# Frontend Environment Variables (VITE_ prefix required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APIFY_API_TOKEN=your_apify_token

# Backend Variables (for local edge function testing)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
ANTHROPIC_API_KEY=your_anthropic_api_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Development
VITE_APP_URL=http://localhost:5173
```

### 2. Verify Platform Configurations

#### Netlify Environment Variables
Navigate to: Netlify Dashboard > Your Site > Site Settings > Environment Variables

Required variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` 
- `VITE_APIFY_API_TOKEN`

#### Supabase Edge Function Secrets
Navigate to: Supabase Dashboard > Settings > Edge Functions > Secrets

Required secrets:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `ANTHROPIC_API_KEY`
- `SUPABASE_URL` (auto-provided)
- `SUPABASE_SERVICE_ROLE_KEY` (auto-provided)

## Security Best Practices ✅

### What You're Doing Right:
1. **Platform Separation**: Different secrets on different platforms
2. **Prefix Convention**: Using `VITE_` for frontend variables
3. **Gitignore**: `.env` files are properly ignored
4. **Public vs Private**: Frontend gets public keys, backend gets private keys

### Recommendations:
1. **Use Different Keys for Different Environments**:
   - Development: `sk_test_...` (Stripe test keys)
   - Production: `sk_live_...` (Stripe live keys)

2. **Regular Key Rotation**: 
   - Rotate Stripe keys quarterly
   - Rotate API tokens when team members leave

3. **Principle of Least Privilege**:
   - Frontend only gets anon/public keys
   - Backend gets service role keys
   - Each platform only gets what it needs

## Environment Variable Inventory

### Frontend (Browser-Exposed)
| Variable | Purpose | Platform | Security Level |
|----------|---------|----------|----------------|
| `VITE_SUPABASE_URL` | Database connection | Netlify | Public |
| `VITE_SUPABASE_ANON_KEY` | Public database access | Netlify | Public |
| `VITE_APIFY_API_TOKEN` | LinkedIn scraping | Netlify | Semi-private |

### Backend (Server-Only)
| Variable | Purpose | Platform | Security Level |
|----------|---------|----------|----------------|
| `STRIPE_SECRET_KEY` | Payment processing | Supabase | Private |
| `STRIPE_WEBHOOK_SECRET` | Webhook verification | Supabase | Private |
| `ANTHROPIC_API_KEY` | AI candidate analysis | Supabase | Private |
| `SUPABASE_SERVICE_ROLE_KEY` | Database admin access | Supabase | Private |

## Troubleshooting

### Common Issues:
1. **Variables not loading**: Check prefix (`VITE_` for frontend)
2. **Build failures**: Verify all required variables are set in Netlify
3. **Edge function errors**: Check Supabase secrets are configured
4. **Local development issues**: Ensure `.env` file exists with all variables

### Debug Commands:
```bash
# Check if variables are loaded (frontend)
console.log('Environment check:', {
  hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
  hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
});

# Check edge function variables
console.log('Edge function env:', {
  hasStripe: !!Deno.env.get('STRIPE_SECRET_KEY'),
  hasAnthropic: !!Deno.env.get('ANTHROPIC_API_KEY'),
  hasSupabase: !!Deno.env.get('SUPABASE_URL')
});
```

## Migration Strategy (If Needed)

If you want to consolidate (not recommended for your architecture):

1. **Option A**: Netlify Functions
   - Move edge functions to Netlify
   - All variables in Netlify dashboard
   - **Downside**: Lose Supabase's tight integration

2. **Option B**: All in Supabase
   - Move frontend build to Supabase
   - All variables in Supabase secrets
   - **Downside**: Less mature frontend hosting

**Recommendation**: Keep your current setup - it's following best practices!
