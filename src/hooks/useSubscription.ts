import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { getProductByPriceId } from '../stripe-config';

export interface UserSubscription {
  customer_id: string;
  subscription_id: string | null;
  subscription_status: 'not_started' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused';
  price_id: string | null;
  current_period_start: number | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentFetchRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setSubscription(null);
      setLoading(false);
      setError(null);
      currentFetchRef.current = null;
      return;
    }

    const fetchSubscription = async () => {
      const fetchId = user.id + '-' + Date.now();
      currentFetchRef.current = fetchId;
      
      try {
        setLoading(true);
        setError(null);
        
        console.log('🎫 Fetching subscription for user:', user.id);

        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Subscription fetch timeout')), 10000);
        });
        
        const fetchPromise = supabase
          .from('stripe_user_subscriptions')
          .select('*')
          .eq('customer_id', user.id)
          .maybeSingle();

        const { data, error: fetchError } = await Promise.race([fetchPromise, timeoutPromise]) as any;

        // Check if this fetch is still current (not superseded by a newer one)
        if (currentFetchRef.current !== fetchId) {
          console.log('🎫 Fetch superseded, ignoring result');
          return;
        }

        if (fetchError) {
          console.error('❌ Error fetching subscription:', fetchError);
          // Don't set error for missing subscription - user might not have one
          setSubscription(null);
        } else {
          console.log('✅ Subscription fetched:', data ? 'found' : 'none');
          setSubscription(data);
        }
      } catch (err) {
        // Check if this fetch is still current
        if (currentFetchRef.current !== fetchId) {
          console.log('🎫 Fetch superseded during error, ignoring');
          return;
        }
        
        console.error('💥 Subscription fetch error:', err);
        setSubscription(null);
        if (err instanceof Error && err.message.includes('timeout')) {
          setError('Unable to load subscription status. Please refresh the page.');
        }
      } finally {
        // Only update loading if this is still the current fetch
        if (currentFetchRef.current === fetchId) {
          setLoading(false);
        }
      }
    };

    fetchSubscription();
  }, [user?.id]); // Use user?.id instead of user to avoid unnecessary re-renders

  const getSubscriptionPlan = () => {
    if (!subscription?.price_id) return null;
    return getProductByPriceId(subscription.price_id);
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
    loading,
    error,
    getSubscriptionPlan,
    isActive,
    isPastDue,
    isCanceled,
  };
};