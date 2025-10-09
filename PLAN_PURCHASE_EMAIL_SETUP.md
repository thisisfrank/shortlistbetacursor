# Plan Purchase Welcome Email - Implementation Summary

## Overview
A new email notification has been added that triggers when a user purchases a subscription plan. This email welcomes them and provides Clay referral information.

## What Was Implemented

### 1. New GHL Webhook Function
**File**: `src/services/ghlService.ts`

Added `sendPlanPurchaseWelcome()` function that sends:
- User's email and name
- Plan details (tier name, tier ID, credits granted)
- Clay referral link: `https://clay.com?via=bae546`
- Clay referral bonus: 3,000 credits
- Welcome message with credit info

### 2. Stripe Webhook Integration
**File**: `supabase/functions/stripe-webhook/index.ts`

Modified the `checkout.session.completed` event handler to:
- Detect when a subscription purchase is completed
- Fetch tier details (plan name, credits) from database
- Fetch user name from database
- Send webhook to GoHighLevel with all plan purchase info
- Includes Clay referral link in the payload

### 3. Updated Documentation
**File**: `GHL_INTEGRATION.md`

Added complete documentation for the new webhook including:
- Payload format example
- Setup instructions
- Email template requirements

---

## What You Need to Do

### Step 1: Create GoHighLevel Webhook
1. Log into your GoHighLevel account
2. Navigate to Settings > Integrations > Webhooks
3. Create a new webhook called "Plan Purchase Welcome"
4. Copy the webhook URL you receive

### Step 2: Update Webhook URLs

Replace the placeholder webhook URL in **TWO** files:

#### File 1: `src/services/ghlService.ts` (Line 52)
```typescript
// REPLACE THIS:
this.planPurchaseWelcomeWebhookUrl = 'https://services.leadconnectorhq.com/hooks/QekUNBmcxjsxAKXluQc0/webhook-trigger/REPLACE_WITH_YOUR_WEBHOOK_ID';

// WITH YOUR ACTUAL WEBHOOK URL:
this.planPurchaseWelcomeWebhookUrl = 'https://services.leadconnectorhq.com/hooks/QekUNBmcxjsxAKXluQc0/webhook-trigger/YOUR_ACTUAL_WEBHOOK_ID';
```

#### File 2: `supabase/functions/stripe-webhook/index.ts` (Line 470)
```typescript
// REPLACE THIS:
const ghlWebhookUrl = 'https://services.leadconnectorhq.com/hooks/QekUNBmcxjsxAKXluQc0/webhook-trigger/REPLACE_WITH_YOUR_WEBHOOK_ID'

// WITH YOUR ACTUAL WEBHOOK URL:
const ghlWebhookUrl = 'https://services.leadconnectorhq.com/hooks/QekUNBmcxjsxAKXluQc0/webhook-trigger/YOUR_ACTUAL_WEBHOOK_ID'
```

### Step 3: Create Email Template in GoHighLevel

When the webhook triggers, create an email automation that includes:

**Email Subject**: Welcome to [Plan Name] - Your Clay Bonus Inside! 🎉

**Email Body Should Include**:
1. **Welcome Message**
   - "Welcome to [tierName]!"
   - "You now have [creditsGranted] candidate credits available"

2. **Clay Table Information**
   - Instructions on accessing their Clay table
   - How to use their credits

3. **Clay Referral Link** (IMPORTANT!)
   - Link: `https://clay.com?via=bae546`
   - Message: "Sign up for Clay using this link and get **3,000 FREE credits**!"
   - Make this prominent and clickable

4. **Next Steps**
   - How to submit their first job
   - Link to dashboard
   - Support contact info

### Step 4: Access the Webhook Payload

The webhook sends this data to GoHighLevel:

```json
{
  "event": "plan_purchase_welcome",
  "userEmail": "customer@company.com",
  "userName": "John Doe",
  "planDetails": {
    "tierName": "Beast Mode",
    "tierId": "f871eb1b-6756-447d-a1c0-20a373d1d5a2",
    "creditsGranted": 400
  },
  "clayReferralLink": "https://clay.com?via=bae546",
  "clayReferralBonus": 3000,
  "welcomeMessage": "Welcome to Beast Mode! You now have 400 candidate credits available.",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Use these fields in your GHL email template:**
- `{{userEmail}}` - Customer's email
- `{{userName}}` - Customer's name
- `{{planDetails.tierName}}` - Plan name (e.g., "Beast Mode")
- `{{planDetails.creditsGranted}}` - Number of credits (e.g., 400)
- `{{clayReferralLink}}` - The Clay referral URL
- `{{clayReferralBonus}}` - The bonus amount (3000)
- `{{welcomeMessage}}` - Pre-formatted welcome message

---

## When Does This Email Send?

The email triggers automatically when:
1. ✅ A user clicks "Subscribe" on the `/subscription` page
2. ✅ They complete the Stripe payment
3. ✅ Stripe sends a `checkout.session.completed` webhook
4. ✅ Your Supabase webhook processes the purchase
5. ✅ The GHL webhook is triggered with plan details
6. ✅ GoHighLevel sends the email to the customer

**Timeline**: Email should arrive within 1-2 minutes of purchase completion.

---

## Testing

After you've updated the webhook URLs:

1. **Test Purchase Flow**:
   - Use a Stripe test payment link
   - Complete a test subscription purchase
   - Check that the webhook fires in GHL
   - Verify the email is sent with correct info

2. **Check Logs**:
   - Stripe Dashboard > Webhooks > View recent events
   - Supabase Edge Functions logs
   - GoHighLevel webhook activity

---

## Files Modified

1. ✅ `src/services/ghlService.ts` - Added new webhook function
2. ✅ `supabase/functions/stripe-webhook/index.ts` - Added webhook trigger
3. ✅ `GHL_INTEGRATION.md` - Updated documentation
4. ✅ `PLAN_PURCHASE_EMAIL_SETUP.md` - This setup guide (NEW)

---

## Important Notes

⚠️ **The webhook URL must be updated in TWO places** (both the frontend service and the Stripe webhook function)

⚠️ **After updating the Stripe webhook**, you need to redeploy it to Supabase:
```bash
supabase functions deploy stripe-webhook
```

⚠️ **Make sure the Clay referral link is prominent** in the email - this is a key benefit for users!

---

## Questions?

If the email isn't sending:
1. Check both webhook URLs are updated correctly
2. Verify the GHL webhook is active
3. Check Stripe webhook logs for errors
4. Test with a real subscription purchase (test mode)

---

**Status**: ✅ Code Implementation Complete - Ready for webhook URL configuration

