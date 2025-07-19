import { Job, Candidate } from './index';

export interface SourcerStats {
  availableJobs: number;
  myClaimedJobs: number;
  myCompletedJobs: number;
  totalEarnings: number;
  successRate: number;
  sourcerName: string;
}

export interface SourcerActions {
  claimJob: (jobId: string, sourcerName: string) => Job | null;
  completeJob: (jobId: string) => Job | null;
  submitCandidates: (jobId: string, linkedinUrls: string[]) => Promise<{ success: boolean; error?: string }>;
  canClaimJob: (jobId: string) => boolean;
  canCompleteJob: (jobId: string) => boolean;
}

export interface SourcerDataAccess {
  sourcerName: string;
  availableJobs: Job[];
  myClaimedJobs: Job[];
  myCompletedJobs: Job[];
  allJobs: Job[];
  sourcerStats: SourcerStats;
  filterJobsByStatus: (status: Job['status']) => Job[];
  searchJobs: (query: string) => Job[];
}