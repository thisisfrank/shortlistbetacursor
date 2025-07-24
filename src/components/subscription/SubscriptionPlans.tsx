import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CheckCircle, Zap, Crown, Star, Mail, Users, Briefcase, X, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Updated subscription plans based on requirements
const subscriptionPlans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceId: null,
    description: 'Perfect for trying out our platform',
    features: {
      jobs: 1,
      credits: 20,
      companyEmails: false,
      unlimited: false
    },
    popular: false,
    color: 'from-guardian/20 to-guardian/10 border-guardian/30'
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 30,
    priceId: 'price_1Rl1MuFPYYAarocke0oZgczA', // Real Stripe price ID
    description: 'Perfect for getting started',
    features: {
      jobs: 3,
      credits: 200,
      companyEmails: false,
      unlimited: false
    },
    popular: false,
    color: 'from-green-500/20 to-green-500/10 border-green-500/30'
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 50,
    priceId: 'price_1Rl1N5FPYYAarock0dFT7x9Q', // Real Stripe price ID
    description: 'Advanced features for scaling businesses',
    features: {
      jobs: 3,
      credits: 150,
      companyEmails: true,
      unlimited: false
    },
    popular: true,
    color: 'from-blue-500/20 to-blue-500/10 border-blue-500/30'
  },
  {
    id: 'topshelf',
    name: 'Top Shelf',
    price: 120,
    priceId: 'price_1Rl1NJFPYYAarockbgLtNiKk', // Real Stripe price ID
    description: 'Unlimited access for enterprise teams',
    features: {
      jobs: 10,
      credits: 400,
      companyEmails: true,
      unlimited: true
    },
    popular: false,
    color: 'from-supernova/20 to-supernova/10 border-supernova/30'
  }
];

export const SubscriptionPlans: React.FC = () => {
  const { user } = useAuth();
  const { subscription, getSubscriptionPlan, isActive, loading: subscriptionLoading, error: subscriptionError } = useSubscription();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const currentPlan = getSubscriptionPlan();

  // Show error state inline instead of full screen loading
  const hasSubscriptionError = subscriptionError && !subscriptionLoading;

  const handleSubscribe = async (priceId: string) => {
    if (!priceId) {
      // Handle free tier - no Stripe checkout needed
      alert('You are already on the Free Tier. Choose a paid plan to upgrade.');
      return;
    }

    // Validate environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey
      });
      alert('Configuration error: Supabase connection not properly configured. Please check environment variables.');
      return;
    }

    // Get user session for authentication
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session) {
      console.error('No active session:', sessionError);
      alert('Please log in to upgrade your subscription.');
      return;
    }

    setLoadingPlan(priceId);

    try {
      // Call our stripe-checkout function instead of direct links
      const functionUrl = `${supabaseUrl}/functions/v1/stripe-checkout`;
      console.log('Calling Supabase Edge Function:', functionUrl);
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          price_id: priceId,
          mode: 'subscription',
          success_url: `${window.location.origin}/subscription/success`,
          cancel_url: `${window.location.origin}/subscription`,
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      const responseText = await response.text();
      console.log('Response text:', responseText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: `HTTP ${response.status}: ${responseText}` };
        }
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error('Invalid response format from server');
      }
      
      const { url } = data;
      
      if (url) {
        window.open(url, '_blank'); // Open Stripe checkout in new tab
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Subscription error details:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      let errorMessage = 'Failed to open checkout';
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Unable to connect to payment service. Please check your internet connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoadingPlan(null);
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'Top Shelf':
        return <Crown className="text-supernova" size={32} />;
      case 'Premium':
        return <Star className="text-blue-400" size={32} />;
      case 'Basic':
        return <Zap className="text-green-400" size={32} />;
      default:
        return <Users className="text-guardian" size={32} />;
    }
  };

  const isCurrentPlan = (priceId: string) => {
    if (!priceId) {
      // Free tier - check if user has no active subscription
      return !currentPlan || !isActive();
    }
    return currentPlan?.priceId === priceId && isActive();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-shadowforce via-shadowforce-light to-shadowforce">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <header className="mb-12 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <Crown size={60} className="text-supernova fill-current animate-pulse" />
              <div className="absolute inset-0 bg-supernova/30 blur-xl rounded-full"></div>
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-anton text-white-knight mb-4 uppercase tracking-wide">
            CANDIDATE CREDIT PLANS
          </h1>
          <p className="text-xl text-guardian font-jakarta max-w-xl mx-auto">
            Unlock more credits and features to scale your hiring.
          </p>
        </header>

        {/* Current Subscription Status */}
        {currentPlan ? (
          <div className="mb-12">
            <Card className="bg-gradient-to-r from-supernova/20 to-supernova/10 border-supernova/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="text-supernova mr-3" size={24} />
                    <div>
                      <h3 className="font-anton text-lg text-supernova uppercase tracking-wide">
                        Current Plan: {currentPlan.name}
                      </h3>
                      <p className="text-guardian font-jakarta">
                        Your subscription is active and ready to use
                      </p>
                    </div>
                  </div>
                  <Badge variant="success">ACTIVE</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : hasSubscriptionError ? (
          <div className="mb-12">
            <Card className="bg-gradient-to-r from-red-500/20 to-red-500/10 border-red-500/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="text-red-400 mr-3" size={24} />
                    <div>
                      <h3 className="font-anton text-lg text-red-400 uppercase tracking-wide">
                        Error Loading Subscription
                      </h3>
                      <p className="text-guardian font-jakarta">
                        {subscriptionError}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setRetryKey(prev => prev + 1);
                      window.location.reload();
                    }}
                  >
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* What You Get Section */}
        <div className="mb-12">
          <Card className="bg-gradient-to-r from-supernova/20 to-supernova/10 border-supernova/30">
            <CardContent className="p-8">
              <h3 className="text-2xl font-anton text-white-knight mb-6 text-center uppercase tracking-wide">
                What Candidate Credits Include
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-supernova/20 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-4">
                    <Users className="text-supernova" size={18} />
                  </div>
                  <h4 className="font-anton text-white-knight mb-2 uppercase text-lg">Full Profile Access</h4>
                  <p className="text-guardian font-jakarta text-sm">Complete name and LinkedIn URL for direct contact</p>
                </div>
                <div className="text-center">
                  <div className="bg-supernova/20 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="text-supernova" size={18} />
                  </div>
                  <h4 className="font-anton text-white-knight mb-2 uppercase text-lg">LinkedIn Info Card</h4>
                  <p className="text-guardian font-jakarta text-sm">Detailed experience, education, skills, and AI summary</p>
                </div>
                <div className="text-center">
                  <div className="bg-supernova/20 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-4">
                    <Mail className="text-supernova" size={18} />
                  </div>
                  <h4 className="font-anton text-white-knight mb-2 uppercase text-lg">Company Emails*</h4>
                  <p className="text-guardian font-jakarta text-sm">Professional email addresses for direct outreach</p>
                  <p className="text-supernova font-jakarta text-xs mt-1">*Paid tiers only</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {subscriptionPlans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br ${plan.color} flex flex-col h-full`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge variant="default" className="px-4 py-1">
                    MOST POPULAR
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  {getPlanIcon(plan.name)}
                </div>
                <h3 className="text-2xl font-anton text-white-knight uppercase tracking-wide mb-2">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  {plan.price === 0 ? (
                    <span className="text-4xl font-anton text-supernova">FREE</span>
                  ) : (
                    <>
                      <span className="text-4xl font-anton text-supernova">${plan.price}</span>
                      <span className="text-guardian font-jakarta">/month</span>
                    </>
                  )}
                </div>
                <p className="text-guardian font-jakarta text-sm">
                  {plan.id === 'free' && 'Try the platform free'}
                  {plan.id === 'basic' && 'For growing teams'}
                  {plan.id === 'premium' && 'For scaling businesses'}
                  {plan.id === 'topshelf' && 'Unlimited access for enterprise'}
                </p>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-4 mb-8 flex-1">
                  <div className="flex items-center mt-6">
                    <CheckCircle className="text-supernova mr-3 flex-shrink-0" size={16} />
                    <span className="text-white-knight font-jakarta text-sm">
                      {typeof plan.features.jobs === 'number' 
                        ? `${plan.features.jobs} job submission${plan.features.jobs !== 1 ? 's' : ''}/month`
                        : 'Unlimited job submissions'
                      }
                    </span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="text-supernova mr-3 flex-shrink-0" size={16} />
                    <span className="text-white-knight font-jakarta text-sm">
                      {plan.features.credits} candidate credits/month
                    </span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="text-supernova mr-3 flex-shrink-0" size={16} />
                    <span className="text-white-knight font-jakarta text-sm">
                      Full LinkedIn profile card
                    </span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="text-supernova mr-3 flex-shrink-0" size={16} />
                    <span className="text-white-knight font-jakarta text-sm">
                      AI candidate matching
                    </span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="text-supernova mr-3 flex-shrink-0" size={16} />
                    <span className="text-white-knight font-jakarta text-sm">
                      {plan.id === 'free' ? 'Community support' : 
                       plan.name === 'Basic' ? 'Email support' :
                       plan.name === 'Premium' ? 'Priority support' :
                       'Dedicated account manager'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    {plan.features.companyEmails ? (
                      <CheckCircle className="text-supernova mr-3 flex-shrink-0" size={16} />
                    ) : (
                      <X className="text-red-400 mr-3 flex-shrink-0" size={16} />
                    )}
                    <span className="text-white-knight font-jakarta text-sm">
                      Company email addresses
                    </span>
                  </div>
                </div>

                <div>
                  <Button
                  fullWidth
                  size="lg"
                  variant={isCurrentPlan(plan.priceId || '') ? 'outline' : 'primary'}
                  onClick={() => handleSubscribe(plan.priceId || '')}
                  disabled={isCurrentPlan(plan.priceId || '') || loadingPlan === (plan.priceId || '')}
                  isLoading={loadingPlan === (plan.priceId || '')}
                >
                  {isCurrentPlan(plan.priceId || '') ? 'CURRENT PLAN' : 'UPGRADE'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Billing Information */}
        <div className="mb-12">
          <div className="text-center">
            <h3 className="text-xl font-anton text-white-knight mb-4 uppercase tracking-wide">
              Flexible Billing
            </h3>
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center">
                <CheckCircle className="text-supernova mr-2" size={16} />
                <span className="text-guardian font-jakarta text-base">Cancel anytime</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="text-supernova mr-2" size={16} />
                <span className="text-guardian font-jakarta text-base">Monthly billing</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="text-supernova mr-2" size={16} />
                <span className="text-guardian font-jakarta text-base">Instant upgrades</span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-xl font-anton text-white-knight mb-4 uppercase tracking-wide">
                Questions About Plans?
              </h3>
              <p className="text-guardian font-jakarta mb-6">
                All paid plans include company email addresses and enhanced support. 
                Credits refresh monthly and unused credits don't roll over.
              </p>
              <Button variant="outline" size="md">
                CONTACT SALES
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};