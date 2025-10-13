# 🚨 Supabase Sending OTP Instead of Magic Link

## The Problem

Your password reset email is sending a **6-digit OTP code** (`959637`) instead of a **JWT magic link**.

**URL You're Getting:**
```
https://shortlistbetacursor.netlify.app/reset-password?access_token=959637&refresh_token=&expires_in=&token_type=bearer&type=recovery
```

**URL You Should Get:**
```
https://shortlistbetacursor.netlify.app/reset-password?access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...&refresh_token=v2AvS...&type=recovery
```

**Root Cause:** Supabase production project is configured for **OTP authentication** instead of **magic link authentication**.

---

## 🔧 Fix in Supabase Dashboard

### Find and Change the Setting:

Go through these locations in order until you find the setting:

### 1. **Authentication → Providers → Email**
   - Look for: "Email Authentication Method" or "Auth Method"
   - Change from: **"OTP"** → **"Magic Link"**
   - Save

### 2. **Authentication → Settings**
   - Scroll down to "Email Auth Settings"
   - Look for: "Secure Email Change" or "Email OTP"
   - Disable OTP, Enable Magic Links
   - Save

### 3. **Authentication → URL Configuration**
   - Check if there's an option for "Link Type"
   - Ensure it's set to use redirect links (not OTP)

### 4. **Authentication → Email Templates → Reset Password**
   - Verify template uses: `{{ .ConfirmationURL }}`
   - Should NOT use: `{{ .Token }}` or `{{ .TokenHash }}`

---

## 🔍 Visual Guide

**What You're Looking For:**

```
┌─────────────────────────────────────┐
│ Email Authentication                │
├─────────────────────────────────────┤
│                                     │
│ How should users authenticate?      │
│                                     │
│ ○ Magic Link (Secure)              │ ← SELECT THIS!
│ ● OTP (One-Time Password)          │ ← Currently selected (wrong!)
│                                     │
└─────────────────────────────────────┘
```

---

## 📚 Supabase Documentation

**Official Docs:**
- Email Auth Overview: https://supabase.com/docs/guides/auth/auth-email
- Password Recovery: https://supabase.com/docs/guides/auth/passwords#password-recovery
- Email Templates: https://supabase.com/docs/guides/auth/auth-email-templates

**Key Section to Read:**
- Look for "Email Authentication Methods" or "Magic Link vs OTP"

---

## ⚡ Temporary Workaround: Add OTP Support

If you can't change the Supabase config immediately, you could add OTP support to your frontend:

### Option A: Create OTP Input Page

Create a page where users enter the 6-digit code from the email, then call:

```javascript
const { error } = await supabase.auth.verifyOtp({
  email: email,
  token: otpCode,
  type: 'recovery'
});
```

### Option B: Use Email Link OTP Flow

The code `959637` should work if you extract it and use the `verifyOtp` method instead of `setSession`.

**However,** this is NOT recommended because:
- It's less secure than magic links
- Requires more user steps
- OTP can be intercepted
- Your app is already built for magic links

**Better to fix the Supabase config!**

---

## 🎯 Expected Behavior After Fix

Once you change the Supabase config to use magic links:

1. **Email link will contain:**
   ```
   access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIi...
   (hundreds of characters)
   ```

2. **Console logs will show:**
   ```javascript
   ✅ 🔑 Found recovery tokens in query params
   ✅ Session set successfully for password recovery
   ```

3. **Password reset will work!**

---

## 🚦 Checklist

- [ ] Found the email auth method setting in Supabase Dashboard
- [ ] Changed from OTP to Magic Link
- [ ] Saved changes
- [ ] Waited 1-2 minutes for changes to propagate
- [ ] Requested a NEW password reset email
- [ ] Verified new email has long JWT token (not 6 digits)
- [ ] Clicked link and confirmed password form loads
- [ ] Successfully reset password

---

## 🆘 Can't Find the Setting?

### Try These:

1. **Search Dashboard:**
   - Press Ctrl+K or Cmd+K to open command palette
   - Search for: "OTP" or "Magic Link" or "Email Auth"

2. **Check Project Settings:**
   - Some projects have auth locked based on plan
   - Check if your plan supports magic links

3. **Use Supabase CLI:**
   ```bash
   supabase projects list
   supabase auth config
   ```

4. **Contact Supabase:**
   - Dashboard → Help → Contact Support
   - Mention: "Need to change email auth from OTP to magic link"

5. **Check Environment:**
   - Are you on the correct project?
   - Staging vs Production?

---

## 📝 Summary

**Problem:** OTP instead of magic link  
**Location:** Supabase Dashboard → Authentication settings  
**Fix:** Change email auth method from OTP to Magic Link  
**Result:** Password reset will work with your existing code  

---

**Priority:** 🔴 Must fix in Supabase Dashboard  
**Impact:** High - Password reset is broken for all users  
**Complexity:** Low - Just need to find and toggle a setting

