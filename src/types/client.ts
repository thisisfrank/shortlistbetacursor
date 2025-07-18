import { Client, Job, Candidate, Tier } from './index';

export interface ClientStats {
  totalJobs: number;
  totalCandidates: number;
  completedJobs: number;
  pendingJobs: number;
  availableCredits: number;
  jobsRemaining: number;
  creditsResetDate: Date;
  tier: Tier | null;
}

export interface ClientActions {
  submitJob: (jobData: Omit<Job, 'id' | 'status' | 'sourcerName' | 'completionLink' | 'createdAt' | 'updatedAt' | 'clientId'>) => Job;
  canSubmitJob: () => boolean;
  canRequestCandidates: (count: number) => boolean;
  needsUpgrade: () => boolean;
}

export interface ClientDataAccess {
  currentClient: Client | null;
  myJobs: Job[];
  myCandidates: Candidate[];
  getMyJobById: (jobId: string) => Job | null;
  getMyCandidatesByJob: (jobId: string) => Candidate[];
  clientStats: ClientStats | null;
}