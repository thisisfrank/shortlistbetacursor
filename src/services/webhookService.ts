interface JobWebhookPayload {
  // Core job information
  jobId: string;
  title: string;
  description: string;
  companyName: string;
  location: string;
  seniorityLevel: string;
  workArrangement?: string;
  salaryRangeMin: number;
  salaryRangeMax: number;
  mustHaveSkills: string[];
  candidatesRequested: number;
  
  // User/client information
  userId: string;
  userEmail: string;
  userName: string;
  
  // Metadata
  createdAt: string; // ISO string
  status: string;
  webhookTimestamp: string; // ISO string
}

interface WebhookConfig {
  url: string;
  retries?: number;
  timeoutMs?: number;
}

class WebhookService {
  private readonly defaultConfig: Required<Omit<WebhookConfig, 'url'>> = {
    retries: 3,
    timeoutMs: 10000, // 10 seconds
  };

  /**
   * Sends a webhook notification when a new job is posted
   */
  async sendJobPostedWebhook(
    jobData: any,
    userData: { id: string; email: string; name: string },
    webhookUrl?: string
  ): Promise<{ success: boolean; error?: string }> {
    // Skip if no webhook URL is configured
    const url = webhookUrl || import.meta.env.VITE_JOB_WEBHOOK_URL || 'https://hook.us1.make.com/ymemot9h7rnfocccrl8nhedvjlw7mj1l';
    if (!url) {
      console.log('📞 No webhook URL configured, skipping job webhook');
      return { success: true };
    }

    const payload: JobWebhookPayload = {
      // Core job information
      jobId: jobData.id,
      title: jobData.title,
      description: jobData.description,
      companyName: jobData.companyName,
      location: jobData.location,
      seniorityLevel: jobData.seniorityLevel,
      workArrangement: jobData.workArrangement,
      salaryRangeMin: jobData.salaryRangeMin,
      salaryRangeMax: jobData.salaryRangeMax,
      mustHaveSkills: jobData.mustHaveSkills || [],
      candidatesRequested: jobData.candidatesRequested,
      
      // User/client information
      userId: userData.id,
      userEmail: userData.email,
      userName: userData.name,
      
      // Metadata
      createdAt: jobData.createdAt.toISOString(),
      status: jobData.status,
      webhookTimestamp: new Date().toISOString(),
    };

    return this.sendWebhookWithRetry(url, payload);
  }

  /**
   * Sends webhook with retry logic
   */
  private async sendWebhookWithRetry(
    url: string,
    payload: JobWebhookPayload,
    config?: Partial<WebhookConfig>
  ): Promise<{ success: boolean; error?: string }> {
    const { retries, timeoutMs } = { ...this.defaultConfig, ...config };

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`📞 Sending job webhook (attempt ${attempt}/${retries}) to ${url}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'ShortlistApp/1.0',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          console.log(`✅ Job webhook sent successfully (status: ${response.status})`);
          return { success: true };
        } else {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      } catch (error) {
        const isLastAttempt = attempt === retries;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        console.warn(`⚠️ Job webhook attempt ${attempt} failed: ${errorMessage}`);
        
        if (isLastAttempt) {
          console.error(`❌ Job webhook failed after ${retries} attempts: ${errorMessage}`);
          return { 
            success: false, 
            error: `Failed after ${retries} attempts: ${errorMessage}` 
          };
        }

        // Wait before retry (exponential backoff)
        const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    return { success: false, error: 'Unexpected error in retry logic' };
  }

  /**
   * Validates webhook URL format
   */
  isValidWebhookUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }
}

export const webhookService = new WebhookService();
export type { JobWebhookPayload };
