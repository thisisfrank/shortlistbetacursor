import { supabase } from '../lib/supabase';
import { formatJobDescription } from '../services/jobDescriptionService';

interface JobToFormat {
  id: string;
  title: string;
  description: string;
  company_name?: string;
  seniority_level?: string;
}

/**
 * Formats all existing job descriptions in the database
 * This can be run once to apply formatting retroactively
 */
export const formatAllJobDescriptions = async (): Promise<{
  success: number;
  failed: number;
  errors: Array<{ jobId: string; error: string }>;
}> => {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as Array<{ jobId: string; error: string }>
  };

  try {
    // Fetch all jobs from the database
    const { data: jobs, error: fetchError } = await supabase
      .from('jobs')
      .select('id, title, description, company_name, seniority_level')
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw new Error(`Failed to fetch jobs: ${fetchError.message}`);
    }

    if (!jobs || jobs.length === 0) {
      console.log('No jobs found to format');
      return results;
    }

    console.log(`📋 Found ${jobs.length} jobs to format`);

    // Process each job
    for (const job of jobs as JobToFormat[]) {
      try {
        console.log(`🔄 Formatting job ${job.id}: ${job.title}`);

        // Format the job description
        const formattedDescription = await formatJobDescription({
          description: job.description,
          title: job.title,
          companyName: job.company_name,
          seniorityLevel: job.seniority_level
        });

        // Update the job in the database
        const { error: updateError } = await supabase
          .from('jobs')
          .update({ description: formattedDescription })
          .eq('id', job.id);

        if (updateError) {
          throw new Error(`Update failed: ${updateError.message}`);
        }

        console.log(`✅ Successfully formatted job ${job.id}`);
        results.success++;

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Failed to format job ${job.id}:`, errorMessage);
        results.failed++;
        results.errors.push({
          jobId: job.id,
          error: errorMessage
        });
      }
    }

    console.log('\n📊 Formatting complete:');
    console.log(`  ✅ Success: ${results.success}`);
    console.log(`  ❌ Failed: ${results.failed}`);

    return results;

  } catch (error) {
    console.error('❌ Fatal error in formatAllJobDescriptions:', error);
    throw error;
  }
};

/**
 * Formats job descriptions for a specific user
 */
export const formatJobDescriptionsForUser = async (userId: string): Promise<{
  success: number;
  failed: number;
  errors: Array<{ jobId: string; error: string }>;
}> => {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as Array<{ jobId: string; error: string }>
  };

  try {
    const { data: jobs, error: fetchError } = await supabase
      .from('jobs')
      .select('id, title, description, company_name, seniority_level')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw new Error(`Failed to fetch jobs: ${fetchError.message}`);
    }

    if (!jobs || jobs.length === 0) {
      console.log('No jobs found for this user');
      return results;
    }

    console.log(`📋 Found ${jobs.length} jobs for user ${userId}`);

    for (const job of jobs as JobToFormat[]) {
      try {
        console.log(`🔄 Formatting job ${job.id}: ${job.title}`);

        const formattedDescription = await formatJobDescription({
          description: job.description,
          title: job.title,
          companyName: job.company_name,
          seniorityLevel: job.seniority_level
        });

        const { error: updateError } = await supabase
          .from('jobs')
          .update({ description: formattedDescription })
          .eq('id', job.id);

        if (updateError) {
          throw new Error(`Update failed: ${updateError.message}`);
        }

        console.log(`✅ Successfully formatted job ${job.id}`);
        results.success++;

        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Failed to format job ${job.id}:`, errorMessage);
        results.failed++;
        results.errors.push({
          jobId: job.id,
          error: errorMessage
        });
      }
    }

    console.log('\n📊 Formatting complete:');
    console.log(`  ✅ Success: ${results.success}`);
    console.log(`  ❌ Failed: ${results.failed}`);

    return results;

  } catch (error) {
    console.error('❌ Fatal error in formatJobDescriptionsForUser:', error);
    throw error;
  }
};

