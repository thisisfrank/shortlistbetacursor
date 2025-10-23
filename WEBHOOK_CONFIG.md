# Webhook Configuration

## Request More Candidates Webhook

**Environment Variable:** `VITE_SECOND_REQUEST_WEBHOOK_URL`

**Webhook URL:** `https://hook.us1.make.com/qp7motv5zli8h3iqp7wffncvnibq9uf1`

---

## Setup Instructions

### Local Development

Create or update your `.env` file in the project root:

```env
VITE_SECOND_REQUEST_WEBHOOK_URL=https://hook.us1.make.com/qp7motv5zli8h3iqp7wffncvnibq9uf1
```

### Netlify Production

Add to Netlify Environment Variables:
1. Go to Netlify Dashboard → Site Settings → Environment Variables
2. Click "Add a variable"
3. Add:
   - **Key:** `VITE_SECOND_REQUEST_WEBHOOK_URL`
   - **Value:** `https://hook.us1.make.com/qp7motv5zli8h3iqp7wffncvnibq9uf1`
4. Click "Create variable"
5. Deploy site to apply changes

---

## Webhook Payload

The webhook sends the following data when a user requests more candidates:

```json
{
  "jobId": "uuid",
  "title": "Job Title",
  "companyName": "Company Name",
  "previousCandidatesRequested": 50,
  "additionalCandidatesRequested": 50,
  "newTotalCandidatesRequested": 100,
  "searchInstructions": "Optional feedback from user",
  "userId": "user-uuid",
  "userEmail": "user@example.com",
  "userName": "User Name",
  "requestTimestamp": "2025-01-01T12:00:00.000Z"
}
```

---

## Implementation Status

✅ Webhook service method created  
✅ Credit checking implemented  
✅ Credit deduction implemented  
✅ Job status update implemented  
✅ Webhook integration complete  
⏳ Environment variable needs to be added (see setup instructions above)

---

## Testing

To test the webhook:
1. Add the environment variable locally (`.env` file)
2. Restart your development server
3. Login as a client
4. Navigate to a job with candidates
5. Click "REQUEST MORE" button
6. Select a quantity and click confirm
7. Check Make.com scenario for webhook receipt

---

**Created:** 2025-01-23  
**Feature:** Request More Candidates with Credit Check & Webhook

