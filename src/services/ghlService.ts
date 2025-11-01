import { Job, UserProfile } from '../types';
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

class GHLService {
  private signupThankYouWebhookUrl: string;
  private jobSubmissionConfirmationWebhookUrl: string;
  private jobCompletionNotificationWebhookUrl: string;
  private planPurchaseWelcomeWebhookUrl: string;
  private feedbackSubmissionWebhookUrl: string;

  constructor() {
    // Hardcoded signup webhook URL - triggers when someone first signs up
    this.signupThankYouWebhookUrl = 'https://services.leadconnectorhq.com/hooks/QekUNBmcxjsxAKXluQc0/webhook-trigger/cecc5aea-aa4b-4c1a-9f45-4bff80833367';
    // Hardcoded job submission webhook URL - triggers when a job is submitted
    this.jobSubmissionConfirmationWebhookUrl = 'https://services.leadconnectorhq.com/hooks/QekUNBmcxjsxAKXluQc0/webhook-trigger/543083ea-d7ab-4ef5-8f87-dc35b3ed868b';
    // Hardcoded job completion webhook URL - triggers when a job is completed
    this.jobCompletionNotificationWebhookUrl = 'https://services.leadconnectorhq.com/hooks/QekUNBmcxjsxAKXluQc0/webhook-trigger/2c183ff3-08a7-4fcc-bc4d-aa0d55a9f636';
    // Hardcoded plan purchase welcome webhook URL - triggers when user purchases a plan
    this.planPurchaseWelcomeWebhookUrl = 'https://services.leadconnectorhq.com/hooks/QekUNBmcxjsxAKXluQc0/webhook-trigger/72bfee45-a750-4adb-b4d0-f492f641754c';
    // Hardcoded feedback submission webhook URL - triggers when user submits feedback
    this.feedbackSubmissionWebhookUrl = 'https://services.leadconnectorhq.com/hooks/QekUNBmcxjsxAKXluQc0/webhook-trigger/238d8a85-b4fc-4580-a379-102f69801702';
  }

  async sendSignupThankYouNotification(userProfile: UserProfile, signupSource?: string): Promise<void> {
    if (!this.signupThankYouWebhookUrl) {
      console.log('GHL Sign Up Thank You webhook URL not configured, skipping notification');
      return;
    }

    try {
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

      const response = await fetch(this.signupThankYouWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`GHL Sign Up Thank You webhook failed: ${response.status} ${response.statusText}`);
      }

      console.log('GHL Sign Up Thank You notification sent successfully');
    } catch (error) {
      console.error('Error sending GHL Sign Up Thank You notification:', error);
      // Don't throw error to avoid breaking the signup flow
    }
  }

  async sendJobSubmissionConfirmation(job: Job, userProfile: UserProfile): Promise<void> {
    if (!this.jobSubmissionConfirmationWebhookUrl) {
      console.log('GHL Job Submission Confirmation webhook URL not configured, skipping notification');
      return;
    }

    try {
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

      const response = await fetch(this.jobSubmissionConfirmationWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`GHL Job Submission Confirmation webhook failed: ${response.status} ${response.statusText}`);
      }

      console.log('GHL Job Submission Confirmation sent successfully');
    } catch (error) {
      console.error('Error sending GHL Job Submission Confirmation:', error);
      // Don't throw error to avoid breaking the job submission flow
    }
  }

  async sendJobCompletionNotification(job: Job, userProfile: UserProfile, candidates: any[]): Promise<void> {
    if (!this.jobCompletionNotificationWebhookUrl) {
      console.log('GHL Job Completion Notification webhook URL not configured, skipping notification');
      return;
    }

    try {
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

      const response = await fetch(this.jobCompletionNotificationWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`GHL Job Completion Notification webhook failed: ${response.status} ${response.statusText}`);
      }

      console.log('GHL Job Completion Notification sent successfully');
    } catch (error) {
      console.error('Error sending GHL Job Completion Notification:', error);
      // Don't throw error to avoid breaking the job completion flow
    }
  }

  async sendPlanPurchaseWelcome(
    userEmail: string, 
    userName: string, 
    tierName: string, 
    creditsGranted: number,
    tierId: string
  ): Promise<void> {
    if (!this.planPurchaseWelcomeWebhookUrl) {
      console.log('GHL Plan Purchase Welcome webhook URL not configured, skipping notification');
      return;
    }

    try {
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

      const response = await fetch(this.planPurchaseWelcomeWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`GHL Plan Purchase Welcome webhook failed: ${response.status} ${response.statusText}`);
      }

      console.log('✅ GHL Plan Purchase Welcome notification sent successfully');
    } catch (error) {
      console.error('❌ Error sending GHL Plan Purchase Welcome notification:', error);
      // Don't throw error to avoid breaking the purchase flow
    }
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
    if (!this.feedbackSubmissionWebhookUrl) {
      console.log('GHL Feedback Submission webhook URL not configured, skipping notification');
      return;
    }

    try {
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

      const response = await fetch(this.feedbackSubmissionWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`GHL Feedback Submission webhook failed: ${response.status} ${response.statusText}`);
      }

      console.log('✅ GHL Feedback Submission notification sent successfully');
    } catch (error) {
      console.error('❌ Error sending GHL Feedback Submission notification:', error);
      // Don't throw error to avoid breaking the feedback flow
    }
  }

  async sendTestNotification(): Promise<void> {
    if (!this.signupThankYouWebhookUrl) {
      console.log('GHL webhook URL not configured, skipping test notification');
      return;
    }

    try {
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

      const payload: GHLSignupPayload = {
        event: 'user_signup',
        userData: {
          id: testUserProfile.id,
          email: testUserProfile.email,
          name: testUserProfile.name,
          role: testUserProfile.role,
          tierId: testUserProfile.tierId,
          createdAt: testUserProfile.createdAt,
          updatedAt: testUserProfile.updatedAt,
          availableCredits: testUserProfile.availableCredits || 0,

          creditsResetDate: testUserProfile.creditsResetDate || null,
        },
        signupSource: 'test_webhook',
        message: 'TEST: New client signup: Test User (test@example.com)',
      };

      console.log('🧪 Sending test webhook payload:', payload);

      const response = await fetch(this.signupThankYouWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`GHL webhook failed: ${response.status} ${response.statusText}`);
      }

      console.log('✅ Test webhook sent successfully!');
      console.log('📊 Response status:', response.status);
      console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    } catch (error) {
      console.error('❌ Error sending test webhook:', error);
    }
  }
}

export const ghlService = new GHLService();

// Make test function available globally for easy testing
if (typeof window !== 'undefined') {
  (window as any).testGHLWebhook = () => {
    console.log('🧪 Testing GoHighLevel webhook...');
    ghlService.sendTestNotification();
  };
  
  (window as any).testJobSubmissionWebhook = () => {
    console.log('🧪 Testing Job Submission Confirmation webhook...');
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
      availableCredits: 20,

      creditsResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    ghlService.sendJobSubmissionConfirmation(testJob, testUserProfile);
  };

  (window as any).testJobCompletionWebhook = () => {
    console.log('🧪 Testing Job Completion Notification webhook...');
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
      status: 'Completed' as const,
      sourcerId: 'test-sourcer-id',
      completionLink: 'Test completion link',
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
      availableCredits: 20,

      creditsResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const testCandidates = [
      {
        id: 'candidate-1',
        jobId: 'test-job-id',
        firstName: 'John',
        lastName: 'Doe',
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        headline: 'Senior Software Engineer',
        location: 'San Francisco, CA',
        experience: [
          {
            title: 'Senior Software Engineer',
            company: 'Tech Corp',
            duration: '2 years'
          }
        ],
        education: [
          {
            school: 'Stanford University',
            degree: 'Computer Science'
          }
        ],
        skills: ['React', 'TypeScript', 'Node.js'],
        summary: 'Experienced software engineer...',
        submittedAt: new Date(),
      },
      {
        id: 'candidate-2',
        jobId: 'test-job-id',
        firstName: 'Jane',
        lastName: 'Smith',
        linkedinUrl: 'https://linkedin.com/in/janesmith',
        headline: 'Full Stack Developer',
        location: 'New York, NY',
        experience: [
          {
            title: 'Full Stack Developer',
            company: 'Startup Inc',
            duration: '3 years'
          }
        ],
        education: [
          {
            school: 'MIT',
            degree: 'Computer Science'
          }
        ],
        skills: ['React', 'TypeScript', 'Python'],
        summary: 'Passionate developer...',
        submittedAt: new Date(),
      }
    ];
    
    ghlService.sendJobCompletionNotification(testJob, testUserProfile, testCandidates);
  };

  (window as any).testPlanPurchaseWelcome = () => {
    console.log('🧪 Testing Plan Purchase Welcome webhook...');
    
    ghlService.sendPlanPurchaseWelcome(
      'test@example.com',          // userEmail
      'Test User',                  // userName
      'Beast Mode',                 // tierName
      400,                          // creditsGranted
      'f871eb1b-6756-447d-a1c0-20a373d1d5a2'  // tierId
    );
  };

  (window as any).testFeedbackSubmission = () => {
    console.log('🧪 Testing Feedback Submission webhook...');
    
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

  (window as any).debugGHLEnvVars = () => {
    console.log('🔍 Debugging GHL Environment Variables:');
    console.log('VITE_SIGNUP_THANK_YOU_URL:', import.meta.env.VITE_SIGNUP_THANK_YOU_URL);
    console.log('VITE_GHL_JOB_SUBMISSION_CONFIRMATION_WEBHOOK_URL:', import.meta.env.VITE_GHL_JOB_SUBMISSION_CONFIRMATION_WEBHOOK_URL);
    console.log('VITE_GHL_JOB_COMPLETION_NOTIFICATION_WEBHOOK_URL:', import.meta.env.VITE_GHL_JOB_COMPLETION_NOTIFICATION_WEBHOOK_URL);
  };
} 