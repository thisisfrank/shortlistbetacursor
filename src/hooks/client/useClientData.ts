import { useData } from '../../context/DataContext';
import { useAuth } from '../useAuth';
import { Client, Job, Candidate } from '../../types';

export const useClientData = () => {
  const { user, userProfile } = useAuth();
  const dataContext = useData();

  // Only allow client access
  if (!userProfile || userProfile.role !== 'client') {
    throw new Error('Unauthorized: Client access required');
  }

  // Get current client based on authenticated user
  const getCurrentClient = (): Client | null => {
    if (!user) return null;
    return dataContext.clients.find(client => client.email === user.email) || null;
  };

  const currentClient = getCurrentClient();

  // Client-specific data access (filtered)
  const getMyJobs = (): Job[] => {
    if (!currentClient) return [];
    return dataContext.jobs.filter(job => job.clientId === currentClient.id);
  };

  const getMyCandidates = (): Candidate[] => {
    if (!currentClient) return [];
    return dataContext.getCandidatesByClient(currentClient.id);
  };

  const getMyJobById = (jobId: string): Job | null => {
    const job = dataContext.getJobById(jobId);
    if (!job || !currentClient || job.clientId !== currentClient.id) {
      return null; // Don't allow access to other clients' jobs
    }
    return job;
  };

  const getMyCandidatesByJob = (jobId: string): Candidate[] => {
    const job = getMyJobById(jobId);
    if (!job) return [];
    return dataContext.getCandidatesByJob(jobId);
  };

  // Client-specific computed data
  const getClientStats = () => {
    if (!currentClient) return null;
    
    const myJobs = getMyJobs();
    const myCandidates = getMyCandidates();
    
    return {
      totalJobs: myJobs.length,
      totalCandidates: myCandidates.length,
      completedJobs: myJobs.filter(job => job.status === 'Completed').length,
      pendingJobs: myJobs.filter(job => job.status !== 'Completed').length,
      availableCredits: currentClient.availableCredits,
      jobsRemaining: currentClient.jobsRemaining,
      creditsResetDate: currentClient.creditsResetDate,
      tier: dataContext.getTierById(currentClient.tierId),
    };
  };

  // Client-specific actions (with permission checks)
  const submitJob = (jobData: Omit<Job, 'id' | 'status' | 'sourcerName' | 'completionLink' | 'createdAt' | 'updatedAt' | 'clientId'>) => {
    if (!currentClient) {
      throw new Error('No client profile found');
    }

    if (currentClient.jobsRemaining <= 0) {
      throw new Error('No job submissions remaining for this billing period');
    }

    return dataContext.addJob({
      ...jobData,
      clientId: currentClient.id
    });
  };

  const canSubmitJob = (): boolean => {
    return currentClient ? currentClient.jobsRemaining > 0 : false;
  };

  const canRequestCandidates = (count: number): boolean => {
    return currentClient ? currentClient.availableCredits >= count : false;
  };

  // Subscription helpers
  const needsUpgrade = (): boolean => {
    if (!currentClient) return false;
    return currentClient.availableCredits <= 0 || currentClient.jobsRemaining <= 0;
  };

  return {
    // Client profile
    currentClient,
    
    // Filtered data access
    myJobs: getMyJobs(),
    myCandidates: getMyCandidates(),
    getMyJobById,
    getMyCandidatesByJob,
    
    // Stats and computed data
    clientStats: getClientStats(),
    
    // Actions (permission-checked)
    submitJob,
    canSubmitJob,
    canRequestCandidates,
    needsUpgrade,
    
    // Utility functions
    checkDuplicateEmail: dataContext.checkDuplicateEmail,
    getTierById: dataContext.getTierById,
    
    // Read-only access to tiers for subscription info
    tiers: dataContext.tiers,
  };
};