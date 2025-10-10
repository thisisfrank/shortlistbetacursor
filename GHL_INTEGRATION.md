# GoHighLevel Webhook Integration

## Overview
The application now sends different events to GoHighLevel via separate webhooks when specific actions occur.

## Environment Variables

### Required
- `VITE_GHL_SIGNUP_THANK_YOU_WEBHOOK_URL`: Webhook URL for user signup thank you events
- `VITE_GHL_JOB_SUBMISSION_CONFIRMATION_WEBHOOK_URL`: Webhook URL for job submission confirmation events  
- `VITE_GHL_CANDIDATE_READY_NOTIFICATION_WEBHOOK_URL`: Webhook URL for candidate ready notification events
- `VITE_GHL_JOB_COMPLETION_NOTIFICATION_WEBHOOK_URL`: Webhook URL for job completion notification events
- `VITE_GHL_PLAN_PURCHASE_WELCOME_WEBHOOK_URL`: Webhook URL for plan purchase welcome email (with Clay info)
- `VITE_GHL_FEEDBACK_SUBMISSION_WEBHOOK_URL`: Webhook URL for user feedback submission events

## Webhook Payload Formats

### 1. Sign Up Thank You Event
When a user signs up, the following payload is sent to the signup thank you webhook:

```json
{
  "event": "user_signup",
  "userData": {
    "id": "user-uuid",
    "email": "user@company.com",
    "name": "John Doe",
    "role": "client",
    "tierId": "tier-uuid",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "availableCredits": 20,
    "jobsRemaining": 1,
    "creditsResetDate": "2024-02-01T00:00:00.000Z"
  },
  "signupSource": "web_signup",
  "message": "New client signup: John Doe (user@company.com)"
}
```

### 2. Job Submission Confirmation Event
When a job is submitted, the following payload is sent to the job submission confirmation webhook:

```json
{
  "event": "job_submission_confirmation",
  "userId": "user-uuid",
  "userProfile": {
    "id": "user-uuid",
    "email": "user@company.com",
    "name": "John Doe",
    "role": "client",
    "tierId": "tier-uuid",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "jobData": {
    "id": "job-uuid",
    "title": "Software Engineer",
    "companyName": "Tech Corp",
    "location": "San Francisco, CA",
    "seniorityLevel": "Mid",
    "workArrangement": "Hybrid",
    "salaryRangeMin": 80000,
    "salaryRangeMax": 120000,
    "mustHaveSkills": ["React", "TypeScript"],
    "status": "Unclaimed",
    "candidatesRequested": 3,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Job submitted: Software Engineer at Tech Corp"
}
```

### 3. Candidate Ready Notification Event
When candidates are submitted for a job, the following payload is sent to the candidate ready notification webhook:

```json
{
  "event": "candidate_ready_notification",
  "userId": "user-uuid",
  "userProfile": {
    "id": "user-uuid",
    "email": "user@company.com",
    "name": "John Doe",
    "role": "client",
    "tierId": "tier-uuid",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "jobData": {
    "id": "job-uuid",
    "title": "Software Engineer",
    "companyName": "Tech Corp",
    "location": "San Francisco, CA"
  },
  "candidateData": {
    "id": "candidate-uuid",
    "firstName": "Jane",
    "lastName": "Smith",
    "linkedinUrl": "https://linkedin.com/in/janesmith",
    "headline": "Senior Software Engineer",
    "location": "San Francisco, CA",
    "experience": [
      {
        "title": "Senior Software Engineer",
        "company": "Tech Corp",
        "duration": "2 years"
      }
    ],
    "education": [
      {
        "school": "Stanford University",
        "degree": "Computer Science"
      }
    ],
    "skills": ["React", "TypeScript", "Node.js"],
    "summary": "Experienced software engineer...",
    "submittedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Candidate ready: Jane Smith for Software Engineer at Tech Corp"
}
```

### 4. Job Completion Notification Event
When a job is completed, the following payload is sent to the job completion notification webhook:

```json
{
  "event": "job_completion_notification",
  "userId": "user-uuid",
  "userEmail": "user@company.com",
  "userProfile": {
    "id": "user-uuid",
    "email": "user@company.com",
    "name": "John Doe",
    "role": "client",
    "tierId": "tier-uuid",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "jobData": {
    "id": "job-uuid",
    "title": "Software Engineer",
    "companyName": "Tech Corp",
    "location": "San Francisco, CA",
    "seniorityLevel": "Mid",
    "workArrangement": "Remote",
    "salaryRangeMin": 80000,
    "salaryRangeMax": 120000,
    "mustHaveSkills": ["React", "TypeScript"],
    "status": "Completed",
    "candidatesRequested": 3,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "candidatesData": [
    {
      "id": "candidate-uuid",
      "firstName": "John",
      "lastName": "Doe",
      "linkedinUrl": "https://linkedin.com/in/johndoe",
      "headline": "Senior Software Engineer",
      "location": "San Francisco, CA",
      "experience": [
        {
          "title": "Senior Software Engineer",
          "company": "Tech Corp",
          "duration": "2 years"
        }
      ],
      "education": [
        {
          "school": "Stanford University",
          "degree": "Computer Science"
        }
      ],
      "skills": ["React", "TypeScript", "Node.js"],
      "summary": "Experienced software engineer...",
      "submittedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "completionSummary": {
    "totalCandidates": 2,
    "requestedCandidates": 3,
    "completionDate": "2024-01-01T00:00:00.000Z"
  },
  "viewCandidatesLink": "https://yourapp.com/candidates",
  "viewCandidatesText": "View Your Candidates",
  "message": "Job completed: Software Engineer at Tech Corp - 2 candidates submitted"
}
```

**Note**: The `viewCandidatesLink` field contains a direct URL to the candidates page where the client can view their completed list. Use this in your GHL email template as a clickable button or link (e.g., `{{viewCandidatesLink}}`). The `viewCandidatesText` field provides suggested button text.

### 5. Plan Purchase Welcome Event
When a user purchases a subscription plan, the following payload is sent to trigger a welcome email with Clay table and referral information:

```json
{
  "event": "plan_purchase_welcome",
  "userEmail": "user@company.com",
  "userName": "John Doe",
  "planDetails": {
    "tierName": "Beast Mode",
    "tierId": "tier-uuid",
    "creditsGranted": 400
  },
  "clayReferralLink": "https://clay.com?via=bae546",
  "clayReferralBonus": 3000,
  "welcomeMessage": "Welcome to Beast Mode! You now have 400 candidate credits available.",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Email Template Should Include:**
- Welcome message with plan name
- Number of candidate credits available
- Clay table access information
- Clay referral link: `https://clay.com?via=bae546`
- Message: "Use this link to sign up for Clay and get 3,000 free credits!"

### 6. Feedback Submission Event
When a user submits feedback (general or job-specific), the following payload is sent:

```json
{
  "event": "feedback_submission",
  "userEmail": "user@company.com",
  "userName": "John Doe",
  "userId": "user-uuid",
  "userRole": "client",
  "feedbackDetails": {
    "feedback": "The candidate quality is excellent! Would love more filtering options.",
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

**Note**: `jobContext` will be `null` for general feedback submissions. It's only populated when feedback is submitted from the candidates page.

## Setup Instructions

1. **Get GoHighLevel Webhook URLs**: 
   - Log into your GoHighLevel account
   - Navigate to Settings > Integrations > Webhooks
   - Create separate webhook endpoints for each event type
   - Copy the webhook URLs

2. **Configure Environment Variables**:
   ```env
   VITE_GHL_SIGNUP_THANK_YOU_WEBHOOK_URL=https://your-signup-thank-you-webhook-url
   VITE_GHL_JOB_SUBMISSION_CONFIRMATION_WEBHOOK_URL=https://your-job-submission-confirmation-webhook-url
   VITE_GHL_CANDIDATE_READY_NOTIFICATION_WEBHOOK_URL=https://your-candidate-ready-notification-webhook-url
   VITE_GHL_JOB_COMPLETION_NOTIFICATION_WEBHOOK_URL=https://your-job-completion-notification-webhook-url
   VITE_GHL_PLAN_PURCHASE_WELCOME_WEBHOOK_URL=https://your-plan-purchase-welcome-webhook-url
   VITE_GHL_FEEDBACK_SUBMISSION_WEBHOOK_URL=https://your-feedback-submission-webhook-url
   ```

3. **For Netlify deployment**: Add these in the Netlify dashboard under Site Settings > Environment Variables

## Usage Examples

### Sign Up Thank You Event (Automatic)
```javascript
// Automatically fires when user signs up
await ghlService.sendSignupThankYouNotification(userProfile, 'web_signup');
```

### Job Submission Confirmation Event (Automatic)
```javascript
// Automatically fires when job is submitted
await ghlService.sendJobSubmissionConfirmation(job, userProfile);
```

### Candidate Ready Notification Event (Automatic)
```javascript
// Automatically fires when candidates are submitted
await ghlService.sendCandidateReadyNotification(candidate, job, userProfile);
```

### Job Completion Notification Event (Automatic)
```javascript
// Automatically fires when job is completed
await ghlService.sendJobCompletionNotification(job, userProfile, candidates);
```

### Plan Purchase Welcome Event (Automatic)
```javascript
// Automatically fires when user purchases a subscription plan via Stripe
// Triggered in Stripe webhook after checkout.session.completed
await ghlService.sendPlanPurchaseWelcome(userEmail, userName, tierName, creditsGranted, tierId);
```

### Feedback Submission Event (Automatic)
```javascript
// Automatically fires when user submits feedback (general or job-specific)
// Triggered in useGeneralFeedback.ts and CandidatesView.tsx
await ghlService.sendFeedbackSubmission(feedbackData);
```

## Error Handling

- If any webhook URL is not configured, that specific notification is skipped (logged but doesn't break the main flow)
- If any webhook call fails, the error is logged but doesn't prevent the main action
- Each webhook operates independently

## Testing

Use the browser console to test each webhook:
```javascript
// Test signup thank you webhook
testGHLWebhook()

// Test job submission webhook
testJobSubmissionWebhook()

// Test job completion webhook
testJobCompletionWebhook()

// Test other webhooks (add these to the service if needed)
// testCandidateReadyWebhook()
```

## Available Events

- `user_signup`: Sent when a new user registers (Sign Up Thank You)
- `job_submission_confirmation`: Sent when a job is submitted (Job Submission Confirmation)
- `candidate_ready_notification`: Sent when candidates are submitted (Candidate Ready Notification)
- `job_completion_notification`: Sent when a job is completed (Job Completion Notification)
- `plan_purchase_welcome`: Sent when a user purchases a subscription plan (includes Clay referral link)
- `feedback_submission`: Sent when a user submits feedback (general or job-specific) 