# Feedback Submission Email - Implementation Summary

## Overview
A new email notification has been added that triggers when a user submits feedback (either general feedback or job-specific feedback). This allows you to acknowledge feedback and follow up with users.

## What Was Implemented

### 1. New GHL Webhook Function
**File**: `src/services/ghlService.ts`

Added `sendFeedbackSubmission()` function that sends:
- User information (email, name, ID, role)
- Feedback content
- Feedback type (general or job-specific)
- Page/context where feedback was submitted
- Optional job context (if feedback is about a specific job)

### 2. Integrated into Feedback Submissions
**Files Modified:**
- `src/hooks/useGeneralFeedback.ts` - General feedback (from Header)
- `src/components/candidates/CandidatesView.tsx` - Job-specific feedback

Both now send webhooks to:
1. ✅ Make.com (existing - preserved)
2. ✅ GoHighLevel (new - for email automation)

### 3. Updated Documentation
**File**: `GHL_INTEGRATION.md`

Added complete documentation for the feedback webhook including payload examples.

---

## What You Need to Do

### Step 1: Create GoHighLevel Webhook
1. Log into your GoHighLevel account
2. Navigate to Settings > Integrations > Webhooks
3. Create a new webhook called "Feedback Submission"
4. Copy the webhook URL you receive

### Step 2: Update Webhook URL

Replace the placeholder webhook URL in this file:

#### File: `src/services/ghlService.ts` (Line 55)
```typescript
// REPLACE THIS:
this.feedbackSubmissionWebhookUrl = 'https://services.leadconnectorhq.com/hooks/QekUNBmcxjsxAKXluQc0/webhook-trigger/REPLACE_WITH_YOUR_WEBHOOK_ID';

// WITH YOUR ACTUAL WEBHOOK URL:
this.feedbackSubmissionWebhookUrl = 'https://services.leadconnectorhq.com/hooks/QekUNBmcxjsxAKXluQc0/webhook-trigger/YOUR_ACTUAL_WEBHOOK_ID';
```

### Step 3: Create Email Automation in GoHighLevel

Set up a workflow that:
1. **Trigger**: Webhook received (feedback_submission)
2. **Action**: Send Email to user

### Step 4: Design Your Email Template

**Example Thank You Email:**

```
Subject: Thank you for your feedback, {{userName}}! 🙏

Hi {{userName}},

Thank you for taking the time to share your feedback with us!

Your Input:
"{{feedbackDetails.feedback}}"

{{#if jobContext}}
We noticed you provided feedback about: {{jobContext.jobTitle}} at {{jobContext.companyName}}
{{/if}}

We review all feedback carefully and use it to improve Super Recruiter. 
Your insights help us build a better product for everyone.

If you have any urgent issues or questions, feel free to reply to this email.

Thanks again for helping us improve!

Best regards,
The Super Recruiter Team

P.S. Want to share more feedback? Just use the feedback button in the app anytime.
```

### Step 5: Access the Webhook Payload

The webhook sends this data to GoHighLevel:

```json
{
  "event": "feedback_submission",
  "userEmail": "customer@company.com",
  "userName": "John Doe",
  "userId": "user-uuid",
  "userRole": "client",
  "feedbackDetails": {
    "feedback": "Love the candidate quality!",
    "feedbackType": "general",
    "page": "/candidates",
    "context": "header"
  },
  "jobContext": {
    "jobId": "job-uuid",
    "jobTitle": "Software Engineer",
    "companyName": "Tech Corp",
    "candidateCount": 15
  },
  "timestamp": "2024-01-09T00:00:00.000Z"
}
```

**Use these fields in your GHL email template:**
- `{{userEmail}}` - User's email address
- `{{userName}}` - User's name
- `{{userId}}` - User's unique ID
- `{{userRole}}` - User's role (client, sourcer, admin)
- `{{feedbackDetails.feedback}}` - The actual feedback text
- `{{feedbackDetails.feedbackType}}` - Type: "general" or job-specific
- `{{feedbackDetails.page}}` - Page where submitted
- `{{jobContext.jobTitle}}` - Job title (if applicable)
- `{{jobContext.companyName}}` - Company name (if applicable)
- `{{jobContext.candidateCount}}` - Number of candidates (if applicable)

**Note**: `jobContext` will be `null` for general feedback, so use conditional logic in your template.

---

## When Does This Email Send?

The email triggers automatically when:

### Scenario 1: General Feedback
1. ✅ User clicks "Feedback" button in header/footer
2. ✅ User fills out feedback form
3. ✅ User clicks "Submit"
4. ✅ Webhook sent to GHL
5. ✅ Email sent to user

### Scenario 2: Job-Specific Feedback
1. ✅ User is viewing candidates for a job
2. ✅ User clicks "Feedback" button
3. ✅ User submits feedback
4. ✅ Webhook sent to GHL (includes job context)
5. ✅ Email sent to user

**Timeline**: Email should arrive within 30 seconds of feedback submission.

---

## Benefits

✅ **Thank users immediately** for their feedback  
✅ **Show you care** about user input  
✅ **Acknowledge job-specific issues** with context  
✅ **Build trust** with responsive communication  
✅ **Gather follow-up info** by encouraging replies  

---

## Files Modified

1. ✅ `src/services/ghlService.ts` - Added webhook function
2. ✅ `src/hooks/useGeneralFeedback.ts` - Integrated GHL webhook
3. ✅ `src/components/candidates/CandidatesView.tsx` - Integrated GHL webhook
4. ✅ `GHL_INTEGRATION.md` - Updated documentation
5. ✅ `FEEDBACK_EMAIL_SETUP.md` - This setup guide (NEW)

---

## Testing

After you've updated the webhook URL:

1. **Test General Feedback**:
   - Click "Feedback" button in header
   - Submit test feedback
   - Check GHL webhook received
   - Verify email sent

2. **Test Job-Specific Feedback**:
   - Go to candidates page
   - Click "Feedback" button
   - Submit feedback about a job
   - Verify jobContext is included in webhook
   - Check email sent with job details

---

## Important Notes

⚠️ **Feedback still goes to Make.com too** - Both webhooks fire (GHL + Make.com)

⚠️ **Non-blocking** - If GHL webhook fails, user still sees "Feedback submitted" message

⚠️ **Use conditional logic** in your email template to handle cases where jobContext is null

---

## Email Template Tips

**Good practices:**
- Thank user warmly
- Quote their feedback back to them
- Mention job details if available
- Invite them to reply for urgent issues
- Keep it short and friendly
- Add a CTA to leave more feedback

**GHL Conditional Logic Example:**
```
{{#if jobContext}}
  We received your feedback about {{jobContext.jobTitle}} at {{jobContext.companyName}}.
{{else}}
  We received your general feedback about Super Recruiter.
{{/if}}
```

---

**Status**: ✅ Code Implementation Complete - Ready for webhook URL configuration

