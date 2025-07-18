import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../../hooks/useSubscription';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { CheckCircle, Zap, ArrowRight } from 'lucide-react';

export const SubscriptionSuccess: React.FC = () => {
  const navigate = useNavigate();
  const { subscription, getSubscriptionPlan } = useSubscription();
  const subscriptionPlan = getSubscriptionPlan();

  useEffect(() => {
    // Auto-redirect after 10 seconds
    const timer = setTimeout(() => {
      navigate('/');
    }, 10000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-shadowforce via-shadowforce-light to-shadowforce flex items-center justify-center px-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-12 text-center">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <CheckCircle size={80} className="text-green-400 animate-pulse" />
              <div className="absolute inset-0 bg-green-400/30 blur-2xl rounded-full"></div>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-anton text-white-knight mb-6 uppercase tracking-wide">
            SUBSCRIPTION ACTIVATED!
          </h1>
          
          <p className="text-xl text-guardian mb-8 font-jakarta max-w-xl mx-auto leading-relaxed">
            Welcome to Super Recruiter {subscriptionPlan?.name || 'Premium'}! Your subscription has been successfully activated. 
            You now have access to {subscriptionPlan?.name === 'Top Shelf' ? 'all premium features and unlimited access' : 'enhanced features and priority support'}.
          </p>
          
          <div className="bg-supernova/10 border border-supernova/30 p-6 rounded-xl mb-8">
            <div className="flex items-center justify-center mb-4">
              <Zap className="text-supernova mr-3" size={32} />
              <h3 className="font-anton text-xl text-supernova uppercase">What's Next?</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div className="flex items-start">
                <ArrowRight className="text-supernova mr-3 mt-1 flex-shrink-0" size={16} />
                <div>
                  <h4 className="font-jakarta font-semibold text-white-knight mb-1">
                    {subscriptionPlan?.name === 'Top Shelf' ? 'Unlimited Job Submissions' : 'Enhanced Job Submissions'}
                  </h4>
                  <p className="text-guardian font-jakarta text-sm">
                    {subscriptionPlan?.name === 'Top Shelf' 
                      ? 'Submit unlimited job requests with priority processing'
                      : 'Submit multiple job requests with faster processing'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <ArrowRight className="text-supernova mr-3 mt-1 flex-shrink-0" size={16} />
                <div>
                  <h4 className="font-jakarta font-semibold text-white-knight mb-1">
                    {subscriptionPlan?.name === 'Top Shelf' ? 'Dedicated Support' : 'Priority Support'}
                  </h4>
                  <p className="text-guardian font-jakarta text-sm">
                    {subscriptionPlan?.name === 'Top Shelf'
                      ? 'Get dedicated account management and custom integrations'
                      : 'Receive priority support and advanced features'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <ArrowRight className="text-supernova mr-3 mt-1 flex-shrink-0" size={16} />
                <div>
                  <h4 className="font-jakarta font-semibold text-white-knight mb-1">
                    Advanced Analytics
                  </h4>
                  <p className="text-guardian font-jakarta text-sm">
                    Access detailed insights, performance metrics, and AI-generated candidate analysis
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <ArrowRight className="text-supernova mr-3 mt-1 flex-shrink-0" size={16} />
                <div>
                  <h4 className="font-jakarta font-semibold text-white-knight mb-1">
                    Enhanced Candidate Credits
                  </h4>
                  <p className="text-guardian font-jakarta text-sm">
                    {subscriptionPlan?.name === 'Top Shelf' 
                      ? 'Unlimited candidate credits for comprehensive sourcing'
                      : `${subscriptionPlan?.name === 'Premium' ? '750' : '150'} monthly candidate credits`
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/')}
              size="lg"
              className="glow-supernova"
            >
              GET STARTED
            </Button>
            <Button 
              onClick={() => navigate('/subscription')}
              variant="outline"
              size="lg"
            >
              VIEW SUBSCRIPTION
            </Button>
          </div>
          
          <p className="text-guardian/60 font-jakarta text-sm mt-8">
            You'll be automatically redirected to the dashboard in a few seconds
          </p>
        </CardContent>
      </Card>
    </div>
  );
};