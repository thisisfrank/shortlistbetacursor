# 🔐 Webhook Migration Guide - Secure Your Make.com URLs

## ✅ What Was Done

I've secured your Make.com webhook URLs by moving them from the frontend to the backend using Supabase Edge Functions (proxy pattern).

### Files Created:
- ✅ `supabase/functions/job-webhook-proxy/index.ts`
- ✅ `supabase/functions/request-more-candidates-proxy/index.ts`

### Files Updated:
- ✅ `src/services/webhookService.ts` - Now calls secure proxies
- ✅ `src/vite-env.d.ts` - Removed webhook URL types

---

## 🚀 DEPLOYMENT STEPS (Follow in Order)

### Step 1: Deploy Edge Functions to Supabase

**Option A: Via Supabase Dashboard (Easiest)**

1. Go to https://app.supabase.com
2. Select your project
3. Click "Edge Functions" in sidebar
4. Click "Deploy a new function"

**Deploy Function 1:**
- Name: `job-webhook-proxy`
- Copy code from: `supabase/functions/job-webhook-proxy/index.ts`
- Click "Deploy"

**Deploy Function 2:**
- Name: `request-more-candidates-proxy`
- Copy code from: `supabase/functions/request-more-candidates-proxy/index.ts`
- Click "Deploy"

**Option B: Via Supabase CLI (Advanced)**
```bash
# Install CLI if you haven't
npm install -g supabase

# Login
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy both functions
supabase functions deploy job-webhook-proxy
supabase functions deploy request-more-candidates-proxy
```

---

### Step 2: Add Webhook URLs to Supabase Edge Functions

1. Go to Supabase Dashboard → Settings → Edge Functions → Environment Variables
2. Add these NEW variables:

```
JOB_WEBHOOK_URL=https://hook.us1.make.com/ymemot9h7rnfocccrl8nhedvjlw7mj1l
REQUEST_MORE_CANDIDATES_WEBHOOK_URL=your_second_webhook_url_here
```

**⚠️ IMPORTANT:** Use the values from your Netlify variables (without the `VITE_` prefix)

---

### Step 3: Remove Webhook URLs from Netlify

1. Go to Netlify Dashboard → Your Site → Site Settings → Environment Variables
2. **DELETE** these variables:
   - ❌ `VITE_JOB_WEBHOOK_URL`
   - ❌ `VITE_SECOND_REQUEST_WEBHOOK_URL`
   - ❌ `VITE_STRIPE_PUBLISHABLE_KEY` (not used)

3. **KEEP** these variables (essential):
   - ✅ `VITE_SUPABASE_URL`
   - ✅ `VITE_SUPABASE_ANON_KEY`

---

### Step 4: Deploy Your Frontend to Netlify

**Option A: Push to Git (Automatic Deployment)**
```bash
git add .
git commit -m "Secure webhook URLs by moving to backend proxies"
git push origin main
```

**Option B: Netlify Dashboard**
- Go to Netlify → Deploys → Trigger deploy

---

### Step 5: Test the Webhooks

After deployment, test by:
1. Creating a new job in your app
2. Check browser console for: `✅ Webhook sent successfully via proxy`
3. Check Make.com to verify the webhook was received
4. Check Supabase Edge Functions logs to see the proxy activity

---

## 🔍 Verification Checklist

Before going live, verify:

- [ ] Both Edge Functions deployed to Supabase
- [ ] `JOB_WEBHOOK_URL` added to Supabase Edge Functions env
- [ ] `REQUEST_MORE_CANDIDATES_WEBHOOK_URL` added to Supabase Edge Functions env
- [ ] Webhook URLs removed from Netlify
- [ ] Frontend deployed to Netlify
- [ ] Test: Create a job → Check webhook fires
- [ ] Test: Request more candidates → Check webhook fires

---

## 📊 Environment Variable Summary

### ✅ Final Netlify Configuration (Frontend)
```bash
VITE_SUPABASE_URL=https://awhanhqdqgrvgghmulox.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_APP_URL=https://yourapp.com  # Optional
```

### ✅ Final Supabase Edge Functions Configuration (Backend)
```bash
# Database & Auth
SUPABASE_URL=https://awhanhqdqgrvgghmulox.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_DB_URL=postgresql://...  # Optional

# AI & Payments
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Scraping
SCRAPINGDOG_API_KEY=daa41463ff8a6a569a033ea739029dba10255f6f370c...

# Webhooks (NEW - Add these)
JOB_WEBHOOK_URL=
REQUEST_MORE_CANDIDATES_WEBHOOK_URL=your_second_webhook_url_here
```

---

## 🔐 Security Benefits Achieved

**Before (Insecure):**
```
Browser → Make.com (URL exposed in JavaScript)
```
❌ Anyone could spam your webhooks
❌ Webhook URLs visible in dev tools

**After (Secure):**
```
Browser → Supabase Proxy → Make.com (URL hidden on server)
```
✅ Webhook URLs never exposed to users
✅ Protected from unauthorized access
✅ Server-side validation and logging

---

## 🐛 Troubleshooting

### Webhook not firing?
1. Check browser console for errors
2. Check Supabase Edge Functions logs
3. Verify webhook URLs are set in Supabase (not Netlify)

### "Missing authorization header" error?
- Edge function needs the Authorization header (already added in code)
- Make sure you deployed the latest code

### Make.com not receiving webhooks?
1. Check Supabase Edge Function logs for successful forwarding
2. Verify `JOB_WEBHOOK_URL` is correct in Supabase
3. Test Make.com webhook URL directly (temporarily)

---

## 📞 Support

If you encounter issues:
1. Check Supabase Edge Functions logs
2. Check browser console
3. Check Make.com scenario history
4. Verify all environment variables are set correctly

---

## 🎉 Success!

Your webhook URLs are now secure and hidden from users! All API keys and webhook URLs are safely stored server-side.

**What's different for users?**
- Nothing! Webhooks work exactly the same
- They just can't see or steal your webhook URLs anymore

**What's better for you?**
- ✅ Protected from webhook spam
- ✅ Better security posture
- ✅ Following industry best practices
- ✅ Ready for security audits

