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
  const jobsLimit = tier?.monthlyJobAllotment ?? 1;
  const candidatesLimit = tier?.monthlyCandidateAllotment ?? 20;
  const tierName = tier?.name ?? 'Free';

  // Use the actual database values for remaining credits/jobs
  // These are updated immediately when credits are deducted
  const jobsRemaining = userProfile.jobsRemaining;
  const candidatesRemaining = userProfile.availableCredits;

  // Calculate used values for display purposes
  const jobsUsed = Math.max(0, jobsLimit - jobsRemaining);
  const candidatesUsed = Math.max(0, candidatesLimit - candidatesRemaining);

  // Credits reset date
  const creditsResetDate = userProfile.creditsResetDate ?? null;

  return {
    jobsUsed,
    jobsLimit,
    jobsRemaining,
    candidatesUsed,
    candidatesLimit,
    candidatesRemaining,
    creditsResetDate,
    tierName,
  };
} 