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
  const jobsUsed = jobs.filter(
    job => job.userId === userProfile.id && job.createdAt >= startOfMonth
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
  } else {
    // Paid tiers: Monthly allotment with transaction tracking
    candidatesLimit = tier?.monthlyCandidateAllotment ?? 20;
    
    // Calculate candidate credits used from credit transactions (in the current month)
    const candidateTransactions = creditTransactions.filter(
      ct => ct.userId === userProfile.id && 
            ct.transactionType === 'deduction' &&
            ct.description.includes('candidate') &&
            ct.createdAt >= startOfMonth
    );
    
    // Sum up all candidate credit deductions (amounts are negative, so we negate them)
    candidatesUsed = candidateTransactions.reduce((total, ct) => total + Math.abs(ct.amount), 0);
    candidatesRemaining = Math.max(0, candidatesLimit - candidatesUsed);

    // Calculate credits reset date (start of next month)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    creditsResetDate = nextMonth;
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
  };
} 