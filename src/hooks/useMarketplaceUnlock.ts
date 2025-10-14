import { useAuth } from './useAuth';
import { useData } from '../context/DataContext';

export interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  requiredLevel: number;
  icon: any;
  category: 'free' | 'starter' | 'enterprise';
}

export const useMarketplaceUnlock = () => {
  const { userProfile } = useAuth();
  const { jobs, isItemUnlockedInDB } = useData();

  const getDaysActive = (): number => {
    if (!userProfile?.createdAt) return 0;
    const now = new Date();
    const created = new Date(userProfile.createdAt);
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getUserPoints = (): number => {
    if (!userProfile?.id) return 0;

    // Signup bonus (10 points for joining)
    const signupBonus = 10;

    // Points from jobs (50 points each)
    const jobCount = jobs.filter(j => j.userId === userProfile.id).length;
    const jobPoints = jobCount * 50;

    // Bonus points from account age (10 points per day)
    const dayBonus = getDaysActive() * 10;

    return signupBonus + jobPoints + dayBonus;
  };

  const getUnlockedItemsCount = (): number => {
    const points = getUserPoints();
    return Math.floor(points / 100) + 1; // +1 for immediate unlock (AI Generator at 0 points)
  };

  const getPointsUntilNextUnlock = (): number => {
    const points = getUserPoints();
    const nextUnlockPoints = (Math.floor(points / 100) + 1) * 100;
    return Math.max(0, nextUnlockPoints - points);
  };

  const isItemUnlocked = (item: MarketplaceItem): boolean => {
    // Check if already unlocked in database
    if (isItemUnlockedInDB(item.id)) {
      return true;
    }
    
    // Otherwise check if user has enough points to unlock
    const points = getUserPoints();
    return points >= item.requiredLevel;
  };

  const getNextUnlockItem = (items: MarketplaceItem[]): MarketplaceItem | null => {
    const sortedItems = [...items].sort((a, b) => a.requiredLevel - b.requiredLevel);
    return sortedItems.find(item => !isItemUnlocked(item)) || null;
  };

  // Keep for backward compatibility with AI Generator
  const isAIGeneratorUnlocked = (): boolean => {
    return getUserPoints() >= 0; // AI Generator always unlocked
  };

  const isDataLoading = (): boolean => {
    return !userProfile;
  };

  return {
    getDaysActive,
    getUserPoints,
    getUnlockedItemsCount,
    getPointsUntilNextUnlock,
    isItemUnlocked,
    getNextUnlockItem,
    isAIGeneratorUnlocked,
    isDataLoading,
  };
};
