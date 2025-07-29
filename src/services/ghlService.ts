import { Job } from '../types';
import { UserProfile } from '../hooks/useAuth';
// GHL Service for webhook integration

interface GHLWebhookPayload {
  event: string;
  userId: string;
  userProfile: {
    id: string;
    email: string;
    name: string;
    role: 'client' | 'sourcer' | 'admin';
    tierId: string;
    createdAt: Date;
    updatedAt: Date;
  };
  jobData?: Job;
  message?: string;
}

class GHLService {
  private webhookUrl: string;

  constructor() {
    this.webhookUrl = import.meta.env.VITE_GHL_WEBHOOK_URL || '';
  }

  async sendJobStatusUpdate(job: Job, userProfile: UserProfile, status: string): Promise<void> {
    if (!this.webhookUrl) {
      console.log('GHL webhook URL not configured, skipping notification');
      return;
    }

    try {
      const payload: GHLWebhookPayload = {
        event: 'job_status_update',
        userId: userProfile.id,
        userProfile: {
          id: userProfile.id,
          email: userProfile.email,
          name: userProfile.name,
          role: userProfile.role,
          tierId: userProfile.tierId,
          createdAt: userProfile.createdAt,
          updatedAt: userProfile.updatedAt,
        },
        jobData: job,
        message: `Job ${status}: ${job.title} at ${job.companyName}`,
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`GHL webhook failed: ${response.status} ${response.statusText}`);
      }

      console.log('GHL notification sent successfully:', status);
    } catch (error) {
      console.error('Error sending GHL notification:', error);
      // Don't throw error to avoid breaking the main job submission flow
    }
  }
}

export const ghlService = new GHLService(); 