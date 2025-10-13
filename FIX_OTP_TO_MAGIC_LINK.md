# ⚡ FIX NOW: Change OTP to Magic Link

## 🎯 **THE ISSUE**

Your email shows: `access_token=959637` (6 digits)  
Should show: `access_token=eyJhbGciOiJIUzI...` (500+ characters)

**You're sending OTP codes, not magic links!**

---

## 🚀 **5-MINUTE FIX**

### **Step 1: Open Supabase Dashboard** (30 seconds)
1. Go to: https://supabase.com/dashboard
2. Select project: **shortlistbetacursor** (or your project name)

### **Step 2: Find Email Auth Settings** (2 minutes)

Try these locations IN ORDER until you find it:

#### **Location A: Authentication → Providers**
1. Click **"Authentication"** in left sidebar
2. Click **"Providers"** tab
3. Find **"Email"** provider
4. Click to expand/configure
5. Look for **"Authentication Method"** or **"OTP"** setting
6. Change to **"Magic Link"** or disable **"OTP"**
7. Click **Save**

#### **Location B: Authentication → Settings**  
1. Click **"Authentication"** in left sidebar
2. Click **"Settings"** or scroll down to settings
3. Look for section called **"Email Settings"** or **"Email Auth"**
4. Find toggle for **"Email OTP"** or **"Secure Email Change"**
5. **Disable OTP** or **Enable Magic Links**
6. Click **Save**

#### **Location C: Check Email Template**
1. Click **"Authentication"** in left sidebar
2. Click **"Email Templates"**
3. Find **"Reset Password"** template
4. Verify it uses: `{{ .ConfirmationURL }}`
   - **Good:** `<a href="{{ .ConfirmationURL }}">Reset Password</a>`
   - **Bad:** `Your code is {{ .Token }}`

### **Step 3: Test** (2 minutes)
1. Wait 1 minute for changes to apply
2. Request a NEW password reset on your site
3. Check the email link
4. **Right-click → Copy Link**
5. Paste it - should have LONG token now:
   ```
   ✅ GOOD: access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOi...
   ❌ BAD:  access_token=959637
   ```

6. If GOOD → Click it and test password reset!
7. If still BAD → See troubleshooting below

---

## 🔍 **Still Can't Find It?**

### **Take Screenshots:**

1. Go to: **Authentication** → **Providers** → **Email**
2. Take screenshot of entire page
3. Go to: **Authentication** → **Settings**
4. Take screenshot
5. Share these screenshots so I can help identify the exact setting

### **Check Supabase Version:**

Some older Supabase projects might not have UI for this.

Run in **SQL Editor**:
```sql
-- Check auth configuration
SELECT 
  id,
  COALESCE(raw_app_meta_data->>'provider', 'email') as provider,
  raw_app_meta_data
FROM auth.users 
LIMIT 1;
```

---

## 🆘 **Alternative: Contact Supabase**

If you absolutely cannot find the setting:

1. Click **"?"** icon in Supabase Dashboard (bottom left)
2. Click **"Contact Support"**
3. Subject: **"Need to change email auth from OTP to magic link"**
4. Message:
   ```
   Hi, my project is sending OTP codes instead of magic links for password reset.
   
   Project: shortlistbetacursor.netlify.app
   Issue: access_token parameter is only 6 digits (OTP) instead of JWT
   Need: Configure email auth to use magic links, not OTP
   
   Can you help me find/change this setting?
   ```

---

## 🔧 **Workaround While You Search**

You can manually reset users' passwords via SQL:

```sql
-- Reset password for specific user (use in SQL Editor)
UPDATE auth.users
SET encrypted_password = crypt('TemporaryPassword123!', gen_salt('bf'))
WHERE email = 'user@example.com';
```

Then tell the user to:
1. Login with: `TemporaryPassword123!`
2. Go to Account Settings
3. Change password to their preferred one

---

## ✅ **Success Indicator**

When fixed, the email link will look like:

```
https://shortlistbetacursor.netlify.app/reset-password?
access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzA5MjM0NTY3LCJpYXQiOjE3MDkyMzA5NjcsInN1YiI6IjEyMzQ1Njc4LTEyMzQtMTIzNC0xMjM0LTEyMzQ1Njc4OTAxMiIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnt9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6Im90cCIsInRpbWVzdGFtcCI6MTcwOTIzMDk2N30seyJtZXRob2QiOiJyZWNvdmVyeSIsInRpbWVzdGFtcCI6MTcwOTIzMDk2N31dLCJzZXNzaW9uX2lkIjoiMTIzNDU2NzgtMTIzNC0xMjM0LTEyMzQtMTIzNDU2Nzg5MDEyIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
&type=recovery
&refresh_token=v2AvSdE9MJK-PGRtNyYlrA_1234567890
```

Notice the **access_token** is VERY long (not 6 digits).

---

## 📊 **What Each Setting Does**

| Setting | With OTP | With Magic Link |
|---------|----------|-----------------|
| Email contains | 6-digit code | Long JWT URL |
| User action | Copy code, paste in app | Click link |
| Security | Less secure | More secure |
| Your app | **Doesn't support** | **Fully supports** |

**You need Magic Link!**

---

## 🎯 **Bottom Line**

1. Find the OTP/Magic Link setting in Supabase Dashboard
2. Change it from OTP → Magic Link
3. Test with new password reset
4. Should work immediately!

**If you share screenshots of your Supabase Authentication pages, I can help identify the exact toggle!**

