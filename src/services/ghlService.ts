import { Job, UserProfile } from '../types';
// GHL Service for webhook integration - routes all webhooks through Supabase Edge Function proxy to avoid CORS

interface GHLSignupPayload {
  event: 'user_signup';
  userData: {
    id: string;
    email: string;
    name: string;
    role: 'client' | 'sourcer' | 'admin';
    tierId: string;
    createdAt: Date;
    updatedAt: Date;
    availableCredits: number;
    creditsResetDate: Date | null;
  };
  signupSource?: string;
  message?: string;
}

// Webhook types that map to the proxy's GHL_WEBHOOKS object
type WebhookType = 'signup_thank_you' | 'job_submission' | 'job_completion' | 'plan_purchase' | 'feedback';

class GHLService {
  private proxyUrl: string;

  constructor() {
    // Use Supabase Edge Function proxy to avoid CORS issues
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    this.proxyUrl = supabaseUrl ? `${supabaseUrl}/functions/v1/ghl-webhook-proxy` : '';
  }

  /**
   * Send webhook through Supabase Edge Function proxy
   */
  private async sendViaProxy(webhookType: WebhookType, payload: any): Promise<void> {
    if (!this.proxyUrl) {
      console.warn(`⚠️ GHL proxy not configured (no SUPABASE_URL), skipping ${webhookType} webhook`);
      return;
    }

    try {
      console.log(`📞 Sending GHL ${webhookType} webhook via proxy...`);
      
      const response = await fetch(this.proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
        },
        body: JSON.stringify({ webhookType, payload }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Proxy returned ${response.status}`);
      }

      console.log(`✅ GHL ${webhookType} webhook sent successfully via proxy`);
    } catch (error) {
      console.error(`❌ Error sending GHL ${webhookType} webhook:`, error);
      // Don't throw - webhooks should never break the main flow
    }
  }

  async sendSignupThankYouNotification(userProfile: UserProfile, signupSource?: string): Promise<void> {
    const payload: GHLSignupPayload = {
      event: 'user_signup',
      userData: {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role,
        tierId: userProfile.tierId,
        createdAt: userProfile.createdAt,
        updatedAt: userProfile.updatedAt,
        availableCredits: userProfile.availableCredits || 0,
        creditsResetDate: userProfile.creditsResetDate || null,
      },
      signupSource,
      message: `New ${userProfile.role} signup: ${userProfile.name} (${userProfile.email})`,
    };

    await this.sendViaProxy('signup_thank_you', payload);
  }

  async sendJobSubmissionConfirmation(job: Job, userProfile: UserProfile): Promise<void> {
    const payload = {
      event: 'job_submission_confirmation',
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
      jobData: {
        id: job.id,
        title: job.title,
        companyName: job.companyName,
        location: job.location,
        seniorityLevel: job.seniorityLevel,
        workArrangement: job.workArrangement,
        salaryRangeMin: job.salaryRangeMin,
        salaryRangeMax: job.salaryRangeMax,
        mustHaveSkills: job.mustHaveSkills,
        status: job.status,
        candidatesRequested: job.candidatesRequested,
        createdAt: job.createdAt,
      },
      message: `Job submitted: ${job.title} at ${job.companyName}`,
    };

    await this.sendViaProxy('job_submission', payload);
  }

  async sendJobCompletionNotification(job: Job, userProfile: UserProfile, candidates: any[]): Promise<void> {
    // Get the app URL for the direct link to candidates
    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    // Job-specific link with jobId parameter
    const candidatesPageLink = `${appUrl}/candidates?jobId=${job.id}`;

    const payload = {
      event: 'job_completion_notification',
      userEmail: userProfile.email,
      userName: userProfile.name,
      jobTitle: job.title,
      companyName: job.companyName,
      totalCandidates: candidates.length,
      viewCandidatesLink: candidatesPageLink,
      message: `Your ${candidates.length} candidates are ready for ${job.title} at ${job.companyName}!`,
    };

    await this.sendViaProxy('job_completion', payload);
  }

  async sendPlanPurchaseWelcome(
    userEmail: string, 
    userName: string, 
    tierName: string, 
    creditsGranted: number,
    tierId: string
  ): Promise<void> {
    const payload = {
      event: 'plan_purchase_welcome',
      userEmail: userEmail,
      userName: userName,
      planDetails: {
        tierName: tierName,
        tierId: tierId,
        creditsGranted: creditsGranted,
      },
      clayReferralLink: 'https://clay.com?via=bae546',
      clayReferralBonus: 3000,
      welcomeMessage: `Welcome to ${tierName}! You now have ${creditsGranted} candidate credits available.`,
      timestamp: new Date().toISOString(),
    };

    await this.sendViaProxy('plan_purchase', payload);
  }

  async sendFeedbackSubmission(
    feedbackData: {
      feedback: string;
      user: {
        id?: string;
        email?: string;
        name?: string;
        role?: string;
      };
      context?: {
        feedbackType?: string;
        page?: string;
        currentContext?: string;
        jobId?: string;
        jobTitle?: string;
        companyName?: string;
        candidateCount?: number;
      };
    }
  ): Promise<void> {
    const payload = {
      event: 'feedback_submission',
      userEmail: feedbackData.user.email || 'unknown@example.com',
      userName: feedbackData.user.name || 'Unknown User',
      userId: feedbackData.user.id,
      userRole: feedbackData.user.role || 'client',
      feedbackDetails: {
        feedback: feedbackData.feedback,
        feedbackType: feedbackData.context?.feedbackType || 'general',
        page: feedbackData.context?.page || 'unknown',
        context: feedbackData.context?.currentContext || '',
      },
      jobContext: feedbackData.context?.jobId ? {
        jobId: feedbackData.context.jobId,
        jobTitle: feedbackData.context.jobTitle,
        companyName: feedbackData.context.companyName,
        candidateCount: feedbackData.context.candidateCount,
      } : null,
      timestamp: new Date().toISOString(),
    };

    await this.sendViaProxy('feedback', payload);
  }

  async sendTestNotification(): Promise<void> {
    const testUserProfile: UserProfile = {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'client',
      tierId: '5841d1d6-20d7-4360-96f8-0444305fac5b',
      availableCredits: 50,
      creditsResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('🧪 Sending test signup webhook via proxy...');
    await this.sendSignupThankYouNotification(testUserProfile, 'test_webhook');
  }
}

export const ghlService = new GHLService();

// Make test functions available globally for easy testing
if (typeof window !== 'undefined') {
  (window as any).testGHLWebhook = () => {
    console.log('🧪 Testing GoHighLevel webhook via proxy...');
    ghlService.sendTestNotification();
  };
  
  (window as any).testJobSubmissionWebhook = () => {
    console.log('🧪 Testing Job Submission Confirmation webhook via proxy...');
    const testJob = {
      id: 'test-job-id',
      userId: 'test-user-id',
      userEmail: 'test@example.com',
      companyName: 'Test Company',
      title: 'Test Software Engineer',
      description: 'This is a test job description',
      seniorityLevel: 'Mid' as const,
      workArrangement: 'Remote' as const,
      location: 'Remote',
      salaryRangeMin: 80000,
      salaryRangeMax: 120000,
      mustHaveSkills: ['React', 'TypeScript'],
      status: 'Unclaimed' as const,
      sourcerId: null,
      completionLink: null,
      candidatesRequested: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const testUserProfile = {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'client' as const,
      tierId: '5841d1d6-20d7-4360-96f8-0444305fac5b',
      availableCredits: 50,
      creditsResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    ghlService.sendJobSubmissionConfirmation(testJob, testUserProfile);
  };

  (window as any).testJobCompletionWebhook = (customEmail?: string) => {
    const targetEmail = customEmail || 'test@example.com';
    console.log('🧪 Testing Job Completion Notification webhook via proxy...');
    console.log(`📧 Sending to: ${targetEmail}`);
    
    const testJob = {
      id: 'test-job-12345',
      userId: 'test-user-id',
      userEmail: targetEmail,
      companyName: 'Acme Tech Solutions',
      title: 'Senior Full Stack Developer',
      description: 'This is a test job description',
      seniorityLevel: 'Senior' as const,
      workArrangement: 'Remote' as const,
      location: 'San Francisco, CA',
      salaryRangeMin: 120000,
      salaryRangeMax: 160000,
      mustHaveSkills: ['React', 'Node.js', 'TypeScript'],
      status: 'Completed' as const,
      sourcerId: 'test-sourcer-id',
      completionLink: 'Candidates submitted via structured form',
      candidatesRequested: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const testUserProfile = {
      id: 'test-user-id',
      email: targetEmail,
      name: 'John Smith',
      role: 'client' as const,
      tierId: '5841d1d6-20d7-4360-96f8-0444305fac5b',
      availableCredits: 50,
      creditsResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const testCandidates = [
      { id: 'candidate-1', firstName: 'Sarah', lastName: 'Johnson' },
      { id: 'candidate-2', firstName: 'Michael', lastName: 'Chen' },
      { id: 'candidate-3', firstName: 'Emily', lastName: 'Rodriguez' },
      { id: 'candidate-4', firstName: 'David', lastName: 'Kim' },
      { id: 'candidate-5', firstName: 'Lisa', lastName: 'Anderson' },
    ];
    
    console.log('📦 Payload includes:');
    console.log('  - User Name:', testUserProfile.name);
    console.log('  - Job Title:', testJob.title);
    console.log('  - Total Candidates:', testCandidates.length);
    console.log('  - Company:', testJob.companyName);
    
    ghlService.sendJobCompletionNotification(testJob, testUserProfile, testCandidates);
  };

  (window as any).testPlanPurchaseWelcome = () => {
    console.log('🧪 Testing Plan Purchase Welcome webhook via proxy...');
    
    ghlService.sendPlanPurchaseWelcome(
      'test@example.com',          // userEmail
      'Test User',                  // userName
      'Beast Mode',                 // tierName
      400,                          // creditsGranted
      'f871eb1b-6756-447d-a1c0-20a373d1d5a2'  // tierId
    );
  };

  (window as any).testFeedbackSubmission = () => {
    console.log('🧪 Testing Feedback Submission webhook via proxy...');
    
    const testFeedbackData = {
      feedback: 'This is a test feedback! The app is working great and the candidates are high quality.',
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'client'
      },
      context: {
        feedbackType: 'general',
        page: '/candidates',
        currentContext: 'header',
        jobId: 'test-job-id',
        jobTitle: 'Senior Software Engineer',
        companyName: 'Test Company Inc',
        candidateCount: 12
      }
    };
    
    ghlService.sendFeedbackSubmission(testFeedbackData);
  };

  (window as any).debugGHLProxy = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    console.log('🔍 Debugging GHL Proxy Configuration:');
    console.log('VITE_SUPABASE_URL:', supabaseUrl);
    console.log('Proxy URL:', supabaseUrl ? `${supabaseUrl}/functions/v1/ghl-webhook-proxy` : 'NOT CONFIGURED');
  };
}
