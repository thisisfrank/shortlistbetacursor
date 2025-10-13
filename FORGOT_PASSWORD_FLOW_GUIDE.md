# Forgot Password Flow - Live Environment Checklist

## Overview
This document explains how the forgot password functionality works in your application and what you need to verify in your live environment.

---

## How It Works

### User Journey
1. **Request Reset** (`/forgot-password`)
   - User enters their email address
   - Frontend calls `resetPassword(email)` from `useAuth` hook
   - Supabase sends a password reset email via SMTP (Resend)

2. **Receive Email**
   - User receives email with subject: "Reset your Shortlist Beta password"
   - Email contains a magic link with tokens in the URL

3. **Click Reset Link** (`/reset-password`)
   - URL includes: `access_token`, `refresh_token`, and `type=recovery`
   - Frontend verifies tokens and authenticates the user session
   - User enters new password

4. **Update Password**
   - Frontend calls `updatePassword(newPassword)`
   - User is redirected to login page

---

## Current Implementation

### Frontend Routes
- `/forgot-password` - Request password reset page
- `/reset-password` - Set new password page (accessed via email link)

### Key Files
```
src/components/auth/ForgotPasswordPage.tsx - Request reset UI
src/components/auth/ResetPasswordPage.tsx  - Set new password UI
src/hooks/useAuth.ts                       - Auth logic (lines 426-478)
```

### Reset Flow Logic

#### 1. Request Reset (`resetPassword` function)
```javascript
// Location: src/hooks/useAuth.ts (line 426)
const resetPassword = async (email: string) => {
  const baseUrl = window.location.origin;
  const redirectUrl = `${baseUrl}/reset-password`;
  
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });
};
```

#### 2. Handle Reset Link (`ResetPasswordPage`)
```javascript
// Checks URL for: access_token, refresh_token, type=recovery
// Sets session with these tokens
// Allows user to enter new password
```

---

## Live Environment Checklist

### 1. Supabase Cloud Configuration ⚠️ **CRITICAL**

Navigate to: **Supabase Dashboard → Authentication → Settings**

#### A. SMTP Settings (Required for emails to send)
Verify these settings are configured:
```
☐ Custom SMTP: ENABLED
☐ Host: smtp.resend.com
☐ Port: 465
☐ Username: resend
☐ Password: [Your Resend API key]
☐ Sender Email: onboarding@resend.dev (or your custom domain)
☐ Sender Name: Shortlist Beta
```

**How to Check:**
1. Go to Supabase Dashboard
2. Select your project
3. Authentication → Settings
4. Scroll to "SMTP Settings"
5. Verify all fields are filled correctly

**Common Issues:**
- ❌ SMTP not enabled → Emails won't send
- ❌ Wrong API key → Authentication error in logs
- ❌ Unverified sender email → Emails rejected

---

#### B. URL Configuration (Required for redirects to work)
Navigate to: **Supabase Dashboard → Authentication → URL Configuration**

Verify these URLs are set:
```
Site URL: https://your-live-domain.com

Redirect URLs:
☐ https://your-live-domain.com/reset-password
☐ https://your-live-domain.com/confirm-email
☐ https://your-live-domain.com
```

**What This Does:**
- Supabase will ONLY redirect to URLs in this list
- The reset link in the email points to these URLs
- If URL not whitelisted → "Invalid redirect URL" error

**How to Test:**
```
Correct URL: https://yourdomain.com/reset-password?access_token=...&type=recovery
Wrong URL: http://localhost:5173/reset-password (won't work in production)
```

---

### 2. Resend Email Service ⚠️ **CRITICAL**

Navigate to: **https://resend.com/dashboard**

#### Verify:
```
☐ Account is active
☐ API key is valid and not expired
☐ Domain is verified (if using custom domain)
☐ Not hitting rate limits (check usage)
```

#### Rate Limits:
```
Free Tier:  100 emails/day, 3,000/month
Pro Tier:   50,000/month
```

**How to Check:**
1. Log into Resend dashboard
2. Go to "API Keys" - verify key is active
3. Go to "Emails" - check recent sends
4. Go to "Domains" - verify domain status (if applicable)

---

### 3. Frontend Configuration

#### Environment Variables in Netlify
Navigate to: **Netlify Dashboard → Site Settings → Environment Variables**

Verify these are set:
```
☐ VITE_SUPABASE_URL = https://yourproject.supabase.co
☐ VITE_SUPABASE_ANON_KEY = [Your anon key]
```

**Note:** These should match your Supabase project exactly.

---

## Testing the Flow in Production

### Step 1: Request Password Reset
1. Go to: `https://your-live-domain.com/forgot-password`
2. Enter a valid user email
3. Click "Send Reset Link"
4. **Expected:** Success message appears

### Step 2: Check Email Delivery
1. Check the email inbox (including spam folder)
2. **Expected:** Email with subject "Reset your Shortlist Beta password"
3. **If no email:**
   - Check Resend dashboard for send status
   - Check Supabase Auth logs for errors
   - Verify SMTP configuration

### Step 3: Click Reset Link
1. Click the link in the email
2. **Expected:** Redirects to `/reset-password` page
3. **Expected:** Shows "Set New Password" form
4. **If error appears:**
   - Check URL configuration in Supabase
   - Look for "Invalid reset link" message
   - Check browser console for errors

### Step 4: Set New Password
1. Enter new password (min 6 characters)
2. Confirm password
3. Click "Update Password"
4. **Expected:** Success message, then redirect to login
5. **Expected:** Can login with new password

---

## Troubleshooting

### Problem: Email Not Received

#### Check 1: Supabase Auth Logs
1. Go to Supabase Dashboard → Logs → Auth Logs
2. Look for password reset events
3. Check for errors

#### Check 2: Resend Dashboard
1. Go to Resend Dashboard → Emails
2. Look for recent sends
3. Check delivery status

#### Possible Causes:
- ❌ SMTP not configured in Supabase
- ❌ Invalid Resend API key
- ❌ Rate limit exceeded
- ❌ Email in spam folder
- ❌ Invalid email address

**Solution:**
```bash
# Check Supabase SMTP config
1. Supabase Dashboard → Authentication → Settings → SMTP Settings
2. Verify all fields are correct
3. Test with a known good email address
```

---

### Problem: Reset Link Invalid or Expired

#### Symptoms:
- "Invalid reset link" error message
- Link redirects to error page
- Session not authenticated

#### Possible Causes:
- ❌ Link expired (default: 1 hour)
- ❌ Link already used
- ❌ Wrong redirect URL (not whitelisted)
- ❌ Tokens corrupted/incomplete

#### Check:
1. Verify URL configuration in Supabase includes `/reset-password`
2. Check link expiry time (default: 3600 seconds = 1 hour)
3. Request a fresh reset link

**Configuration Location:**
```toml
# supabase/config.toml (local)
[auth.email]
otp_expiry = 3600  # 1 hour in seconds
```

**Change in Supabase Dashboard:**
1. Authentication → Settings
2. Look for "Email OTP Expiry"

---

### Problem: Password Update Fails

#### Symptoms:
- Error message after entering new password
- Password doesn't change
- Still can't login with new password

#### Possible Causes:
- ❌ Password too short (min 6 characters)
- ❌ Session expired
- ❌ User not authenticated

#### Check Browser Console:
Look for these log messages:
```javascript
🔑 updatePassword called, updating user password...
✅ Supabase updateUser successful
// OR
❌ Supabase updateUser error: [error details]
```

---

### Problem: Wrong Domain in Email Link

#### Symptoms:
- Link points to localhost or staging instead of production
- Link gives "Invalid redirect URL" error

#### Cause:
Site URL not configured correctly in Supabase

#### Fix:
1. Supabase Dashboard → Authentication → URL Configuration
2. Set **Site URL** to: `https://your-live-domain.com`
3. Add redirect URLs for production domain only

---

## Security Considerations

### Email Configuration
- ✅ Reset links expire after 1 hour
- ✅ Tokens are single-use
- ✅ Requires email access to reset
- ✅ Session-based authentication after reset

### Rate Limiting
Current limits (from `supabase/config.toml`):
```toml
[auth.rate_limit]
email_sent = 10  # Emails per hour per IP
```

**To Check Production Limits:**
1. Supabase Dashboard → Authentication → Settings
2. Look for "Rate Limits" section

---

## Quick Diagnostic Commands

### Check Frontend Configuration
Open browser console on your live site:
```javascript
// Check if Supabase is configured
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Has Anon Key:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
```

### Test Reset Request
In browser console:
```javascript
// Manually test reset (replace with real email)
await supabase.auth.resetPasswordForEmail('test@example.com', {
  redirectTo: 'https://your-domain.com/reset-password'
});
```

### Check Current Session
```javascript
// Check if user is authenticated after clicking reset link
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
```

---

## Configuration Summary Table

| Setting | Location | Current Value | Status |
|---------|----------|---------------|--------|
| SMTP Host | Supabase Auth Settings | smtp.resend.com | ⚠️ Verify |
| SMTP Port | Supabase Auth Settings | 465 | ⚠️ Verify |
| Resend API Key | Supabase Auth Settings | [Hidden] | ⚠️ Verify |
| Site URL | Supabase Auth URL Config | [Your domain] | ⚠️ Verify |
| Redirect URLs | Supabase Auth URL Config | /reset-password | ⚠️ Verify |
| Email Template | Supabase Email Templates | Default | ✅ Set |
| Token Expiry | Supabase Auth Settings | 3600s (1hr) | ✅ Set |

---

## Next Steps

1. **Verify Supabase SMTP Configuration**
   - Go to Supabase Dashboard
   - Check SMTP settings are correct
   - Test by requesting a password reset

2. **Verify URL Configuration**
   - Check site URL matches your live domain
   - Verify redirect URLs include `/reset-password`

3. **Test the Complete Flow**
   - Request reset from live site
   - Check email arrives
   - Click link and set new password
   - Verify login works

4. **Monitor Resend Dashboard**
   - Check emails are being sent
   - Verify delivery status
   - Monitor rate limits

---

## Support Resources

- **Supabase Auth Logs**: Dashboard → Logs → Auth Logs
- **Resend Email Logs**: https://resend.com/emails
- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth
- **Resend SMTP Guide**: https://resend.com/docs/send-with-smtp

---

## Common Success Indicators

When everything is working correctly, you should see:

✅ **In Supabase Logs:**
```
Password reset email sent to: user@example.com
```

✅ **In Resend Dashboard:**
```
Status: Delivered
Subject: Reset your Shortlist Beta password
```

✅ **In Browser Console (on reset page):**
```
🔑 Found recovery tokens in query params
✅ Session set successfully for password recovery
✅ Password updated successfully
```

✅ **User Experience:**
1. Receives email within seconds
2. Clicks link → lands on password form
3. Sets new password → success message
4. Can login with new password

---

## Emergency Fixes

### If emails aren't sending AT ALL:

1. **Quick Test**: Use Inbucket (local dev email testing)
   ```bash
   # Only for local testing
   http://localhost:54324
   ```

2. **Verify Resend API Key**
   - Log into Resend
   - Generate new API key if needed
   - Update in Supabase SMTP settings
   - Test again

3. **Check Supabase Status**
   - Visit: https://status.supabase.com
   - Verify no outages

### If reset link doesn't work:

1. **Manually set redirect URL in code**
   ```javascript
   // Temporarily hardcode for testing
   const redirectUrl = 'https://your-exact-domain.com/reset-password';
   ```

2. **Check URL whitelist**
   - Must match exactly (https vs http)
   - Must include subdomain if applicable
   - Must include port if non-standard

---

**Last Updated:** October 2025
**Status:** Ready for production verification

