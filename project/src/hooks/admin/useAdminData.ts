import { useData } from '../../context/DataContext';
import { useAuth } from '../useAuth';

export const useAdminData = () => {
  const { userProfile } = useAuth();
  const dataContext = useData();

  // Only allow admin access
  if (!userProfile || userProfile.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }

  return {
    // Full access to all data for admins
    ...dataContext,
    
    // Admin-specific computed data
    getSystemStats: () => {
      const { jobs, clients, candidates } = dataContext;
      return {
        totalClients: clients.length,
        totalJobs: jobs.length,
        totalCandidates: candidates.length,
        unclaimedJobs: jobs.filter(job => job.status === 'Unclaimed').length,
        claimedJobs: jobs.filter(job => job.status === 'Claimed').length,
        completedJobs: jobs.filter(job => job.status === 'Completed').length,
        activeSourcers: [...new Set(jobs.filter(job => job.sourcerName).map(job => job.sourcerName))].length,
      };
    },

    // Admin-specific actions
    forceCompleteJob: (jobId: string) => {
      return dataContext.updateJob(jobId, { 
        status: 'Completed',
        completionLink: 'Admin override - marked as completed'
      });
    },

    bulkDeleteJobs: (jobIds: string[]) => {
      jobIds.forEach(id => dataContext.deleteJob(id));
    },

    bulkDeleteClients: (clientIds: string[]) => {
      clientIds.forEach(id => dataContext.deleteClient(id));
    },

    // System management
    resetAllData: () => {
      if (window.confirm('Are you sure you want to reset ALL system data? This cannot be undone.')) {
        dataContext.resetData();
      }
    },

    // Analytics helpers
    getJobsByDateRange: (startDate: Date, endDate: Date) => {
      return dataContext.jobs.filter(job => {
        const jobDate = new Date(job.createdAt);
        return jobDate >= startDate && jobDate <= endDate;
      });
    },

    getTopPerformingSourcers: () => {
      const sourcerStats = dataContext.jobs
        .filter(job => job.sourcerName && job.status === 'Completed')
        .reduce((acc, job) => {
          const sourcer = job.sourcerName!;
          acc[sourcer] = (acc[sourcer] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      return Object.entries(sourcerStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);
    }
  };
};