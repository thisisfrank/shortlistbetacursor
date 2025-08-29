# Job Posting Webhook Documentation

## Overview

When a new job is posted in the ShortlistApp, the system automatically sends an HTTP POST webhook to a configured endpoint with detailed job information.

## Configuration

### Environment Variable
Set `VITE_JOB_WEBHOOK_URL` in your environment:

**Netlify Dashboard:**
- Navigate to: Site Settings > Environment Variables
- Add: `VITE_JOB_WEBHOOK_URL` = `https://your-webhook-endpoint.com/job-posted`

**Local Development (.env):**
```env
VITE_JOB_WEBHOOK_URL=https://your-webhook-endpoint.com/job-posted
```

### Optional Configuration
- The webhook is completely optional - if no URL is configured, job creation continues normally without webhook calls
- The webhook is non-blocking - job creation will succeed even if the webhook fails

## Webhook Payload

### HTTP Request Details
- **Method:** POST
- **Content-Type:** application/json
- **User-Agent:** ShortlistApp/1.0
- **Timeout:** 10 seconds per attempt
- **Retries:** 3 attempts with exponential backoff

### Payload Structure

```json
{
  "jobId": "uuid-string",
  "title": "Software Engineer",
  "description": "We are looking for a skilled software engineer...",
  "companyName": "Tech Company Inc",
  "location": "San Francisco, CA",
  "seniorityLevel": "Senior",
  "workArrangement": "Remote",
  "salaryRangeMin": 120000,
  "salaryRangeMax": 180000,
  "mustHaveSkills": ["JavaScript", "React", "Node.js"],
  "candidatesRequested": 5,
  "userId": "user-uuid-string",
  "userEmail": "client@company.com",
  "userName": "John Doe",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "status": "Unclaimed",
  "webhookTimestamp": "2024-01-15T10:30:01.234Z"
}
```

### Field Descriptions

#### Core Job Information
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `jobId` | string | Unique identifier for the job | `"550e8400-e29b-41d4-a716-446655440000"` |
| `title` | string | Job position title | `"Senior Software Engineer"` |
| `description` | string | Detailed job description | `"We are seeking a talented..."` |
| `companyName` | string | Name of the hiring company | `"Tech Innovations Ltd"` |
| `location` | string | Job location | `"New York, NY"` |
| `seniorityLevel` | string | Required experience level | `"Junior"`, `"Mid"`, `"Senior"`, `"Super Senior"` |
| `workArrangement` | string? | Work arrangement (optional) | `"Remote"`, `"On-site"`, `"Hybrid"` |
| `salaryRangeMin` | number | Minimum salary (annual) | `85000` |
| `salaryRangeMax` | number | Maximum salary (annual) | `120000` |
| `mustHaveSkills` | string[] | Required skills/technologies | `["Python", "AWS", "Docker"]` |
| `candidatesRequested` | number | Number of candidates needed | `3` |

#### User/Client Information
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `userId` | string | ID of user who posted the job | `"user-abc-123"` |
| `userEmail` | string | Email of the job poster | `"hiring@company.com"` |
| `userName` | string | Name of the job poster | `"Sarah Johnson"` |

#### Metadata
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `createdAt` | string | When job was created (ISO 8601) | `"2024-01-15T14:30:00.000Z"` |
| `status` | string | Job status (always "Unclaimed" for new jobs) | `"Unclaimed"` |
| `webhookTimestamp` | string | When webhook was sent (ISO 8601) | `"2024-01-15T14:30:01.234Z"` |

## Response Handling

### Success Response
Your webhook endpoint should return a **2xx status code** (200, 201, 204, etc.) to indicate successful receipt.

### Error Handling
- **Automatic Retries:** Failed webhooks are retried up to 3 times with exponential backoff
- **Timeouts:** Each attempt times out after 10 seconds
- **Non-blocking:** Webhook failures do not prevent job creation
- **Logging:** All webhook attempts are logged for debugging

### Retry Schedule
- **Attempt 1:** Immediate
- **Attempt 2:** After 1 second delay
- **Attempt 3:** After 2 second delay
- **Attempt 4:** After 4 second delay (max)

## Example Webhook Handler

### Node.js/Express
```javascript
app.post('/job-posted', express.json(), (req, res) => {
  const jobData = req.body;
  
  console.log('New job posted:', {
    jobId: jobData.jobId,
    title: jobData.title,
    company: jobData.companyName,
    userEmail: jobData.userEmail
  });
  
  // Process the job data (send notifications, update CRM, etc.)
  processNewJob(jobData);
  
  // Return success
  res.status(200).json({ received: true });
});
```

### Python/Flask
```python
@app.route('/job-posted', methods=['POST'])
def handle_job_posted():
    job_data = request.json
    
    print(f"New job posted: {job_data['title']} at {job_data['companyName']}")
    
    # Process the job data
    process_new_job(job_data)
    
    return {"received": True}, 200
```

### Webhook Validation
```javascript
// Example validation function
function validateJobWebhook(payload) {
  const required = ['jobId', 'title', 'userEmail', 'createdAt'];
  const missing = required.filter(field => !payload[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  // Validate timestamp is recent (within last hour)
  const timestamp = new Date(payload.webhookTimestamp);
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  if (timestamp < hourAgo) {
    throw new Error('Webhook timestamp too old');
  }
  
  return true;
}
```

## Security Considerations

### Important Notes
1. **Public Endpoint:** The webhook URL will be called from the browser (client-side)
2. **No Authentication:** Currently no authentication headers are sent
3. **Validate Data:** Always validate incoming webhook data
4. **Rate Limiting:** Consider implementing rate limiting on your endpoint

### Recommended Security Measures
1. **HTTPS Only:** Use HTTPS URLs for webhook endpoints
2. **Input Validation:** Validate all incoming data
3. **Idempotency:** Handle duplicate webhooks gracefully using `jobId`
4. **Rate Limiting:** Protect against abuse
5. **Monitoring:** Log and monitor webhook traffic

## Troubleshooting

### Common Issues

#### Webhook Not Firing
- Check if `VITE_JOB_WEBHOOK_URL` is set correctly
- Verify the URL is accessible from the internet
- Check browser console for webhook-related errors

#### Webhook Failing
- Ensure your endpoint returns 2xx status codes
- Check endpoint logs for errors
- Verify the endpoint can handle JSON payloads
- Test with a tool like ngrok for local development

#### Debugging
Enable console logging to see webhook attempts:
```javascript
// This will show in browser console
console.log('Webhook attempt:', webhookUrl, payload);
```

### Testing

#### Test Webhook with curl
```bash
curl -X POST https://your-webhook-endpoint.com/job-posted \
  -H "Content-Type: application/json" \
  -H "User-Agent: ShortlistApp/1.0" \
  -d '{
    "jobId": "test-job-123",
    "title": "Test Job",
    "companyName": "Test Company",
    "userEmail": "test@example.com",
    "webhookTimestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'"
  }'
```

#### Local Development with ngrok
```bash
# Start your local server on port 3000
node server.js

# In another terminal, expose it with ngrok
ngrok http 3000

# Use the ngrok URL as your webhook URL
# Example: https://abc123.ngrok.io/job-posted
```

## Integration Examples

### Slack Notification
```javascript
async function sendSlackNotification(jobData) {
  const message = {
    text: `New Job Posted: ${jobData.title}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${jobData.title}* at *${jobData.companyName}*\n` +
                `Posted by: ${jobData.userName} (${jobData.userEmail})\n` +
                `Location: ${jobData.location}\n` +
                `Salary: $${jobData.salaryRangeMin.toLocaleString()} - $${jobData.salaryRangeMax.toLocaleString()}`
        }
      }
    ]
  };
  
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message)
  });
}
```

### CRM Integration
```javascript
async function updateCRM(jobData) {
  // Example: Add job to HubSpot, Salesforce, etc.
  const crmData = {
    deal_name: `${jobData.companyName} - ${jobData.title}`,
    contact_email: jobData.userEmail,
    deal_amount: jobData.salaryRangeMax,
    deal_stage: 'new_job_posted',
    custom_fields: {
      job_id: jobData.jobId,
      seniority_level: jobData.seniorityLevel,
      candidates_requested: jobData.candidatesRequested
    }
  };
  
  await fetch('https://api.hubapi.com/crm/v3/objects/deals', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.HUBSPOT_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(crmData)
  });
}
```
