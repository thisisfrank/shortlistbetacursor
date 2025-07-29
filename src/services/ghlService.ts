import { Job, CreditTransaction } from '../types';
import { UserProfile } from '../hooks/useAuth';

interface GHLWebhookPayload {
  event: string;
  userId: string;
  userProfile: {
    id: string;
    email: string;
    name: string;
    role: 'client' | 'sourcer' | 'admin';
    tierId: string;
    availableCredits: number;
    jobsRemaining: number;
    creditsResetDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
  userJobs?: Job[];
  creditTransactions?: CreditTransaction[];
  userStats?: {
    totalJobsSubmitted: number;
    jobsUnclaimed: number;
    jobsClaimed: number;
    jobsCompleted: number;
    totalCreditsUsed: number;
    totalCreditsEarned: number;
    averageJobValue: number;
    preferredWorkArrangement: string;
    preferredLocation: string;
    averageSalaryRange: {
      min: number;
      max: number;
    };
  };
  activityTimeline?: Array<{
    date: string;
    action: string;
    details: string;
  }>;
  exportTimestamp: string;
  source: string;
  metadata?: {
    exportType: string;
    includesJobs: boolean;
    includesTransactions: boolean;
    includesStats: boolean;
    includesTimeline: boolean;
  };
}

class GHLService {
  private webhookUrl: string;

  constructor() {
    // You can set this via environment variable or config
    this.webhookUrl = 'https://services.leadconnectorhq.com/hooks/QekUNBmcxjsxAKXluQc0/webhook-trigger/da3ce6bc-b439-4b02-bcfa-3599c9464e71';
  }

  /**
   * Send user data to Go High Level webhook
   */
  async sendUserData(
    userProfile: UserProfile,
    jobs?: Job[],
    transactions?: CreditTransaction[],
    event: string = 'user_data_export'
  ): Promise<boolean> {
    try {
      const payload: GHLWebhookPayload = {
        event,
        userId: userProfile.id,
        userProfile: {
          id: userProfile.id,
          email: userProfile.email,
          name: userProfile.name,
          role: userProfile.role,
          tierId: userProfile.tierId,
          availableCredits: userProfile.availableCredits,
          jobsRemaining: userProfile.jobsRemaining,
          creditsResetDate: userProfile.creditsResetDate,
          createdAt: userProfile.createdAt,
          updatedAt: userProfile.updatedAt
        },
        userJobs: jobs || [],
        creditTransactions: transactions || [],
        exportTimestamp: new Date().toISOString(),
        source: 'app-integration'
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error('GHL webhook failed:', response.status, response.statusText);
        return false;
      }

      console.log('✅ User data sent to GHL webhook successfully');
      return true;
    } catch (error) {
      console.error('❌ Error sending data to GHL webhook:', error);
      return false;
    }
  }

  /**
   * Send job status update to GHL webhook
   */
  async sendJobStatusUpdate(
    job: Job,
    userProfile: UserProfile,
    status: 'submitted' | 'claimed' | 'completed' | 'overdue'
  ): Promise<boolean> {
    try {
      const payload = {
        event: `job_${status}`,
        userId: userProfile.id,
        userProfile: {
          id: userProfile.id,
          email: userProfile.email,
          name: userProfile.name,
          role: userProfile.role,
          tierId: userProfile.tierId,
          availableCredits: userProfile.availableCredits,
          jobsRemaining: userProfile.jobsRemaining,
          creditsResetDate: userProfile.creditsResetDate,
          createdAt: userProfile.createdAt,
          updatedAt: userProfile.updatedAt
        },
        job: {
          id: job.id,
          title: job.title,
          companyName: job.companyName,
          status: job.status,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt
        },
        status,
        timestamp: new Date().toISOString(),
        source: 'app-integration'
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error('GHL webhook failed:', response.status, response.statusText);
        return false;
      }

      console.log(`✅ Job ${status} notification sent to GHL webhook`);
      return true;
    } catch (error) {
      console.error('❌ Error sending job status to GHL webhook:', error);
      return false;
    }
  }

  /**
   * Send credit transaction to GHL webhook
   */
  async sendCreditTransaction(
    transaction: CreditTransaction,
    userProfile: UserProfile
  ): Promise<boolean> {
    try {
      const payload = {
        event: 'credit_transaction',
        userId: userProfile.id,
        userProfile: {
          id: userProfile.id,
          email: userProfile.email,
          name: userProfile.name,
          role: userProfile.role,
          tierId: userProfile.tierId,
          availableCredits: userProfile.availableCredits,
          jobsRemaining: userProfile.jobsRemaining,
          creditsResetDate: userProfile.creditsResetDate,
          createdAt: userProfile.createdAt,
          updatedAt: userProfile.updatedAt
        },
        transaction: {
          id: transaction.id,
          transactionType: transaction.transactionType,
          amount: transaction.amount,
          description: transaction.description,
          jobId: transaction.jobId,
          createdAt: transaction.createdAt
        },
        timestamp: new Date().toISOString(),
        source: 'app-integration'
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error('GHL webhook failed:', response.status, response.statusText);
        return false;
      }

      console.log('✅ Credit transaction sent to GHL webhook');
      return true;
    } catch (error) {
      console.error('❌ Error sending credit transaction to GHL webhook:', error);
      return false;
    }
  }

  /**
   * Send user activity to GHL webhook
   */
  async sendUserActivity(
    userProfile: UserProfile,
    activity: string,
    details: string
  ): Promise<boolean> {
    try {
      const payload = {
        event: 'user_activity',
        userId: userProfile.id,
        userProfile: {
          id: userProfile.id,
          email: userProfile.email,
          name: userProfile.name,
          role: userProfile.role,
          tierId: userProfile.tierId,
          availableCredits: userProfile.availableCredits,
          jobsRemaining: userProfile.jobsRemaining,
          creditsResetDate: userProfile.creditsResetDate,
          createdAt: userProfile.createdAt,
          updatedAt: userProfile.updatedAt
        },
        activity,
        details,
        timestamp: new Date().toISOString(),
        source: 'app-integration'
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error('GHL webhook failed:', response.status, response.statusText);
        return false;
      }

      console.log('✅ User activity sent to GHL webhook');
      return true;
    } catch (error) {
      console.error('❌ Error sending user activity to GHL webhook:', error);
      return false;
    }
  }
}

export const ghlService = new GHLService();
export default ghlService; 