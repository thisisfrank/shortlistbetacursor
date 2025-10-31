import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CheckCircle, Zap, Crown, Star, Users, X } from 'lucide-react';
import { CreditTopOff } from './CreditTopOff';
import { 
  getSubscriptionTiers, 
  getTierByUuid, 
  isDowngrade as checkIsDowngrade,
  STRIPE_BILLING_PORTAL,
  type TierConfig 
} from '../../config/tiers.config';

export const SubscriptionPlans: React.FC = () => {
  const { userProfile } = useAuth();
  const [showRefillModal, setShowRefillModal] = useState(false);

  // Get all subscription tiers from config
  const subscriptionTiers = getSubscriptionTiers();

  // Get user's current tier configuration
  const currentTier = userProfile?.tierId ? getTierByUuid(userProfile.tierId) : null;

  const isDowngrade = (targetTierUuid: string) => {
    if (!userProfile?.tierId) return false;
    return checkIsDowngrade(userProfile.tierId, targetTierUuid);
  };

  const handleSubscribe = (tier: TierConfig) => {
    if (!tier.paymentLink) return;

    // If it's a downgrade, redirect to Stripe Billing Portal
    if (isDowngrade(tier.tierId)) {
      window.open(STRIPE_BILLING_PORTAL, '_blank');
    } else {
      // For upgrades, use the payment link
      window.open(tier.paymentLink, '_blank');
    }
  };


  const getPlanIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Crown':
        return <Crown className="text-supernova" size={32} />;
      case 'Star':
        return <Star className="text-blue-400" size={32} />;
      case 'Zap':
        return <Zap className="text-green-400" size={32} />;
      case 'Users':
      default:
        return <Users className="text-guardian" size={32} />;
    }
  };

  const isCurrentPlan = (tierUuid: string) => {
    return currentTier?.tierId === tierUuid;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-shadowforce via-shadowforce-light to-shadowforce">
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        {/* Header */}
        <header className="mb-4 md:mb-6 text-center">
          <div className="flex items-center justify-center mb-2 md:mb-3 mt-2 md:mt-4">
            <div className="relative">
              <img
                src="/screenshots/v2.png"
                alt="Super Recruiter Logo"
                className="animate-pulse"
                style={{ width: '100px', height: '42px', filter: 'drop-shadow(0 0 16px #FFD600)', objectFit: 'contain' }}
              />
            </div>
          </div>
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-anton text-white-knight mb-2 md:mb-3 uppercase tracking-wide px-4">
            Start With The Plan That Fits You!
          </h1>
          <p className="text-sm md:text-lg text-guardian font-jakarta max-w-xl mx-auto px-4">
          Get high-quality candidates for less than a job posting.
          </p>
        </header>



        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          {subscriptionTiers.map((tier) => (
            <Card 
              key={tier.tierId} 
              className={`relative hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br ${tier.color} flex flex-col h-full`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge variant="default" className="px-4 py-1">
                    MOST POPULAR
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center !py-3 !px-4 !border-b-0">
                <div className="flex justify-center mb-1">
                  {getPlanIcon(tier.icon)}
                </div>
                <h3 className="text-xl font-anton text-white-knight uppercase tracking-wide mb-1">
                  {tier.displayName}
                </h3>
                <div className="mb-1">
                  <span className="text-2xl font-anton text-supernova">${tier.price}</span>
                  <span className="text-guardian font-jakarta">/month</span>
                </div>
                <p className="text-guardian font-jakarta text-sm">
                  {tier.description}
                </p>
              </CardHeader>

              <CardContent className="!pt-2 !pb-3 !px-4">
                <div className="mb-4 flex-1">
                  <div className="text-center">
                    <div className="text-2xl font-anton text-supernova mb-0.5">
                      {tier.credits} CANDIDATES
                    </div>
                    <div className="text-xs text-guardian font-jakarta mb-0.5">
                      per month
                    </div>
                    <div className="text-xs text-guardian font-jakarta">
                      [${(tier.price / tier.credits).toFixed(2)}/per candidate]
                    </div>
                  </div>
                </div>

                <div>
                  <Button
                  fullWidth
                  size="md"
                  variant={isCurrentPlan(tier.tierId) ? 'outline' : 'primary'}
                  onClick={() => isCurrentPlan(tier.tierId) ? setShowRefillModal(true) : handleSubscribe(tier)}
                  disabled={false}
                  isLoading={false}
                >
                  {isCurrentPlan(tier.tierId) 
                    ? 'REFILL' 
                    : isDowngrade(tier.tierId)
                    ? 'DOWNGRADE'
                    : (tier.buttonText || 'LEVEL UP')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Premium Service Offering */}
        <div className="mb-6 md:mb-8 flex justify-center">
          <div className="w-full lg:w-5/6 xl:w-2/3">
            <Card className="bg-gradient-to-r from-yellow-500/20 to-yellow-500/10 border-yellow-500/30">
            <CardContent className="p-4 md:p-6">
              <div className="text-center mb-3">
                <h3 className="text-lg md:text-xl lg:text-2xl font-anton text-white-knight uppercase tracking-wide px-4">
                  Want help turning your candidate lists into real interviews?
                </h3>
              </div>

              <div className="text-center mb-6">
                
                <Button 
                  onClick={() => window.open('https://superrecruiterinfo.com/candidate-accelerator-page', '_blank')}
                  variant="primary"
                  size="md"
                  className="bg-yellow-400 hover:bg-yellow-500 text-black font-anton uppercase tracking-wide px-4 md:px-6 py-2 mb-2 w-full sm:w-auto text-sm"
                >
                  See How to Lower Your Cost Per Hire
                </Button>
                <p className="text-white-knight font-anton text-base md:text-lg lg:text-xl uppercase tracking-wide px-4">
                  Lower your cost per hire by 30% in 60 days or pay nothing.
                </p>
                <div className="mt-4">
                  <p className="text-guardian font-jakarta text-base italic">
                    "Super Recruiter truly understand the nuances of quality recruitment and have a pricing model you can't beat."
                  </p>
                  <p className="text-supernova font-jakarta text-sm mt-1">
                    Michael Tibor, CEO of Credo
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-anton text-white-knight uppercase tracking-wide mb-4 text-center">
                  WHAT'S INCLUDED:
                </h4>
                <div className="space-y-2 max-w-2xl mx-auto">
                  <div className="flex items-start justify-center">
                    <CheckCircle className="text-yellow-400 mr-2 mt-1 flex-shrink-0" size={18} />
                    <span className="text-guardian font-jakarta">
                      Dedicated Super Recruiter
                    </span>
                  </div>
                  <div className="flex items-start justify-center">
                    <CheckCircle className="text-yellow-400 mr-2 mt-1 flex-shrink-0" size={18} />
                    <span className="text-guardian font-jakarta">
                      Outbound candidate pipelines built & managed for you
                    </span>
                  </div>
                  <div className="flex items-start justify-center">
                    <CheckCircle className="text-yellow-400 mr-2 mt-1 flex-shrink-0" size={18} />
                    <span className="text-guardian font-jakarta">
                      100% sourced candidates (not job board spam)
                    </span>
                  </div>
                  <div className="flex items-start justify-center">
                    <CheckCircle className="text-yellow-400 mr-2 mt-1 flex-shrink-0" size={18} />
                    <span className="text-guardian font-jakarta">
                     Pre-screened, qualified candidates -<br />scheduled straight to your calendar
                    </span>
                  </div>
                  <div className="flex items-start justify-center">
                    <CheckCircle className="text-yellow-400 mr-2 mt-1 flex-shrink-0" size={18} />
                    <span className="text-guardian font-jakarta">
                    A/B message testing to boost candidate response rates
                    </span>
                  </div>
                  <div className="flex items-start justify-center">
                    <CheckCircle className="text-yellow-400 mr-2 mt-1 flex-shrink-0" size={18} />
                    <span className="text-guardian font-jakarta">
                      Proven multi-channel outreach (email, LinkedIn, SMS)
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-center border-t border-yellow-500/20 pt-4">
                <p className="text-guardian font-jakarta text-sm">
                  <strong className="text-white-knight">Perfect for:</strong> Hiring managers, recruiters, and founders<br />who want high-quality candidates delivered straight to their calendars - without lifting a finger.
                </p>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>

        {/* Refill Modal */}
        {showRefillModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="relative w-full max-w-6xl my-8">
              <button
                onClick={() => setShowRefillModal(false)}
                className="absolute -top-4 -right-4 bg-white-knight text-shadowforce rounded-full p-2 hover:bg-guardian transition-colors z-10"
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
              <div className="bg-shadowforce rounded-lg">
                <CreditTopOff />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};