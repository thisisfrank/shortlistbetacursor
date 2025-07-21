import { useData } from '../../context/DataContext';
import { useAuth } from '../useAuth';
import { Job, Candidate } from '../../types';

export const useSourcerData = () => {
  const { userProfile } = useAuth();
  const dataContext = useData();

  // Only allow sourcer access
  if (!userProfile || userProfile.role !== 'sourcer') {
    throw new Error('Unauthorized: Sourcer access required');
  }

  // Get sourcer name from localStorage or profile
  const getSourcerName = (): string => {
    return localStorage.getItem('sourcerName') || userProfile.email?.split('@')[0] || 'Unknown Sourcer';
  };

  // Sourcer-specific data access
  const getAvailableJobs = (): Job[] => {
    return dataContext.jobs.filter(job => job.status === 'Unclaimed');
  };

  const getMyClaimedJobs = (): Job[] => {
    const sourcerName = getSourcerName();
    return dataContext.jobs.filter(job => 
      job.status === 'Claimed' && job.sourcerName === sourcerName
    );
  };

  const getMyCompletedJobs = (): Job[] => {
    const sourcerName = getSourcerName();
    return dataContext.jobs.filter(job => 
      job.status === 'Completed' && job.sourcerName === sourcerName
    );
  };

  const getAllJobsForSourcing = (): Job[] => {
    // Sourcers can see all jobs for context, but can only act on unclaimed ones
    return dataContext.jobs;
  };

  const canClaimJob = (jobId: string): boolean => {
    const job = dataContext.getJobById(jobId);
    return job ? job.status === 'Unclaimed' : false;
  };

  const canCompleteJob = (jobId: string): boolean => {
    const job = dataContext.getJobById(jobId);
    const sourcerName = getSourcerName();
    return job ? (job.status === 'Claimed' && job.sourcerName === sourcerName) : false;
  };

  // Sourcer-specific computed data
  const getSourcerStats = () => {
    const sourcerName = getSourcerName();
    const allJobs = dataContext.jobs;
    
    return {
      availableJobs: getAvailableJobs().length,
      myClaimedJobs: getMyClaimedJobs().length,
      myCompletedJobs: getMyCompletedJobs().length,
      totalEarnings: getMyCompletedJobs().length * 50, // Assuming $50 per completed job
      successRate: getMyCompletedJobs().length > 0 
        ? Math.round((getMyCompletedJobs().length / (getMyClaimedJobs().length + getMyCompletedJobs().length)) * 100)
        : 0,
      sourcerName,
    };
  };

  // Sourcer-specific actions (with permission checks)
  const claimJob = (jobId: string, sourcerName: string) => {
    if (!canClaimJob(jobId)) {
      throw new Error('Cannot claim this job - it may already be claimed or completed');
    }

    // Store sourcer name for future use
    localStorage.setItem('sourcerName', sourcerName);
    
    return dataContext.updateJob(jobId, {
      status: 'Claimed',
      sourcerName: sourcerName
    });
  };

  const completeJob = (jobId: string) => {
    if (!canCompleteJob(jobId)) {
      throw new Error('Cannot complete this job - you may not have claimed it or it may already be completed');
    }

    return dataContext.updateJob(jobId, {
      status: 'Completed',
      completionLink: 'Candidates submitted via structured form'
    });
  };

  const submitCandidates = async (jobId: string, linkedinUrls: string[]) => {
    if (!canCompleteJob(jobId)) {
      throw new Error('Cannot submit candidates for this job');
    }

    // Use the existing LinkedIn scraping functionality
    const result = await dataContext.addCandidatesFromLinkedIn(jobId, linkedinUrls);
    
    if (result.success) {
      // Mark job as completed after successful candidate submission
      completeJob(jobId);
    }
    
    return result;
  };

  // Job filtering helpers
  const filterJobsByStatus = (status: Job['status']): Job[] => {
    return getAllJobsForSourcing().filter(job => job.status === status);
  };

  const searchJobs = (query: string): Job[] => {
    const searchLower = query.toLowerCase();
    return getAllJobsForSourcing().filter(job => {
      return (
        job.title.toLowerCase().includes(searchLower) ||
        job.description.toLowerCase().includes(searchLower) ||
        job.location.toLowerCase().includes(searchLower) ||
        (job.companyName && job.companyName.toLowerCase().includes(searchLower))
      );
    });
  };

  return {
    // Sourcer identity
    sourcerName: getSourcerName(),
    
    // Filtered data access
    availableJobs: getAvailableJobs(),
    myClaimedJobs: getMyClaimedJobs(),
    myCompletedJobs: getMyCompletedJobs(),
    allJobs: getAllJobsForSourcing(),
    
    // Permission checks
    canClaimJob,
    canCompleteJob,
    
    // Stats and computed data
    sourcerStats: getSourcerStats(),
    
    // Actions (permission-checked)
    claimJob,
    completeJob,
    submitCandidates,
    
    // Utility functions
    filterJobsByStatus,
    searchJobs,
    
    // Read-only access to shared data
    getJobById: dataContext.getJobById,
    getCandidatesByJob: dataContext.getCandidatesByJob,
  };
};