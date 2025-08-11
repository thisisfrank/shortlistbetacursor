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
  const candidatesLimit = tier?.monthlyCandidateAllotment ?? 20;
  const tierName = tier?.name ?? 'Free';

  // Jobs submitted by this user (for display purposes only - no limits)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const jobsUsed = jobs.filter(
    job => job.userId === userProfile.id && job.createdAt >= startOfMonth
  ).length;

  // Calculate candidate credits used from credit transactions (in the current month)
  const candidateTransactions = creditTransactions.filter(
    ct => ct.userId === userProfile.id && 
          ct.transactionType === 'deduction' &&
          ct.description.includes('candidate') &&
          ct.createdAt >= startOfMonth
  );
  
  // Sum up all candidate credit deductions (amounts are negative, so we negate them)
  const candidatesUsed = candidateTransactions.reduce((total, ct) => total + Math.abs(ct.amount), 0);
  const candidatesRemaining = Math.max(0, candidatesLimit - candidatesUsed);

  // Calculate credits reset date (start of next month)
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const creditsResetDate = nextMonth;

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