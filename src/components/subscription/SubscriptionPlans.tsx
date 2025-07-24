import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CheckCircle, Zap, Crown, Star, Mail, Users, Briefcase, X, AlertTriangle, RefreshCw } from 'lucide-react';
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
  const { userProfile } = useAuth();
  const { subscription, getSubscriptionPlan, isActive, loading: subscriptionLoading, error: subscriptionError } = useSubscription();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [refreshingProfile, setRefreshingProfile] = useState(false);
  const { refreshProfile } = useAuth();

  const currentPlan = getSubscriptionPlan();

  // Map tier IDs to plan IDs for accurate current plan detection
  const tierIdToPlanId: Record<string, string> = {
    '5841d1d6-20d7-4360-96f8-0444305fac5b': 'free',     // Free tier
    '88c433cf-0a8d-44de-82fa-71c7dcbe31ff': 'basic',    // Basic tier  
    'f871eb1b-6756-447d-a1c0-20a373d1d5a2': 'premium',  // Premium tier
    'd8b7d6ae-8a44-49c9-9dc3-1c6b183815fd': 'topshelf'  // Top Shelf tier
  };

  // Get current plan based on user's actual tier_id
  const getCurrentPlanFromTier = () => {
    if (!userProfile?.tierId) return null;
    const planId = tierIdToPlanId[userProfile.tierId];
    return subscriptionPlans.find(plan => plan.id === planId) || null;
  };

  const currentTierPlan = getCurrentPlanFromTier();

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

  const handleRefreshProfile = async () => {
    setRefreshingProfile(true);
    try {
      await refreshProfile();
      console.log('✅ Profile refreshed manually');
    } catch (error) {
      console.error('❌ Error refreshing profile:', error);
    } finally {
      setRefreshingProfile(false);
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

  const isCurrentPlan = (planId: string) => {
    // Use user's actual tier from database instead of Stripe subscription
    return currentTierPlan?.id === planId;
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
                  variant={isCurrentPlan(plan.id) ? 'outline' : 'primary'}
                  onClick={() => handleSubscribe(plan.priceId || '')}
                  disabled={isCurrentPlan(plan.id) || loadingPlan === (plan.priceId || '') || !plan.priceId}
                  isLoading={loadingPlan === (plan.priceId || '')}
                >
                  {isCurrentPlan(plan.id) ? 'CURRENT PLAN' : 'UPGRADE'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Premium Service Offering */}
        <div className="mb-12">
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-purple-500/20 to-purple-500/10 border-purple-500/30">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="relative">
                    <Crown size={48} className="text-purple-400 fill-current" />
                    <div className="absolute inset-0 bg-purple-400/30 blur-xl rounded-full"></div>
                  </div>
                </div>
                <h3 className="text-3xl font-anton text-white-knight mb-4 uppercase tracking-wide">
                  PREMIUM CONCIERGE SERVICE
                </h3>
                <p className="text-xl text-purple-300 font-jakarta mb-6">
                  Let our expert team handle candidate outreach and scheduling for you
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                  <h4 className="text-xl font-anton text-white-knight uppercase tracking-wide">
                    What's Included:
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <CheckCircle className="text-purple-400 mr-3 mt-1 flex-shrink-0" size={20} />
                      <span className="text-guardian font-jakarta">
                        <strong className="text-white-knight">Personalized Outreach:</strong> Our team reaches out to candidates on your behalf with customized messages
                      </span>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="text-purple-400 mr-3 mt-1 flex-shrink-0" size={20} />
                      <span className="text-guardian font-jakarta">
                        <strong className="text-white-knight">Calendar Coordination:</strong> We schedule qualified candidates directly on your calendar
                      </span>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="text-purple-400 mr-3 mt-1 flex-shrink-0" size={20} />
                      <span className="text-guardian font-jakarta">
                        <strong className="text-white-knight">Quality Screening:</strong> Pre-qualification calls to ensure candidate fit before scheduling
                      </span>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="text-purple-400 mr-3 mt-1 flex-shrink-0" size={20} />
                      <span className="text-guardian font-jakarta">
                        <strong className="text-white-knight">Dedicated Support:</strong> Personal account manager for seamless communication
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xl font-anton text-white-knight uppercase tracking-wide">
                    Investment:
                  </h4>
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-6">
                    <div className="text-center">
                      <div className="text-3xl font-anton text-purple-300 mb-2">
                        $999<span className="text-lg">/month</span>
                      </div>
                      <div className="text-purple-400 font-jakarta mb-4">
                        + 5% service fee per successful placement
                      </div>
                      <p className="text-guardian font-jakarta text-sm">
                        Minimum 3-month commitment. Cancel with 30-day notice.
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-center pt-4">
                    <Button 
                      onClick={() => window.open('https://calendly.com/superrecruiter/outboundcandidatepipelines', '_blank')}
                      variant="primary"
                      size="lg"
                      className="bg-purple-500 hover:bg-purple-600 text-white font-anton uppercase tracking-wide px-8 py-4"
                    >
                      BOOK DISCOVERY CALL
                    </Button>
                    <p className="text-guardian font-jakarta text-sm mt-2">
                      15-minute consultation to discuss your hiring needs
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center border-t border-purple-500/20 pt-6">
                <p className="text-guardian font-jakarta">
                  <strong className="text-white-knight">Perfect for:</strong> Busy executives, HR leaders, and hiring managers who want qualified candidates 
                  delivered directly to their calendar without the hassle of sourcing and initial outreach.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};