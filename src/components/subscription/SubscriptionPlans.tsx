import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CheckCircle, Zap, Crown, Star, Users } from 'lucide-react';
import BoltIcon from '../../assets/v2.png';

// Updated subscription plans with payment links
const subscriptionPlans = [
  {
    id: 'basic',
    name: 'Average Recruiter',
    price: 29,
    priceId: 'price_1S7TO3Hb6LdHADWYvWMTutrj', // Updated Stripe price ID
    paymentLink: 'https://buy.stripe.com/test_00w14neF09lNgjLd2h9R603', // Average Recruiter
    description: 'Perfect for getting started',
    features: {
      jobs: 3,
      credits: 100,
      companyEmails: false,
      unlimited: false
    },
    popular: false,
    color: 'from-green-500/20 to-green-500/10 border-green-500/30'
  },
  {
    id: 'premium',
    name: 'Beast Mode',
    price: 99,
    priceId: 'price_1S7TOGHb6LdHADWYAu8g3h3f', // Updated Stripe price ID
    paymentLink: 'https://buy.stripe.com/test_6oU7sLgN89lNaZr8M19R604', // Beast Mode
    description: 'Advanced features for scaling businesses',
    features: {
      jobs: 3,
      credits: 400,
      companyEmails: true,
      unlimited: false
    },
    popular: true,
    color: 'from-blue-500/20 to-blue-500/10 border-blue-500/30'
  },
  {
    id: 'topshelf',
    name: 'Super Recruiter',
    price: 699,
    priceId: 'price_1S7TPaHb6LdHADWYhMgRw3YY', // Updated Stripe price ID
    paymentLink: 'https://buy.stripe.com/test_14AaEX40m0PhgjL1jz9R605', // Super Recruiter
    description: 'Unlimited access for enterprise teams',
    features: {
      jobs: 10,
      credits: 2500,
      companyEmails: true,
      unlimited: true
    },
    popular: false,
    color: 'from-supernova/20 to-supernova/10 border-supernova/30'
  }
];

export const SubscriptionPlans: React.FC = () => {
  const { userProfile } = useAuth();

  // Map tier IDs to plan IDs for accurate current plan detection
  const tierIdToPlanId: Record<string, string> = {
    '88c433cf-0a8d-44de-82fa-71c7dcbe31ff': 'basic',    // Average Recruiter tier  
    'f871eb1b-6756-447d-a1c0-20a373d1d5a2': 'premium',  // Beast Mode tier
    'd8b7d6ae-8a44-49c9-9dc3-1c6b183815fd': 'topshelf'  // Super Recruiter tier
  };

  // Get current plan based on user's actual tier_id
  const getCurrentPlanFromTier = () => {
    if (!userProfile?.tierId) return null;
    const planId = tierIdToPlanId[userProfile.tierId];
    return subscriptionPlans.find(plan => plan.id === planId) || null;
  };

  const currentTierPlan = getCurrentPlanFromTier();

  const handleSubscribe = (paymentLink: string | null) => {
    if (!paymentLink) {
      return;
    }

    // Redirect to Stripe Payment Link - no authentication required
    window.open(paymentLink, '_blank');
  };


  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'Super Recruiter':
        return <Crown className="text-supernova" size={32} />;
      case 'Beast Mode':
        return <Star className="text-blue-400" size={32} />;
      case 'Average Recruiter':
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
          <div className="flex items-center justify-center mb-6 mt-8">
            <div className="relative">
              <img
                src={BoltIcon}
                alt="Super Recruiter Logo"
                className="animate-pulse"
                style={{ width: '150px', height: '62px', filter: 'drop-shadow(0 0 16px #FFD600)', objectFit: 'contain' }}
              />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-anton text-white-knight mb-4 uppercase tracking-wide">
            CANDIDATE CREDIT PLANS
          </h1>
          <p className="text-xl text-guardian font-jakarta max-w-xl mx-auto">
          For less than a job posting, get high-quality candidates for your exact opening
          </p>
        </header>



        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
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
                  <span className="text-2xl font-anton text-supernova">${plan.price}</span>
                  <span className="text-guardian font-jakarta">/month</span>
                </div>
                <p className="text-guardian font-jakarta text-sm">
                  {plan.id === 'basic' && 'For growing teams'}
                  {plan.id === 'premium' && 'For scaling businesses'}
                  {plan.id === 'topshelf' && 'Unlimited access for enterprise'}
                </p>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-4 mb-8 flex-1">
                  <div className="text-center mt-6">
                    <div className="text-4xl font-anton text-supernova mb-2">
                      {plan.features.credits} CREDITS
                    </div>
                    <div className="text-sm text-guardian font-jakarta">
                      per month
                    </div>
                    <div className="text-sm text-guardian font-jakarta">
                      [${(plan.price / plan.features.credits).toFixed(2)}/per candidate]
                    </div>
                  </div>
                </div>

                <div>
                  <Button
                  fullWidth
                  size="lg"
                  variant={isCurrentPlan(plan.id) ? 'outline' : 'primary'}
                  onClick={() => handleSubscribe(plan.paymentLink)}
                  disabled={isCurrentPlan(plan.id)}
                  isLoading={false}
                >
                  {isCurrentPlan(plan.id) 
                    ? 'CURRENT PLAN' 
                    : 'SUBSCRIBE NOW'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>


        {/* Premium Service Offering */}
        <div className="mb-12 flex justify-center">
          <div className="w-1/2">
            <Card className="bg-gradient-to-r from-yellow-500/20 to-yellow-500/10 border-yellow-500/30">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="relative">
                    <img
                      src={BoltIcon}
                      alt="Super Recruiter Logo"
                      style={{ width: '120px', height: '50px', filter: 'drop-shadow(0 0 12px #FACC15)', objectFit: 'contain' }}
                    />
                  </div>
                </div>
                <h3 className="text-3xl font-anton text-white-knight mb-4 uppercase tracking-wide">
                CANDIDATE ACCELERATOR PROGRAM
                </h3>
                <p className="text-xl text-yellow-300 font-jakarta mb-6">
                  Want help turning your candidate lists into real interviews? 
                </p>
              </div>

              <div className="text-center mb-8">
                
                <Button 
                  onClick={() => window.open('https://calendly.com/superrecruiter/outboundcandidatepipelines', '_blank')}
                  variant="primary"
                  size="lg"
                  className="bg-yellow-400 hover:bg-yellow-500 text-black font-anton uppercase tracking-wide px-8 py-4 mb-4"
                >
                  BOOK YOUR STRATEGY CALL
                </Button>
                <p className="text-guardian font-jakarta text-sm">
                  Lower your cost per hire by over 30% in 60 days or pay nothing.
                </p>
              </div>

              <div className="mb-8">
                <h4 className="text-xl font-anton text-white-knight uppercase tracking-wide mb-6 text-center">
                  WHAT'S INCLUDED:
                </h4>
                <div className="space-y-4 max-w-2xl mx-auto">
                  <div className="flex items-start justify-center">
                    <CheckCircle className="text-yellow-400 mr-3 mt-1 flex-shrink-0" size={20} />
                    <span className="text-guardian font-jakarta">
                      Your personal Super Recruiter
                    </span>
                  </div>
                  <div className="flex items-start justify-center">
                    <CheckCircle className="text-yellow-400 mr-3 mt-1 flex-shrink-0" size={20} />
                    <span className="text-guardian font-jakarta">
                      High-quality candidate sourcing for every role
                    </span>
                  </div>
                  <div className="flex items-start justify-center">
                    <CheckCircle className="text-yellow-400 mr-3 mt-1 flex-shrink-0" size={20} />
                    <span className="text-guardian font-jakarta">
                      Create and manage your outbound pipelines
                    </span>
                  </div>
                  <div className="flex items-start justify-center">
                    <CheckCircle className="text-yellow-400 mr-3 mt-1 flex-shrink-0" size={20} />
                    <span className="text-guardian font-jakarta">
                      Weekly reports with actionable recruiting insights
                    </span>
                  </div>
                  <div className="flex items-start justify-center">
                    <CheckCircle className="text-yellow-400 mr-3 mt-1 flex-shrink-0" size={20} />
                    <span className="text-guardian font-jakarta">
                      A/B message testing to maximize conversions
                    </span>
                  </div>
                  <div className="flex items-start justify-center">
                    <CheckCircle className="text-yellow-400 mr-3 mt-1 flex-shrink-0" size={20} />
                    <span className="text-guardian font-jakarta">
                      Custom candidate pitch deck to sell your company
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-center border-t border-yellow-500/20 pt-6">
                <p className="text-guardian font-jakarta">
                  <strong className="text-white-knight">Perfect for:</strong> Hiring managers, recruiters, and founders who want high-quality candidates <br/>delivered straight to their calendars - without lifting a finger.
                </p>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </div>
  );
};