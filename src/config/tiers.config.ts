// Single source of truth for all tier configuration
// When marketing names change, only update this file

export interface TierFeatures {
  credits: number;
  companyEmails: boolean;
  unlimited: boolean;
}

export interface TierConfig {
  tierId: string;
  displayName: string;
  price: number;
  credits: number;
  priceId: string | null;
  paymentLink: string | null;
  description: string;
  features: TierFeatures;
  popular?: boolean;
  icon?: 'Zap' | 'Star' | 'Crown' | 'Users';
  color?: string;
  buttonText?: string;
}

export type TierLevel = 'tier_1' | 'tier_2' | 'tier_3' | 'tier_4';

// Tier configuration - only place to update when marketing names change
export const TIER_CONFIG: Record<TierLevel, TierConfig> = {
  tier_1: {
    tierId: '5841d1d6-20d7-4360-96f8-0444305fac5b',
    displayName: 'Free',
    price: 0,
    credits: 50,
    priceId: null,
    paymentLink: null,
    description: 'Try it out',
    features: {
      credits: 50,
      companyEmails: false,
      unlimited: false
    },
    icon: 'Users',
    color: 'from-gray-500/20 to-gray-500/10 border-gray-500/30'
  },
  tier_2: {
    tierId: '88c433cf-0a8d-44de-82fa-71c7dcbe31ff',
    displayName: 'Average Recruiter',
    price: 29,
    credits: 100,
    priceId: 'price_1SPK3TQZ6mxDPDqbgiAc8b0d',
    paymentLink: 'https://buy.stripe.com/aFa6oJ5Y41OD3HHf372Ry07',
    description: 'Hiring for 1 position',
    features: {
      credits: 100,
      companyEmails: false,
      unlimited: false
    },
    popular: false,
    icon: 'Zap',
    color: 'from-green-500/20 to-green-500/10 border-green-500/30',
    buttonText: 'LEVEL UP'
  },
  tier_3: {
    tierId: 'd8b7d6ae-8a44-49c9-9dc3-1c6b183815fd',
    displayName: 'Super Recruiter',
    price: 99,
    credits: 400,
    priceId: 'price_1SPK4oQZ6mxDPDqbfIRqTsqJ',
    paymentLink: 'https://buy.stripe.com/3cI3cx86c1ODa65g7b2Ry08',
    description: 'Hiring for 2-4 positions',
    features: {
      credits: 400,
      companyEmails: true,
      unlimited: false
    },
    popular: true,
    icon: 'Star',
    color: 'from-blue-500/20 to-blue-500/10 border-blue-500/30',
    buttonText: 'LEVEL UP'
  },
  tier_4: {
    tierId: 'f871eb1b-6756-447d-a1c0-20a373d1d5a2',
    displayName: 'Beast Mode',
    price: 699,
    credits: 2500,
    priceId: 'price_1SPK4sQZ6mxDPDqblE0q1Q89',
    paymentLink: 'https://buy.stripe.com/8x200l0DKcth1zzdZ32Ry09',
    description: 'Hiring for 5+ positions',
    features: {
      credits: 2500,
      companyEmails: true,
      unlimited: true
    },
    popular: false,
    icon: 'Crown',
    color: 'from-supernova/20 to-supernova/10 border-supernova/30',
    buttonText: 'GO BEAST MODE'
  }
} as const;

// Stripe Billing Portal for managing subscriptions
export const STRIPE_BILLING_PORTAL = 'https://billing.stripe.com/p/login/test_fZu7sLaoK9lN1oRfap9R600';

// Common tier ID constants for easy reference
export const FREE_TIER_ID = '5841d1d6-20d7-4360-96f8-0444305fac5b';
export const STARTER_TIER_ID = '88c433cf-0a8d-44de-82fa-71c7dcbe31ff';
export const PRO_TIER_ID = 'd8b7d6ae-8a44-49c9-9dc3-1c6b183815fd';
export const ENTERPRISE_TIER_ID = 'f871eb1b-6756-447d-a1c0-20a373d1d5a2';

// Helper functions
export const getTierByUuid = (uuid: string): TierConfig | undefined => {
  return Object.values(TIER_CONFIG).find(tier => tier.tierId === uuid);
};

export const getTierLevel = (uuid: string): TierLevel | null => {
  const entry = Object.entries(TIER_CONFIG).find(([_, config]) => config.tierId === uuid);
  return entry ? entry[0] as TierLevel : null;
};

export const getSubscriptionTiers = (): TierConfig[] => {
  // Return only paid tiers for subscription page
  return [TIER_CONFIG.tier_2, TIER_CONFIG.tier_3, TIER_CONFIG.tier_4];
};

export const getAllTiers = (): TierConfig[] => {
  return Object.values(TIER_CONFIG);
};

// Tier hierarchy for upgrade/downgrade logic
export const TIER_HIERARCHY: Record<TierLevel, number> = {
  tier_1: 1,
  tier_2: 2,
  tier_3: 3,
  tier_4: 4
};

export const isUpgrade = (currentTierUuid: string, targetTierUuid: string): boolean => {
  const currentLevel = getTierLevel(currentTierUuid);
  const targetLevel = getTierLevel(targetTierUuid);
  
  if (!currentLevel || !targetLevel) return false;
  
  return TIER_HIERARCHY[targetLevel] > TIER_HIERARCHY[currentLevel];
};

export const isDowngrade = (currentTierUuid: string, targetTierUuid: string): boolean => {
  const currentLevel = getTierLevel(currentTierUuid);
  const targetLevel = getTierLevel(targetTierUuid);
  
  if (!currentLevel || !targetLevel) return false;
  
  return TIER_HIERARCHY[targetLevel] < TIER_HIERARCHY[currentLevel];
};

