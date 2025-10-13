# 🚨 Reset Password Token Issue - SOLUTION

## The Problem

You're seeing this error:
```
⚠️ No recovery tokens found and user not authenticated
```

This means the reset password page is loading, but the authentication tokens are not in the URL.

---

## 🔍 Diagnosis Steps

### Step 1: Check What's in the Email Link

When you receive the password reset email, **right-click the reset button/link** and select **"Copy Link Address"**.

The link should look like ONE of these formats:

**Format 1: Query Parameters (Supabase default)**
```
https://yourdomain.com/reset-password?access_token=ey...&type=recovery&refresh_token=...
```

**Format 2: Hash Fragment (older config)**
```
https://yourdomain.com/reset-password#access_token=ey...&type=recovery&refresh_token=...
```

### Step 2: What If The Link Is Missing Tokens?

If the link looks like this (NO tokens):
```
https://yourdomain.com/reset-password
```

**This is the problem!** The email link is not including the tokens.

---

## 🔧 SOLUTIONS

### Solution 1: Fix Supabase Redirect URL Configuration ⭐ MOST COMMON

The issue is usually that Supabase doesn't know where to send the tokens.

#### Fix in Supabase Dashboard:

1. Go to: **Supabase Dashboard** → **Authentication** → **URL Configuration**

2. Verify these settings:

   **Site URL:**
   ```
   https://your-actual-live-domain.com
   ```
   ⚠️ Must be EXACT - include https://, no trailing slash

   **Redirect URLs (add all of these):**
   ```
   https://your-actual-live-domain.com/reset-password
   https://your-actual-live-domain.com/confirm-email
   https://your-actual-live-domain.com
   ```

3. **Save** changes

4. **Test Again**: Request a new password reset and check the email link

---

### Solution 2: Check Email Template Configuration

Sometimes the issue is in the email template itself.

#### In Supabase Dashboard:

1. Go to: **Authentication** → **Email Templates**
2. Click on **"Reset Password"** template
3. Look for the reset link in the template

The template should have something like:
```html
<a href="{{ .ConfirmationURL }}">Reset Password</a>
```

**Do NOT change this!** The `{{ .ConfirmationURL }}` variable is what Supabase uses to inject the tokens.

If someone changed this to a hardcoded URL, that's your problem.

---

### Solution 3: Check SMTP Configuration

If emails aren't sending at all, or links are malformed:

#### In Supabase Dashboard:

1. Go to: **Authentication** → **Settings** → **SMTP Settings**
2. Verify:
   - ✅ Custom SMTP is **ENABLED**
   - ✅ Host: `smtp.resend.com`
   - ✅ Port: `465`
   - ✅ Username: `resend`
   - ✅ Password: `[Your Resend API Key]`

---

### Solution 4: Netlify Redirect Rules

If you're using Netlify, sometimes the redirect rules strip query parameters.

#### Check `netlify.toml`:

Your current config should have:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

This is correct! It preserves query parameters.

**DO NOT** add `force = true` - this can cause issues.

---

## 🧪 Testing After Configuration Changes

### Step 1: Request a New Reset
1. Go to `/forgot-password`
2. Enter your email
3. Submit

### Step 2: Check the Email
1. Open the email
2. **Right-click** the reset button
3. **Copy link address**
4. **Paste it in a text editor**

### Step 3: Verify the Link Contains Tokens
The link should contain:
- `access_token=` followed by a long string
- `type=recovery`
- `refresh_token=` followed by another long string

Example:
```
https://yourdomain.com/reset-password?access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNjk...&type=recovery&refresh_token=v2AvSdE9MJK-PGRtNyYlrA
```

### Step 4: Click the Link
With the enhanced debugging, you should now see in the console:
```javascript
🔍 DETAILED URL ANALYSIS: {
  hasAccessTokenInQuery: true,
  hasAccessTokenInHash: false,
  hasTypeRecoveryInQuery: true,
  hasTypeRecoveryInHash: false,
  fullHref: "https://yourdomain.com/reset-password?access_token=..."
}
```

---

## 🎯 Quick Fix Checklist

Run through this checklist:

- [ ] **Supabase Site URL** is set to your EXACT production domain
- [ ] **Redirect URLs** include `/reset-password` for your domain
- [ ] **SMTP is configured** with Resend (or another provider)
- [ ] **Email template** uses `{{ .ConfirmationURL }}` variable
- [ ] Requested a **NEW** password reset (old links won't work)
- [ ] Checked the **actual email link** contains tokens
- [ ] Browser console shows the **DETAILED URL ANALYSIS** log

---

## 🔥 Emergency Workaround (If Nothing Works)

If you need to reset a password immediately while diagnosing:

### Option 1: Use Supabase Dashboard
1. Go to Supabase Dashboard → Authentication → Users
2. Find the user
3. Click on them
4. Click "Send Password Recovery Email"
5. This uses Supabase's default configuration

### Option 2: Manual Password Reset via SQL
1. Go to Supabase Dashboard → SQL Editor
2. Run this query (replace with actual email):
```sql
-- This forces a password reset for a specific user
UPDATE auth.users
SET encrypted_password = crypt('temporary-password-123', gen_salt('bf'))
WHERE email = 'user@example.com';
```
3. User can now login with `temporary-password-123`
4. Have them change it immediately via account settings

---

## 📊 Common Configurations & Issues

### Issue #1: Localhost in Production
**Symptom:** Email link points to `http://localhost:5173/reset-password`

**Cause:** Site URL in Supabase is set to localhost

**Fix:** Change Site URL to your production domain in Supabase Dashboard

---

### Issue #2: Redirect URL Not Whitelisted
**Symptom:** Error in console: "Invalid redirect URL"

**Cause:** Your domain is not in the Redirect URLs list

**Fix:** Add your domain + `/reset-password` to Redirect URLs in Supabase

---

### Issue #3: Tokens in Hash Instead of Query
**Symptom:** Tokens appear after `#` instead of `?`

**Cause:** Older Supabase configuration

**Fix:** This actually works! The code checks both. But if it's not working:
1. Update Supabase to use query parameters (newer format)
2. Or ensure hash detection is working in the code

---

### Issue #4: Tokens Stripped During Navigation
**Symptom:** Tokens appear briefly then disappear

**Cause:** React Router or other navigation logic is removing them

**Fix:** Check for any redirect logic in `App.tsx` or route guards

---

## 💡 Expected Console Output (Working)

When everything is working correctly, you should see:

```javascript
🔑 ResetPasswordPage component mounted! {
  fullURL: "https://yourdomain.com/reset-password?access_token=ey...&type=recovery&refresh_token=...",
  pathname: "/reset-password",
  search: "?access_token=ey...&type=recovery&refresh_token=...",
  hash: "",
  queryParams: {
    access_token: "eyJhbG...",
    type: "recovery",
    refresh_token: "v2AvS..."
  }
}

🔍 DETAILED URL ANALYSIS: {
  hasAccessTokenInQuery: true,
  hasAccessTokenInHash: false,
  hasTypeRecoveryInQuery: true,
  hasTypeRecoveryInHash: false,
  fullHref: "https://yourdomain.com/reset-password?..."
}

🔑 Found recovery tokens in query params
✅ Session set successfully for password recovery
```

---

## 🆘 Still Not Working?

### Share These Details:

1. **Full URL from the email** (remove the actual token values for security)
   ```
   Example: https://yourdomain.com/reset-password?access_token=REDACTED&type=recovery&refresh_token=REDACTED
   ```

2. **Console output from DETAILED URL ANALYSIS**

3. **Screenshot of Supabase URL Configuration page**
   - Site URL
   - Redirect URLs list

4. **Supabase Auth Logs**
   - Go to Dashboard → Logs → Auth Logs
   - Look for recent password reset events
   - Copy any error messages

---

## 📝 Next Steps After Fixing

Once you get it working:

1. **Test the complete flow** end-to-end
2. **Update documentation** with your correct domain
3. **Test with multiple users**
4. **Monitor Resend dashboard** for email delivery
5. **Check Supabase Auth logs** for any errors

---

**Last Updated:** October 2025
**Priority:** 🔴 Critical - Password reset must work for user recovery

