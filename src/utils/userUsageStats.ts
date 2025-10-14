import { UserProfile, Job, Candidate, Tier, UserUsageStats, CreditTransaction } from '../types';

export function getUserUsageStats(
  userProfile: UserProfile | null,
  jobs: Job[],
  candidates: Candidate[],
  tiers: Tier[],
  creditTransactions: CreditTransaction[] = []
): UserUsageStats | null {
  if (!userProfile) return null;

  // Find the user's tier
  const tier = tiers.find(t => t.id === userProfile.tierId);
  const tierName = tier?.name ?? 'Free';
  const FREE_TIER_ID = '5841d1d6-20d7-4360-96f8-0444305fac5b';
  const isFreeTier = userProfile.tierId === FREE_TIER_ID;

  // Jobs submitted by this user (for display purposes only - no limits)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Calculate job statistics
  const userJobs = jobs.filter(job => job.userId === userProfile.id);
  const jobsUsed = userJobs.filter(job => job.createdAt >= startOfMonth).length;
  const totalJobs = userJobs.length;
  const jobsThisMonth = jobsUsed;
  
  // Calculate candidate statistics
  const userCandidates = candidates.filter(candidate => {
    const candidateJob = jobs.find(job => job.id === candidate.jobId);
    return candidateJob && candidateJob.userId === userProfile.id;
  });
  const totalCandidatesSourced = userCandidates.length;
  const candidatesSourcedThisMonth = userCandidates.filter(
    candidate => candidate.submittedAt >= startOfMonth
  ).length;

  // For FREE TIER: Use actual available credits (one-time allocation)
  // For PAID TIERS: Use monthly allotment system with transaction tracking
  let candidatesUsed: number;
  let candidatesLimit: number;
  let candidatesRemaining: number;
  let creditsResetDate: Date | null;

  if (isFreeTier) {
    // Free tier: One-time credits, no monthly reset
    candidatesLimit = 20; // One-time allocation
    candidatesRemaining = userProfile.availableCredits || 0;
    candidatesUsed = candidatesLimit - candidatesRemaining;
    creditsResetDate = null; // No reset for free tier
    
    console.log('📊 [FREE TIER] Credit calculation:', {
      userId: userProfile.id,
      email: userProfile.email,
      candidatesLimit,
      availableCreditsFromDB: userProfile.availableCredits,
      candidatesRemaining,
      candidatesUsed
    });
  } else {
    // Paid tiers: Use available_credits as source of truth
    candidatesLimit = tier?.monthlyCandidateAllotment ?? 20;
    
    // Use available_credits from database as the remaining credits
    // This field is updated when candidates are submitted and reset by Stripe webhook
    candidatesRemaining = userProfile.availableCredits || 0;
    candidatesUsed = Math.max(0, candidatesLimit - candidatesRemaining);
    
    // Also calculate from transactions for comparison/debugging
    const candidateTransactions = creditTransactions.filter(
      ct => ct.userId === userProfile.id && 
            ct.transactionType === 'deduction' &&
            ct.description.includes('candidate') &&
            ct.createdAt >= startOfMonth
    );
    const transactionBasedUsed = candidateTransactions.reduce((total, ct) => total + Math.abs(ct.amount), 0);

    console.log('📊 [PAID TIER] Credit calculation:', {
      userId: userProfile.id,
      email: userProfile.email,
      tierName: tier?.name,
      candidatesLimit,
      availableCreditsFromDB: userProfile.availableCredits,
      candidatesRemaining,
      candidatesUsed,
      transactionCount: candidateTransactions.length,
      transactionBasedUsed,
      mismatch: transactionBasedUsed !== candidatesUsed,
      transactions: candidateTransactions.map(ct => ({
        amount: ct.amount,
        description: ct.description,
        date: ct.createdAt
      }))
    });

    // Use the actual subscription period end from Stripe (if available), otherwise calculate next month
    if (userProfile.subscriptionPeriodEnd) {
      creditsResetDate = new Date(userProfile.subscriptionPeriodEnd);
    } else {
      // Fallback to calculating start of next month if subscription period end not set
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      creditsResetDate = nextMonth;
    }
  }

  return {
    jobsUsed,
    jobsLimit: 0, // No longer used - unlimited jobs
    jobsRemaining: 0, // No longer used - unlimited jobs
    candidatesUsed,
    candidatesLimit,
    candidatesRemaining,
    creditsResetDate,
    tierName,
    // New fields for account page display
    totalCandidatesSourced,
    candidatesSourcedThisMonth,
    totalJobs,
    jobsThisMonth,
  };
} 