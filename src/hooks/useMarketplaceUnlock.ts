import { useAuth } from './useAuth';
import { useData } from '../context/DataContext';

export interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  unlockDay: number;
  sequenceIndex: number;
  icon: any;
  category: 'free' | 'starter' | 'enterprise';
}

export const useMarketplaceUnlock = () => {
  const { userProfile } = useAuth();
  const { jobs } = useData();

  const getDaysActive = (): number => {
    if (!userProfile?.createdAt) return 0;
    const now = new Date();
    const created = new Date(userProfile.createdAt);
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getUserPoints = (): number => {
    if (!userProfile?.id) return 0;

    // Points from jobs (10 points each)
    const jobCount = jobs.filter(j => j.userId === userProfile.id).length;
    const jobPoints = jobCount * 10;

    // Bonus points from account age (10 points per day)
    const dayBonus = getDaysActive() * 10;

    return jobPoints + dayBonus;
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
    const points = getUserPoints();
    const requiredPoints = item.sequenceIndex * 100;
    return points >= requiredPoints;
  };

  const getNextUnlockItem = (items: MarketplaceItem[]): MarketplaceItem | null => {
    const sortedItems = [...items].sort((a, b) => a.sequenceIndex - b.sequenceIndex);
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
