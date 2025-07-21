import { UserProfile, Job, Candidate, Tier, UserUsageStats } from '../types';

export function getUserUsageStats(
  userProfile: UserProfile | null,
  jobs: Job[],
  candidates: Candidate[],
  tiers: Tier[]
): UserUsageStats | null {
  if (!userProfile) return null;

  // Find the user's tier
  const tier = tiers.find(t => t.id === userProfile.tierId);
  const jobsLimit = tier?.monthlyJobAllotment ?? 1;
  const candidatesLimit = tier?.monthlyCandidateAllotment ?? 20;
  const tierName = tier?.name ?? 'Free';

  // Jobs submitted by this user (optionally, in the current month)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const jobsUsed = jobs.filter(
    job => job.userId === userProfile.id && job.createdAt >= startOfMonth
  ).length;
  const jobsRemaining = Math.max(0, jobsLimit - jobsUsed);

  // Candidates submitted for this user's jobs (in the current month)
  const userJobIds = jobs
    .filter(job => job.userId === userProfile.id && job.createdAt >= startOfMonth)
    .map(job => job.id);
  const candidatesUsed = candidates.filter(
    c => userJobIds.includes(c.jobId)
  ).length;
  const candidatesRemaining = Math.max(0, candidatesLimit - candidatesUsed);

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