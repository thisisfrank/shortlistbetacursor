import { useData } from '../../context/DataContext';
import { useAuth } from '../useAuth';
import { Job, Candidate } from '../../types';

export const useClientData = () => {
  const { user, userProfile } = useAuth();
  const dataContext = useData();

  // Only allow client access
  if (!userProfile || userProfile.role !== 'client') {
    throw new Error('Unauthorized: Client access required');
  }

  // Jobs submitted by this user
  const getMyJobs = (): Job[] => {
    if (!user) return [];
    return dataContext.jobs.filter(job => job.userId === user.id);
  };

  // Candidates for this user's jobs
  const getMyCandidates = (): Candidate[] => {
    const myJobs = getMyJobs();
    const myJobIds = myJobs.map(job => job.id);
    return dataContext.candidates.filter(candidate => myJobIds.includes(candidate.jobId));
  };

  const getMyJobById = (jobId: string): Job | null => {
    const job = dataContext.getJobById(jobId);
    if (!job || !user || job.userId !== user.id) {
      return null;
    }
    return job;
  };

  const getMyCandidatesByJob = (jobId: string): Candidate[] => {
    const job = getMyJobById(jobId);
    if (!job) return [];
    return dataContext.getCandidatesByJob(jobId);
  };

  // Stats for this user
  const getClientStats = () => {
    const myJobs = getMyJobs();
    const myCandidates = getMyCandidates();
    return {
      totalJobs: myJobs.length,
      totalCandidates: myCandidates.length,
      completedJobs: myJobs.filter(job => job.status === 'Completed').length,
      pendingJobs: myJobs.filter(job => job.status !== 'Completed').length,
      availableCredits: userProfile.availableCredits,
      jobsRemaining: userProfile.jobsRemaining,
      creditsResetDate: userProfile.creditsResetDate,
      tier: dataContext.getTierById(userProfile.tierId),
    };
  };

  // Actions
  const submitJob = (jobData: Omit<Job, 'id' | 'status' | 'sourcerId' | 'completionLink' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!userProfile || userProfile.jobsRemaining <= 0) {
      throw new Error('No job submissions remaining for this billing period');
    }
    return dataContext.addJob({
      ...jobData,
      userId: user?.id || '',
      userEmail: user?.email || '',
    });
  };

  const canSubmitJob = (): boolean => {
    return userProfile.jobsRemaining > 0;
  };

  const canRequestCandidates = (count: number): boolean => {
    return userProfile.availableCredits >= count;
  };

  const needsUpgrade = (): boolean => {
    return userProfile.availableCredits <= 0 || userProfile.jobsRemaining <= 0;
  };

  return {
    myJobs: getMyJobs(),
    myCandidates: getMyCandidates(),
    getMyJobById,
    getMyCandidatesByJob,
    clientStats: getClientStats(),
    submitJob,
    canSubmitJob,
    canRequestCandidates,
    needsUpgrade,
    checkDuplicateEmail: dataContext.checkDuplicateEmail,
    getTierById: dataContext.getTierById,
    tiers: dataContext.tiers,
  };
};