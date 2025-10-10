import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Zap } from 'lucide-react';

const creditPacks = [
  {
    credits: 100,
    price: 40,
    paymentLink: 'https://buy.stripe.com/aFacN7aek50P4LL08d2Ry04',
    popular: true,
    savingsText: 'Best for single role'
  },
  {
    credits: 250,
    price: 85,
    paymentLink: 'https://buy.stripe.com/28E5kF5Y43WL7XX08d2Ry05',
    popular: false,
    savingsText: 'Best for multiple roles'
  },
  {
    credits: 500,
    price: 150,
    paymentLink: 'https://buy.stripe.com/eVq3cxfyE3WL4LL8EJ2Ry06',
    popular: false,
    savingsText: 'Best for hiring sprint'
  }
];

export const CreditTopOff: React.FC = () => {
  return (
    <div className="mt-12 mb-12">
      <div className="text-center mb-8">
        <h2 className="font-anton text-3xl md:text-4xl text-white-knight uppercase tracking-wide mb-2">
          NEED MORE CREDITS NOW?
        </h2>
        <p className="text-guardian font-jakarta text-lg">
          Top off your account with one-time credit packs
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {creditPacks.map((pack) => (
          <Card 
            key={pack.credits}
            className={`relative hover:shadow-2xl transition-all duration-300 transform hover:scale-105 ${
              pack.popular 
                ? 'border-2 border-supernova bg-gradient-to-br from-supernova/10 to-supernova/5' 
                : 'border border-guardian/30 bg-gradient-to-br from-guardian/10 to-guardian/5'
            }`}
          >
            {pack.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge variant="default" className="px-4 py-1 bg-supernova text-shadowforce font-anton">
                  MOST POPULAR
                </Badge>
              </div>
            )}
            
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <Zap className={`mx-auto ${pack.popular ? 'text-supernova' : 'text-guardian'}`} size={40} />
              </div>
              
              <div className="mb-2">
                <div className="text-3xl font-anton text-white-knight">
                  {pack.credits}
                </div>
                <div className="text-sm text-guardian font-jakarta uppercase tracking-wide">
                  CANDIDATES
                </div>
              </div>
              
              <div className="my-4 py-4 border-t border-b border-guardian/20">
                <div className="text-3xl font-anton text-supernova mb-1">
                  ${pack.price}
                </div>
                <div className="text-xs text-guardian font-jakarta">
                  ${(pack.price / pack.credits).toFixed(2)} per candidate
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-guardian font-jakarta text-sm italic">
                  {pack.savingsText}
                </p>
              </div>
              
              <Button
                fullWidth
                size="lg"
                onClick={() => window.open(pack.paymentLink, '_blank')}
                className={`font-anton tracking-wide ${
                  pack.popular
                    ? 'bg-supernova hover:bg-supernova-light text-shadowforce'
                    : 'bg-guardian/20 hover:bg-guardian/30 text-white-knight'
                }`}
              >
                BUY NOW
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="text-center mt-8">
        <p className="text-guardian text-sm font-jakarta max-w-2xl mx-auto">
          💡 <span className="font-semibold">Save more with a subscription:</span> Get credits at $0.28-0.40 each with monthly plans instead of $0.30-0.40 per top-off
        </p>
      </div>
    </div>
  );
};

