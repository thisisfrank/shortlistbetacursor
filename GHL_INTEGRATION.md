# Go High Level Webhook Integration

This document explains how to use the Go High Level (GHL) webhook integration in your application.

## Overview

The GHL service allows you to send user data, job updates, and activity notifications to your Go High Level webhook endpoint. This enables automated email marketing, CRM updates, and workflow automation.

## Webhook URL

The webhook endpoint is configured at:
```
https://services.leadconnectorhq.com/hooks/QekUNBmcxjsxAKXluQc0/webhook-trigger/da3ce6bc-b439-4b02-bcfa-3599c9464e71
```

## Available Methods

### 1. Send User Data
```typescript
import { ghlService } from '../services/ghlService';

// Send complete user profile data
await ghlService.sendUserData(userProfile, jobs, transactions);
```

### 2. Send Job Status Updates
```typescript
// When a job is submitted
await ghlService.sendJobStatusUpdate(job, userProfile, 'submitted');

// When a job is claimed by a sourcer
await ghlService.sendJobStatusUpdate(job, userProfile, 'claimed');

// When a job is completed
await ghlService.sendJobStatusUpdate(job, userProfile, 'completed');

// When a job becomes overdue
await ghlService.sendJobStatusUpdate(job, userProfile, 'overdue');
```

### 3. Send Credit Transactions
```typescript
// When credits are deducted for job submission
await ghlService.sendCreditTransaction(transaction, userProfile);
```

### 4. Send User Activity
```typescript
// Track user activities
await ghlService.sendUserActivity(userProfile, 'login', 'User logged in');
await ghlService.sendUserActivity(userProfile, 'profile_update', 'Updated contact information');
await ghlService.sendUserActivity(userProfile, 'upgrade_clicked', 'Clicked upgrade button');
```

## Integration Examples

### Job Submission Flow
```typescript
// In ClientIntakeForm handleSubmit
const newJob = await addJob(jobData);

// Send notification to GHL
if (userProfile && newJob) {
  try {
    await ghlService.sendJobStatusUpdate(newJob, userProfile, 'submitted');
    console.log('✅ Job submission notification sent to GHL');
  } catch (ghlError) {
    console.warn('⚠️ GHL webhook notification failed:', ghlError);
    // Don't fail the job submission if GHL webhook fails
  }
}
```

### Credit Transaction Tracking
```typescript
// When credits are deducted
const transaction = await addCreditTransaction({
  userId: userProfile.id,
  transactionType: 'deduction',
  amount: 1,
  description: `Job submission: ${job.title}`,
  jobId: job.id
});

// Send to GHL
await ghlService.sendCreditTransaction(transaction, userProfile);
```

### User Activity Tracking
```typescript
// Track when users view their dashboard
useEffect(() => {
  if (userProfile) {
    ghlService.sendUserActivity(userProfile, 'dashboard_view', 'Viewed client dashboard');
  }
}, [userProfile]);
```

## Payload Structure

### User Data Export
```json
{
  "event": "user_data_export",
  "userId": "user-id",
  "userProfile": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "client",
    "tierId": "tier-premium",
    "availableCredits": 10,
    "jobsRemaining": 5,
    "creditsResetDate": "2024-02-01T00:00:00Z",
    "hasReceivedFreeShortlist": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  },
  "userJobs": [...],
  "creditTransactions": [...],
  "exportTimestamp": "2024-01-15T10:30:00Z",
  "source": "app-integration"
}
```

### Job Status Update
```json
{
  "event": "job_submitted",
  "userId": "user-id",
  "userProfile": {...},
  "job": {
    "id": "job-id",
    "title": "Senior Developer",
    "companyName": "Tech Corp",
    "status": "Unclaimed",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  },
  "status": "submitted",
  "timestamp": "2024-01-15T10:30:00Z",
  "source": "app-integration"
}
```

## Go High Level Workflow Setup

### 1. Email Marketing Campaigns
- **Trigger**: `job_submitted` event
- **Action**: Send welcome email with job submission confirmation
- **Data**: User profile, job details

### 2. Follow-up Sequences
- **Trigger**: `job_claimed` event
- **Action**: Send notification that job is being worked on
- **Data**: User profile, job details, sourcer info

### 3. Credit Reminder Campaigns
- **Trigger**: `credit_transaction` with low credits
- **Action**: Send upgrade reminder emails
- **Data**: User profile, credit balance, usage stats

### 4. Re-engagement Campaigns
- **Trigger**: `user_activity` with inactivity
- **Action**: Send re-engagement emails
- **Data**: User profile, last activity date

### 5. Success Celebrations
- **Trigger**: `job_completed` event
- **Action**: Send congratulations and request feedback
- **Data**: User profile, completed job details

## Error Handling

The GHL service includes error handling to prevent webhook failures from affecting your main application:

```typescript
try {
  await ghlService.sendJobStatusUpdate(job, userProfile, 'submitted');
  console.log('✅ GHL notification sent');
} catch (ghlError) {
  console.warn('⚠️ GHL webhook failed:', ghlError);
  // Continue with normal flow
}
```

## Testing

You can test the webhook integration using the provided test scripts:

```bash
# Test basic webhook functionality
node test_webhook_simple.js

# Test complete user data export
node test_webhook_complete.js
```

## Configuration

The webhook URL is currently hardcoded in the service. For production, consider:

1. **Environment Variables**: Move the webhook URL to environment variables
2. **Multiple Endpoints**: Support different webhook URLs for different environments
3. **Authentication**: Add API keys or authentication headers if required
4. **Rate Limiting**: Implement rate limiting to prevent webhook spam

## Future Enhancements

1. **Batch Processing**: Send multiple events in a single webhook call
2. **Retry Logic**: Implement retry mechanism for failed webhook calls
3. **Event Queue**: Queue events and send them asynchronously
4. **Webhook Validation**: Validate webhook responses and handle errors
5. **Analytics**: Track webhook success/failure rates 