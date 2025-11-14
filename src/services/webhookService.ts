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
   * Now uses secure Supabase proxy to hide webhook URL
   */
  async sendJobPostedWebhook(
    jobData: any,
    userData: { id: string; email: string; name: string },
    webhookUrl?: string
  ): Promise<{ success: boolean; error?: string }> {
    // Get Supabase configuration
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Supabase configuration missing');
      return { success: false, error: 'Supabase not configured' };
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

    // Call secure proxy instead of direct webhook
    return this.sendWebhookViaProxy(
      `${supabaseUrl}/functions/v1/job-webhook-proxy`,
      supabaseAnonKey,
      payload
    );
  }

  /**
   * Sends a webhook when client requests more candidates
   * Now uses secure Supabase proxy to hide webhook URL
   */
  async sendRequestMoreCandidatesWebhook(
    jobData: any,
    userData: { id: string; email: string; name: string },
    additionalCandidates: number,
    searchInstructions: string,
    webhookUrl?: string
  ): Promise<{ success: boolean; error?: string }> {
    // Get Supabase configuration
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Supabase configuration missing');
      return { success: false, error: 'Supabase not configured' };
    }

    const payload = {
      jobId: jobData.id,
      title: jobData.title,
      companyName: jobData.companyName,
      previousCandidatesRequested: jobData.candidatesRequested - additionalCandidates,
      additionalCandidatesRequested: additionalCandidates,
      newTotalCandidatesRequested: jobData.candidatesRequested,
      searchInstructions: searchInstructions || undefined,
      userId: userData.id,
      userEmail: userData.email,
      userName: userData.name,
      requestTimestamp: new Date().toISOString(),
    };

    // Call secure proxy instead of direct webhook
    return this.sendWebhookViaProxy(
      `${supabaseUrl}/functions/v1/request-more-candidates-proxy`,
      supabaseAnonKey,
      payload
    );
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
   * Sends webhook via secure Supabase proxy
   */
  private async sendWebhookViaProxy(
    proxyUrl: string,
    anonKey: string,
    payload: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📞 Sending webhook via secure proxy: ${proxyUrl}`);
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log(`✅ Webhook sent successfully via proxy`);
        return { success: true };
      } else {
        throw new Error(data.error || 'Webhook proxy failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Webhook proxy failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
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
