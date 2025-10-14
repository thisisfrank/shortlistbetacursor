import { useAuth } from './useAuth';
import { getProductByPriceId } from '../stripe-config';

// Simplified subscription interface based on user profile data
export interface UserSubscription {
  subscription_status: string;
  stripe_customer_id: string | null;
  subscription_period_end: Date | null;
}

export const useSubscription = () => {
  const { userProfile } = useAuth();

  // Create a subscription object from user profile data
  const subscription: UserSubscription | null = userProfile ? {
    subscription_status: userProfile.subscriptionStatus || 'free',
    stripe_customer_id: userProfile.stripeCustomerId || null,
    subscription_period_end: userProfile.subscriptionPeriodEnd || null
  } : null;

  // Get subscription plan based on user's tier (simpler approach)
  const getSubscriptionPlan = () => {
    if (!userProfile?.tierId) return null;
    
    // Map tier IDs to subscription plans
    const tierToPlanMapping: Record<string, string> = {
      '5841d1d6-20d7-4360-96f8-0444305fac5b': '', // Free tier - no plan
      '88c433cf-0a8d-44de-82fa-71c7dcbe31ff': 'price_1SALD5Hb6LdHADWYbyDzUv7a', // Average Recruiter - 100 credits
      'd8b7d6ae-8a44-49c9-9dc3-1c6b1838815fd': 'price_1SALDYHb6LdHADWYwZ8almdN', // Super Recruiter - 400 credits
      'f871eb1b-6756-447d-a1c0-20a373d1d5a2': 'price_1SALDtHb6LdHADWYY5NBNKj5l'  // Beast Mode - 2500 credits
    };
    
    const priceId = tierToPlanMapping[userProfile.tierId];
    return priceId ? getProductByPriceId(priceId) : null;
  };

  const isActive = () => {
    return subscription?.subscription_status === 'active' || subscription?.subscription_status === 'trialing';
  };

  const isPastDue = () => {
    return subscription?.subscription_status === 'past_due';
  };

  const isCanceled = () => {
    return subscription?.subscription_status === 'canceled';
  };

  return {
    subscription,
    loading: false, // No async loading needed - data comes from auth context
    error: null,    // No separate error state needed
    getSubscriptionPlan,
    isActive,
    isPastDue,
    isCanceled,
  };
};