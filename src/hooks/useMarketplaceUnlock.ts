import { useAuth } from './useAuth';

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

  const getDaysActive = (): number => {
    if (!userProfile?.createdAt) return 0;
    const now = new Date();
    const created = new Date(userProfile.createdAt);
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getUnlockedItemsCount = (): number => {
    const daysActive = getDaysActive();
    return Math.floor(daysActive / 5) + 1; // +1 for immediate unlock (AI Generator)
  };

  const getDaysUntilNextUnlock = (): number => {
    const daysActive = getDaysActive();
    const nextUnlockDay = (Math.floor(daysActive / 5) + 1) * 5;
    return Math.max(0, nextUnlockDay - daysActive);
  };

  const isItemUnlocked = (item: MarketplaceItem): boolean => {
    const unlockedCount = getUnlockedItemsCount();
    return item.sequenceIndex < unlockedCount;
  };

  const getNextUnlockItem = (items: MarketplaceItem[]): MarketplaceItem | null => {
    const unlockedCount = getUnlockedItemsCount();
    return items.find(item => item.sequenceIndex === unlockedCount) || null;
  };

  // Keep for backward compatibility with AI Generator
  const isAIGeneratorUnlocked = (): boolean => {
    return getUnlockedItemsCount() > 0;
  };

  const isDataLoading = (): boolean => {
    return !userProfile;
  };

  return {
    getDaysActive,
    getUnlockedItemsCount,
    getDaysUntilNextUnlock,
    isItemUnlocked,
    getNextUnlockItem,
    isAIGeneratorUnlocked,
    isDataLoading,
  };
};
