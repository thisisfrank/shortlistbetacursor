import { useAuth } from './useAuth';
import { useData } from '../context/DataContext';

export const useMarketplaceUnlock = () => {
  const { user, userProfile } = useAuth();
  const { jobs, loading } = useData();

  const hasSubmittedFirstJob = (): boolean => {
    if (!user || !userProfile) return false;
    
    // Only apply this logic to client users
    if (userProfile.role !== 'client') return true;
    
    // Check if client has submitted at least one job
    const userJobs = jobs.filter(job => job.userId === user.id);
    return userJobs.length > 0;
  };

  const isAIGeneratorUnlocked = (): boolean => {
    return hasSubmittedFirstJob();
  };

  // Use DataContext loading state directly
  const isDataLoading = (): boolean => {
    return loading || !userProfile;
  };

  return {
    hasSubmittedFirstJob,
    isAIGeneratorUnlocked,
    isDataLoading,
  };
};
