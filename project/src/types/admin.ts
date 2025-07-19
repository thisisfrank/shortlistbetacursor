export interface AdminStats {
  totalClients: number;
  totalJobs: number;
  totalCandidates: number;
  unclaimedJobs: number;
  claimedJobs: number;
  completedJobs: number;
  activeSourcers: number;
}

export interface SourcerPerformance {
  sourcerName: string;
  completedJobs: number;
}

export interface AdminActions {
  forceCompleteJob: (jobId: string) => void;
  bulkDeleteJobs: (jobIds: string[]) => void;
  bulkDeleteClients: (clientIds: string[]) => void;
  resetAllData: () => void;
}

export interface AdminDataAccess {
  getSystemStats: () => AdminStats;
  getJobsByDateRange: (startDate: Date, endDate: Date) => any[];
  getTopPerformingSourcers: () => [string, number][];
}