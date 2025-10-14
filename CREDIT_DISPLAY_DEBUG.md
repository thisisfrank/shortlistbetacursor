# Credit Display Debug Guide

## Issue
Credits displayed in the UI don't match the database for user `d255e82d-e0a6-4ade-b089-e3318eb3213a`

## What Was Fixed

### 1. Display Bug in AccountPage.tsx
**Problem:** The UI was showing `candidatesUsed` instead of `candidatesRemaining`

**Fixed:** 
- Line 493 in `src/pages/AccountPage.tsx` now correctly displays: `{stats.candidatesRemaining} / {stats.candidatesLimit}`
- Line 499: The progress bar now correctly uses `candidatesRemaining` to show remaining credits (full bar = lots of credits left)

### 2. Credit Calculation Logic Mismatch for Paid Tiers
**Problem:** The database stored credits in `available_credits`, but the UI was calculating from `credit_transactions` table, causing a mismatch

**Fixed:**
- Lines 61-104 in `src/utils/userUsageStats.ts` now use `available_credits` from database as the source of truth for BOTH free and paid tiers
- `credit_transactions` are still logged for audit trail but are no longer the primary source for display
- Added enhanced logging to show both database value and transaction-based calculation for comparison

### 3. Enhanced Debug Logging
Added comprehensive console logging to `src/utils/userUsageStats.ts` to trace credit calculations:
- **FREE TIER**: Logs available credits from DB and calculated values
- **PAID TIER**: Logs both database value AND transaction-based calculation, plus a mismatch flag if they differ

## How Credits Are Calculated

### Free Tier (Tier ID: 5841d1d6-20d7-4360-96f8-0444305fac5b)
```typescript
candidatesLimit = 20 (one-time allocation)
candidatesRemaining = userProfile.availableCredits (from database)
candidatesUsed = candidatesLimit - candidatesRemaining
creditsResetDate = null (no reset for free tier)
```

### Paid Tiers
```typescript
candidatesLimit = tier.monthlyCandidateAllotment (from tier configuration)
candidatesRemaining = userProfile.availableCredits (from database - SOURCE OF TRUTH)
candidatesUsed = candidatesLimit - candidatesRemaining
creditsResetDate = subscriptionPeriodEnd (from Stripe) or start of next month

// Note: credit_transactions are still logged for audit trail and debugging,
// but available_credits field is the primary source used for display
```

## Debug Steps

### 1. Run the SQL Diagnostic Query
Execute the queries in `debug_user_credits.sql` in your Supabase SQL editor. This will show:
- User profile data (tier, available_credits, subscription status)
- Current tier configuration
- All credit transactions for this month
- Total credits used this month
- Jobs and candidates count
- Full diagnostic summary with calculated values

### 2. Check Browser Console
1. Log in as the user or have them open their account page
2. Open browser developer console (F12)
3. Look for logs starting with `📊 [FREE TIER]` or `📊 [PAID TIER]`
4. This will show exactly what values are being calculated

### 3. Compare Values
Compare these three sources:
- **Database**: `available_credits` from user_profiles table
- **Console Log**: What the UI is calculating
- **UI Display**: What's shown on screen

### 4. Common Issues to Check

#### For Free Tier Users:
- `available_credits` field in database should match remaining credits
- Check if any candidates were submitted (this should decrement available_credits)
- Verify `tier_id` is the free tier UUID

#### For Paid Tier Users:
- Check if credit_transactions are being recorded properly
- Verify transactions have correct `transaction_type = 'deduction'`
- Ensure transactions have 'candidate' in the description
- Check if the subscription status is active
- Verify the tier's `monthly_candidate_allotment` is correct

## SQL Query Example for Quick Check

```sql
-- Quick diagnostic for specific user
SELECT 
    up.email,
    up.tier_id,
    t.name as tier_name,
    t.monthly_candidate_allotment,
    up.available_credits as db_credits,
    up.subscription_status,
    (SELECT COUNT(*) FROM credit_transactions 
     WHERE user_id = up.id 
       AND transaction_type = 'deduction'
       AND created_at >= date_trunc('month', CURRENT_DATE)) as transactions_this_month,
    (SELECT COALESCE(SUM(ABS(amount)), 0) FROM credit_transactions 
     WHERE user_id = up.id 
       AND transaction_type = 'deduction'
       AND description LIKE '%candidate%'
       AND created_at >= date_trunc('month', CURRENT_DATE)) as credits_used_this_month
FROM user_profiles up
LEFT JOIN tiers t ON up.tier_id = t.id
WHERE up.id = 'd255e82d-e0a6-4ade-b089-e3318eb3213a';
```

## Expected Behavior

### Free Tier
- Shows remaining credits from one-time allocation
- No monthly reset
- Credits decrement as candidates are submitted (updates `available_credits` field)
- When 0 credits remain, user must upgrade

### Paid Tiers
- Shows remaining credits from `available_credits` field in database
- Credits decrement as candidates are submitted (updates `available_credits` field)
- Credits reset to tier allotment at subscription period end (via Stripe webhook)
- Tracks usage via credit_transactions table for audit trail
- **Both free and paid tiers now use `available_credits` as the source of truth**

## Next Steps

1. Run the SQL queries to see actual database values
2. Check browser console for calculated values
3. Compare database vs calculated vs displayed values
4. If there's still a mismatch, the issue might be:
   - Credit transactions not being recorded when candidates are submitted
   - Wrong tier configuration
   - Subscription status not properly synced with Stripe
   - Cache issues (try hard refresh: Ctrl+Shift+R)

## Files Modified
- `src/pages/AccountPage.tsx` - Fixed display bug
- `src/utils/userUsageStats.ts` - Added debug logging
- `debug_user_credits.sql` - Diagnostic SQL queries (temporary file)

