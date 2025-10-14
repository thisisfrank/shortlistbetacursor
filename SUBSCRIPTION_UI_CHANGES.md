# Subscription Status UI Changes

## What Changed in the UI

### Before (Hardcoded)
The AccountPage always showed:
```
┌─────────────────────────────────────────┐
│  👑  Starter                            │
│      Active Subscription Plan           │
│                          [ACTIVE] ←─────┤ Always green, always "ACTIVE"
├─────────────────────────────────────────┤
│  Next Credit Reset: Nov 1, 2025         │
└─────────────────────────────────────────┘
```

**Problem:** Even if the subscription was canceled, past due, or in trial, it would still show "ACTIVE".

---

### After (Dynamic)
The AccountPage now shows the **real** subscription status:

#### 1. Active Subscription
```
┌─────────────────────────────────────────┐
│  👑  Average Recruiter                  │
│      Active Subscription Plan           │
│                          [ACTIVE] ←─────┤ Green badge
├─────────────────────────────────────────┤
│  Next Credit Reset: Nov 1, 2025         │
└─────────────────────────────────────────┘
```

#### 2. Trial Period
```
┌─────────────────────────────────────────┐
│  👑  Super Recruiter                    │
│      Trial Subscription Plan            │
│                           [TRIAL] ←─────┤ Blue badge
├─────────────────────────────────────────┤
│  Next Credit Reset: Nov 15, 2025        │
└─────────────────────────────────────────┘
```

#### 3. Payment Past Due
```
┌─────────────────────────────────────────┐
│  👑  Average Recruiter                  │
│      Payment Past Due                   │
│                        [PAST DUE] ←─────┤ Red badge
├─────────────────────────────────────────┤
│  Next Credit Reset: Oct 20, 2025        │
└─────────────────────────────────────────┘
```

#### 4. Canceled Subscription
```
┌─────────────────────────────────────────┐
│  👑  Free                                │
│      Canceled Subscription              │
│                        [CANCELED] ←─────┤ Gray badge
├─────────────────────────────────────────┤
│  Credit Type: One-time allocation       │
└─────────────────────────────────────────┘
```

#### 5. Free Plan
```
┌─────────────────────────────────────────┐
│  👑  Free                                │
│      Free Plan                          │
│                             [FREE] ←────┤ Gray badge
├─────────────────────────────────────────┤
│  Credit Type: One-time allocation       │
└─────────────────────────────────────────┘
```

---

## Status Badge Colors

| Status | Badge Text | Color | Meaning |
|--------|-----------|-------|---------|
| `active` | ACTIVE | 🟢 Green | Subscription is currently active and paid |
| `trialing` | TRIAL | 🔵 Blue | User is in trial period |
| `past_due` | PAST DUE | 🔴 Red | Payment failed, subscription at risk |
| `canceled` | CANCELED | ⚪ Gray | Subscription has been canceled |
| `free` / null | FREE | ⚪ Gray | User on free tier |

---

## When Does the UI Update?

### Automatic Updates (via Webhook)
When any of these Stripe events occur, the database is automatically updated:

1. **New Subscription** → `customer.subscription.created`
2. **Subscription Updated** → `customer.subscription.updated` ← **THIS IS KEY**
3. **Plan Changed** → `customer.subscription.updated`
4. **Subscription Canceled** → `customer.subscription.deleted`
5. **Payment Failed** → `invoice.payment_failed`
6. **Payment Succeeded** → `invoice.payment_succeeded`

### User Sees Changes
- **On Page Refresh**: User must refresh the AccountPage to see updated status
- **On Login**: Fresh data is loaded from database
- **Real-time**: Not currently implemented (would require Supabase Realtime subscriptions)

---

## Data Source for Each Field

| UI Element | Data Source | Updated By |
|------------|-------------|------------|
| **Plan Name** | `tiers.name` (via `user_profiles.tier_id`) | Webhook updates `tier_id` |
| **Status Label** | `user_profiles.subscription_status` | Webhook updates on any subscription change |
| **Status Badge** | `user_profiles.subscription_status` | Webhook updates on any subscription change |
| **Next Credit Reset** | `user_profiles.subscription_period_end` | Webhook sets from `subscription.current_period_end` |

---

## Example: What Happens When Subscription Updates

### Scenario: User upgrades from "Average Recruiter" to "Super Recruiter"

1. **User clicks upgrade** in Stripe Checkout
2. **Stripe completes checkout** and sends webhook: `customer.subscription.updated`
3. **Webhook handler processes**:
   ```typescript
   // Receives from Stripe:
   subscription.status = 'active'
   subscription.current_period_end = 1730419200  // Unix timestamp
   subscription.items.data[0].price.id = 'price_1SALDYHb6LdHADWYwZ8almdN'
   
   // Updates database:
   user_profiles.tier_id = 'd8b7d6ae-8a44-49c9-9dc3-1c6b1838815fd'  // Super Recruiter
   user_profiles.subscription_status = 'active'
   user_profiles.subscription_period_end = '2024-11-01T00:00:00Z'
   user_profiles.available_credits += 400  // Add new tier credits
   ```

4. **User refreshes page** → Sees:
   ```
   ┌─────────────────────────────────────────┐
   │  👑  Super Recruiter                    │
   │      Active Subscription Plan           │
   │                          [ACTIVE]       │
   ├─────────────────────────────────────────┤
   │  Next Credit Reset: Nov 1, 2024         │
   └─────────────────────────────────────────┘
   ```

---

## Testing the Changes

### Manual Test Steps

1. **Check Active Subscription**:
   - Go to AccountPage
   - Verify plan name matches your actual Stripe subscription
   - Verify badge shows correct status
   - Verify "Next Credit Reset" date matches Stripe's `current_period_end`

2. **Test Subscription Update**:
   - In Stripe Dashboard, change subscription status or plan
   - Wait for webhook to process (usually < 1 second)
   - Refresh AccountPage
   - Verify UI reflects new status

3. **Test Different Statuses**:
   - In Stripe Dashboard, manually set subscription to different states:
     - Active → Should show green "ACTIVE"
     - Trialing → Should show blue "TRIAL"
     - Past Due → Should show red "PAST DUE"
     - Canceled → Should show gray "CANCELED"

### Webhook Test in Stripe Dashboard

1. Go to: **Developers → Webhooks → [Your Webhook]**
2. Click **"Send test webhook"**
3. Select event: `customer.subscription.updated`
4. Modify payload to test different statuses:
   ```json
   {
     "status": "active",  // or "trialing", "past_due", "canceled"
     "current_period_end": 1730419200
   }
   ```
5. Send webhook
6. Check webhook logs in Supabase Functions
7. Refresh AccountPage to verify UI updated

---

## Troubleshooting

### Issue: Status not updating after webhook
**Solution:**
1. Check Supabase Functions logs for webhook errors
2. Verify `subscription_status` in database was actually updated
3. Clear browser cache and hard refresh (Ctrl+Shift+R)
4. Verify `useAuth` hook is loading `subscription_status` field

### Issue: Wrong plan name showing
**Solution:**
1. Check `user_profiles.tier_id` matches one of the known tier IDs
2. Verify `tiers` table has correct names
3. Check DataContext fallback tier names are correct

### Issue: Next Credit Reset date is wrong
**Solution:**
1. Verify `subscription_period_end` in database
2. Check webhook is passing `subscription.current_period_end`
3. Ensure Unix timestamp is being converted to ISO string correctly

---

## Summary

✅ **Fixed:** Hardcoded "ACTIVE" status  
✅ **Fixed:** Tier ID typo in SubscriptionPlans.tsx  
✅ **Fixed:** Naming inconsistencies across codebase  
✅ **Improved:** Dynamic status display with color-coded badges  
✅ **Improved:** Real subscription data from Stripe webhooks  

The UI now accurately reflects the current subscription status from Stripe, updating automatically via webhooks whenever the subscription changes.

