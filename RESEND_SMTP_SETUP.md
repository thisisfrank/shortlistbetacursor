# Resend SMTP Setup Guide

This guide explains how to configure Resend as the SMTP email provider for Supabase authentication emails (password reset, email confirmation, etc.).

## Overview

Supabase uses SMTP to send authentication emails. By default, it's configured with a local test SMTP server that doesn't work in production. This guide will help you configure Resend for reliable email delivery in both development and production.

## Prerequisites

- A Resend account (sign up at https://resend.com)
- A Resend API key (found in your Resend dashboard under API Keys)
- Access to your Supabase Cloud dashboard

---

## Part 1: Configure Supabase Cloud (Production)

### Step 1: Get Your Resend API Key

1. Log in to your Resend dashboard: https://resend.com/login
2. Navigate to **API Keys** in the sidebar
3. Click **Create API Key**
4. Give it a name (e.g., "Supabase Production SMTP")
5. Copy the API key (starts with `re_`)

### Step 2: Configure SMTP in Supabase Dashboard

1. Log in to your Supabase project: https://supabase.com/dashboard
2. Select your project
3. Navigate to: **Authentication** → **Settings** (in the sidebar)
4. Scroll down to **SMTP Settings**
5. Click **Enable Custom SMTP**
6. Fill in the following settings:

   ```
   Host: smtp.resend.com
   Port Number: 465
   Username: resend
   Password: [Your Resend API key from Step 1]
   Sender Email: onboarding@resend.dev
   Sender Name: Shortlist Beta
   ```

   **Note:** Port 465 uses implicit SSL/TLS. You can also use port 587 with explicit STARTTLS if needed.

7. Click **Save**

### Step 3: Update Redirect URLs

While in the Supabase dashboard:

1. Go to: **Authentication** → **URL Configuration**
2. Update **Site URL** to your production domain:
   ```
   https://yourdomain.com
   ```
3. Add **Redirect URLs** for password reset and email confirmation:
   ```
   https://yourdomain.com/reset-password
   https://yourdomain.com/confirm-email
   ```
4. Click **Save**

---

## Part 2: Configure Local Development

### Step 1: Update Local Supabase Config

1. Open `supabase/config.toml` in your project
2. Find the `[auth.email.smtp]` section (around line 191)
3. Replace the existing SMTP configuration with:

   ```toml
   [auth.email.smtp]
   enabled = true
   host = "smtp.resend.com"
   port = 465
   user = "resend"
   pass = "your-resend-api-key-here"
   admin_email = "onboarding@resend.dev"
   sender_name = "Shortlist Beta"
   ```

4. Replace `your-resend-api-key-here` with your actual Resend API key

### Step 2: Restart Local Supabase

After updating the config, restart your local Supabase instance:

```bash
supabase stop
supabase start
```

---

## Part 3: Using a Custom Domain Email (Optional)

If you want to send emails from your own domain (e.g., `noreply@yourdomain.com`) instead of `onboarding@resend.dev`:

### Step 1: Verify Your Domain in Resend

1. Go to your Resend dashboard: https://resend.com/domains
2. Click **Add Domain**
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the DNS records provided by Resend to your domain's DNS settings
5. Wait for verification (usually takes a few minutes)

### Step 2: Update Email Sender

Once verified, update the `admin_email` in both:
- Supabase Cloud dashboard SMTP settings
- Local `supabase/config.toml` file

Change from:
```toml
admin_email = "onboarding@resend.dev"
```

To:
```toml
admin_email = "noreply@yourdomain.com"
```

---

## Part 4: Testing

### Test Password Reset Flow

1. Navigate to the forgot password page: `/forgot-password`
2. Enter a valid email address
3. Submit the form
4. Check the email inbox for the password reset email
5. Click the reset link and verify it redirects to `/reset-password`
6. Enter a new password and submit
7. Verify you can log in with the new password

### Test Email Confirmation Flow

1. Create a new user account
2. Check for the confirmation email
3. Click the confirmation link
4. Verify the account is activated

### Monitoring Emails in Resend

1. Go to Resend dashboard: https://resend.com/emails
2. View all sent emails, their status, and any errors
3. Use this to debug any email delivery issues

---

## Troubleshooting

### Emails Not Sending

1. **Check Resend API Key**: Ensure the API key is correct and active
2. **Check Rate Limits**: Free Resend accounts have limits (100 emails/day)
3. **Check Supabase Logs**: View Auth logs in Supabase dashboard
4. **Check Email Rate Limits**: Supabase has rate limits in `config.toml`:
   ```toml
   [auth.rate_limit]
   email_sent = 2  # Emails per hour
   ```

### Emails Going to Spam

1. If using custom domain, ensure all DNS records are properly configured
2. Use proper sender name and email
3. Consider using Resend's domain authentication features

### Reset Link Not Working

1. Verify redirect URLs are correctly configured in Supabase dashboard
2. Check that the link hasn't expired (default: 1 hour)
3. Ensure the frontend is properly handling the token parameters

### Local Development Issues

1. Make sure you've restarted Supabase after config changes:
   ```bash
   supabase stop
   supabase start
   ```
2. Check Supabase logs:
   ```bash
   supabase status
   ```

---

## Email Templates

Supabase uses default email templates for authentication emails. The subjects are customized in `supabase/config.toml`:

```toml
[auth.email.template.recovery]
subject = "Reset your Shortlist Beta password"

[auth.email.template.confirmation]
subject = "Confirm your Shortlist Beta account"
```

To customize email templates further, you need to:
1. Go to Supabase dashboard → Authentication → Email Templates
2. Edit the HTML/text templates for each email type

---

## Security Notes

- **Never commit your Resend API key to version control**
- Consider using environment variables for the API key in production
- Rotate your API keys periodically
- Use separate API keys for development and production environments
- Monitor your Resend dashboard for suspicious activity

---

## Rate Limits

### Resend Free Tier
- 100 emails per day
- 3,000 emails per month

### Resend Pro Tier
- 50,000 emails per month
- Additional emails available

### Supabase Rate Limits
Configure in `supabase/config.toml`:
```toml
[auth.rate_limit]
email_sent = 2  # Emails per hour per IP
```

---

## Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend SMTP Guide](https://resend.com/docs/send-with-smtp)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase SMTP Configuration](https://supabase.com/docs/guides/auth/auth-smtp)

---

## Support

- **Resend Support**: support@resend.com
- **Supabase Support**: https://supabase.com/dashboard/support
- **Project Issues**: Check your project's issue tracker

