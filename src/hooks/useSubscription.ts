import { useAuth } from './useAuth';
import { getTierByUuid } from '../config/tiers.config';

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

  // Get subscription plan based on user's tier (using centralized config)
  const getSubscriptionPlan = () => {
    if (!userProfile?.tierId) return null;
    return getTierByUuid(userProfile.tierId);
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