# Forgot Password - Quick Check ⚡

## 🔴 CRITICAL - Must Be Configured in Production

### 1. Supabase SMTP Settings
**Location:** Supabase Dashboard → Authentication → Settings → SMTP Settings

```
✓ Custom SMTP: ENABLED
✓ Host: smtp.resend.com
✓ Port: 465
✓ Username: resend
✓ Password: [Your Resend API Key]
✓ Sender Email: onboarding@resend.dev
✓ Sender Name: Shortlist Beta
```

**If not configured:** Emails will not send at all ❌

---

### 2. Supabase URL Configuration
**Location:** Supabase Dashboard → Authentication → URL Configuration

```
Site URL: https://your-live-domain.com

Redirect URLs (add these):
✓ https://your-live-domain.com/reset-password
✓ https://your-live-domain.com/confirm-email
✓ https://your-live-domain.com
```

**If not configured:** Reset links will fail with "Invalid redirect URL" ❌

---

### 3. Resend Account
**Location:** https://resend.com/dashboard

```
✓ Account is active
✓ API key is valid
✓ Not exceeding rate limits (100 emails/day on free tier)
```

**If not configured:** Emails will not be delivered ❌

---

## 🟢 Quick Test (5 minutes)

### Option 1: Use the Diagnostic Tool
1. Open `test-forgot-password.html` in a browser
2. Enter your Supabase URL and Anon Key
3. Enter a test email
4. Click "Send Test Reset Email"
5. Check the email inbox

### Option 2: Test Manually
1. Go to: `https://your-domain.com/forgot-password`
2. Enter a valid user email
3. Click "Send Reset Link"
4. Check inbox (and spam folder)
5. Click the reset link
6. Set new password
7. Login with new password

---

## 🟡 If Something Fails

### No Email Received?
1. Check Resend Dashboard → Emails (https://resend.com/emails)
2. Check Supabase Auth Logs (Dashboard → Logs)
3. Verify SMTP settings are correct
4. Check spam folder

### Reset Link Doesn't Work?
1. Verify URL Configuration in Supabase includes your domain
2. Check if link expired (1 hour default)
3. Request a new reset link
4. Check browser console for errors

### Password Update Fails?
1. Password must be at least 6 characters
2. Check if session is authenticated
3. Look at browser console logs (should show 🔑 emojis)

---

## 📋 Implementation Details

### Current Flow:
```
User enters email → Supabase sends email via Resend → 
User clicks link → Redirects to /reset-password with tokens → 
User enters new password → Password updated → Redirect to login
```

### Key Files:
- `src/components/auth/ForgotPasswordPage.tsx` - Request reset page
- `src/components/auth/ResetPasswordPage.tsx` - Set new password page
- `src/hooks/useAuth.ts` - Auth logic (resetPassword, updatePassword)

---

## 🚨 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| No email received | SMTP not configured | Configure SMTP in Supabase Dashboard |
| Email in spam | Sender not verified | Verify domain in Resend Dashboard |
| Invalid reset link | URL not whitelisted | Add to Redirect URLs in Supabase |
| Link expired | Used after 1 hour | Request new reset link |
| Password update fails | Session expired | Click reset link again |

---

## 📞 Where to Get Help

1. **Supabase Dashboard Logs**: Dashboard → Logs → Auth Logs
2. **Resend Dashboard**: https://resend.com/emails
3. **Browser Console**: F12 → Console tab (look for 🔑 emoji logs)

---

## ✅ Success Checklist

When everything works, you should see:

- [ ] Email arrives within 10 seconds
- [ ] Subject: "Reset your Shortlist Beta password"
- [ ] Link redirects to `/reset-password` page
- [ ] Password form appears
- [ ] New password is accepted
- [ ] Can login with new password
- [ ] Resend Dashboard shows "Delivered"
- [ ] Supabase Auth Logs show no errors

---

**Next Step:** Open `FORGOT_PASSWORD_FLOW_GUIDE.md` for detailed troubleshooting

