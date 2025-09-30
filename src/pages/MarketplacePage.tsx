import React from 'react';
import { Lock, Clock, Download, Gift, Zap, Calculator, Building, Users, BookOpen, Target, Play, CheckCircle, ExternalLink, Bot, TrendingUp, Briefcase, Network, Award } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useMarketplaceUnlock, MarketplaceItem } from '../hooks/useMarketplaceUnlock';

const marketplaceItems: MarketplaceItem[] = [
  {
    id: 'ai-message-generator',
    title: 'AI Message Generator',
    description: 'Personalize your outreach in seconds - with messages that actually get replies.',
    unlockDay: 0,
    sequenceIndex: 0,
    icon: Zap,
    category: 'free',
  },
  {
    id: 'clay-table-emails',
    title: 'Get Candidate Emails',
    description: 'Unlock a Clay table with verified candidate emails to power your outreach.',
    unlockDay: 5,
    sequenceIndex: 1,
    icon: Download,
    category: 'free',
  },
  {
    id: 'super-recruiter',
    title: 'Convert Your List of Candidates into Real Interviews',
    description: 'Book your free call 15-minute discovery call',
    unlockDay: 10,
    sequenceIndex: 2,
    icon: Target,
    category: 'free',
  },
  {
    id: 'employee-retention-kit',
    title: 'Employee Retention Kit',
    description: 'Proven strategies to keep your best people longer and reduce costly turnover.',
    unlockDay: 15,
    sequenceIndex: 3,
    icon: Users,
    category: 'starter',
  },
  {
    id: 'ai-recruiter-kit',
    title: 'AI Recruiter Kit',
    description: 'Automate your recruiting with AI-driven workflows and tools.',
    unlockDay: 20,
    sequenceIndex: 4,
    icon: Bot,
    category: 'starter',
  },
  {
    id: 'candidate-conversion-kit',
    title: 'Candidate Conversion Kit',
    description: 'Turn passive, high-quality candidates into interviews with these strategies and ready-to-use templates.',
    unlockDay: 25,
    sequenceIndex: 5,
    icon: Award,
    category: 'starter',
  },
  {
    id: 'candidate-conversion-kit-agency',
    title: 'Candidate Conversion Kit\n(Agency Edition)',
    description: 'Make more placements with these strategies and ready-to-use templates.',
    unlockDay: 30,
    sequenceIndex: 6,
    icon: Briefcase,
    category: 'starter',
  },
  {
    id: 'cost-per-hire-calculator',
    title: 'Cost Per Hire Calculator',
    description: 'See your true cost per hire - and how you can save money and time.',
    unlockDay: 35,
    sequenceIndex: 7,
    icon: Calculator,
    category: 'starter',
  },
  {
    id: 'infrastructure-build',
    title: 'Infrastructure Build',
    description: 'Get the complete playbook to set up a scalable, world-class recruiting operation from the ground up.',
    unlockDay: 40,
    sequenceIndex: 8,
    icon: Building,
    category: 'starter',
  },
  {
    id: 'outbound-pipelines',
    title: '100x Recruiter Stack',
    description: 'Build repeatable pipelines to consistently reach and convert top talent - without relying on job boards, referrals, or staffing firms.',
    unlockDay: 45,
    sequenceIndex: 9,
    icon: TrendingUp,
    category: 'enterprise',
  },
  {
    id: 'outbound-pipelines-agency',
    title: '100x Recruiter Stack\n(Agency Edition)',
    description: 'An agency-focused recruiting stack to cut costs, scale outreach, and make more placements.',
    unlockDay: 50,
    sequenceIndex: 10,
    icon: Network,
    category: 'enterprise',
  },
  {
    id: 'end-to-end-guide',
    title: 'End-to-End Recruiter Guide',
    description: 'Master modern recruiting with a complete playbook that covers every step - from sourcing to hire.',
    unlockDay: 55,
    sequenceIndex: 11,
    icon: BookOpen,
    category: 'enterprise',
  }
];

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'free': return 'border-green-500 bg-green-500/10';
    case 'starter': return 'border-blue-500 bg-blue-500/10';
    case 'enterprise': return 'border-orange-500 bg-orange-500/10';
    default: return 'border-guardian bg-guardian/10';
  }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'free': return 'Free Unlocks';
    case 'starter': return 'Starter Kits';
    case 'enterprise': return 'Advanced Recruiting Playbooks';
    default: return category;
  }
};

export const MarketplacePage: React.FC = () => {
  const { 
    getDaysActive, 
    getUnlockedItemsCount, 
    getDaysUntilNextUnlock, 
    isItemUnlocked,
    getNextUnlockItem
  } = useMarketplaceUnlock();

  const daysActive = getDaysActive();
  const unlockedCount = getUnlockedItemsCount();
  const daysUntilNext = getDaysUntilNextUnlock();
  const nextUnlockItem = getNextUnlockItem(marketplaceItems);

  // Separate AI Message Generator from other items
  const aiMessageGenerator = marketplaceItems.find(item => item.id === 'ai-message-generator');
  const otherItems = marketplaceItems.filter(item => item.id !== 'ai-message-generator');
  
  const groupedItems = otherItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MarketplaceItem[]>);

  const handleUnlock = (item: MarketplaceItem) => {
    // Only allow access if item is unlocked
    if (!isItemUnlocked(item)) {
      return;
    }

    // Navigate to AI Message Generator if it's unlocked
    if (item.id === 'ai-message-generator') {
      window.location.href = '/ai-message-generator';
      return;
    }

    // Handle external links for marketplace items
    const itemUrls: Record<string, string> = {
      'ai-recruiter-kit': 'https://superrecruiterinfo.com/ai-recruiter-tools',
      'candidate-conversion-kit': 'https://superrecruiterinfo.com/candidate-conversion-kit-corp',
      'candidate-conversion-kit-agency': 'https://superrecruiterinfo.com/candidate-conversion-kit-staffing',
      'cost-per-hire-calculator': 'https://superrecruiterinfo.com/cost-per-hire-calculator',
      'employee-retention-kit': 'https://superrecruiterinfo.com/employee-retention',
      'end-to-end-guide': 'https://superrecruiterinfo.com/evaluation-interviewing',
      'infrastructure-build': 'https://superrecruiterinfo.com/hiring-playbook',
      'outbound-pipelines': 'https://superrecruiterinfo.com/outbound-recruiting',
      'outbound-pipelines-agency': 'https://superrecruiterinfo.com/outbound-recruiting-agency',
      'super-recruiter': 'https://api.leadconnectorhq.com/widget/bookings/superrecruiter-strategy-call'
    };

    const url = itemUrls[item.id];
    if (url) {
      window.open(url, '_blank');
    } else {
      console.log('Accessing:', item.title);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-shadowforce via-shadowforce-light to-shadowforce py-8">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header */}
        <div className="text-center mb-16 mt-12">
          <h1 className="text-8xl font-anton text-white-knight leading-tight uppercase mb-4">
            Superpowers
          </h1>
          <p className="text-xl text-guardian mb-4">
            Unlock premium hiring tools and resources
          </p>
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 bg-supernova/20 border border-supernova px-4 py-2 rounded-lg">
              <Clock className="text-supernova" size={20} />
              <span className="text-white-knight font-semibold text-sm">
                {daysUntilNext > 0 
                  ? `Next unlock in ${daysUntilNext} day${daysUntilNext !== 1 ? 's' : ''}`
                  : 'New unlock available!'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Categories */}
        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} className="mb-12">
            <h2 className="text-2xl font-bold text-white-knight font-jakarta mb-6 capitalize">
              {getCategoryLabel(category)}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Featured AI Message Generator for free category */}
              {category === 'free' && aiMessageGenerator && (
                <Card className="relative overflow-hidden bg-gradient-to-br from-supernova/20 via-supernova/10 to-transparent border-2 border-supernova/50 shadow-2xl flex flex-col h-full">
                  {/* Animated background elements */}
                  <div className="absolute inset-0 bg-gradient-to-r from-supernova/5 to-transparent"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-supernova/10 rounded-full -translate-y-16 translate-x-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-supernova/10 rounded-full translate-y-12 -translate-x-12"></div>
                  
                  <div className="relative p-6 flex-grow flex flex-col">
                    <div className="text-center flex-grow flex flex-col justify-center">
                      {/* Badge */}
                      <div className="mb-4">
                        <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500 px-3 py-1 rounded-full">
                          <Gift size={14} className="text-green-500" />
                          <span className="text-green-500 font-semibold text-sm">FEATURED</span>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-white-knight font-jakarta mb-2">
                          AI Message Generator
                        </h3>
                        <p className="text-guardian text-sm mb-4">
                          Personalize your outreach in seconds - with messages that actually get replies.
                        </p>
                      </div>
                    </div>
                    
                    {/* Action area */}
                    <div className="pt-3 border-t border-guardian/20 space-y-2">
                      {isItemUnlocked(aiMessageGenerator) ? (
                        <button 
                          onClick={() => handleUnlock(aiMessageGenerator)}
                          className="w-full text-supernova hover:text-supernova/80 text-sm font-medium flex items-center justify-center gap-2 transition-colors py-2"
                        >
                          <Play size={14} />
                          Start Creating Messages
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleUnlock(aiMessageGenerator)}
                          className="w-full bg-supernova text-shadowforce hover:bg-supernova/90 text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                          Buy Now
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              )}
              {items.map((item) => {
                const Icon = item.icon;
                const itemUnlocked = isItemUnlocked(item);
                
                return (
                  <Card key={item.id} className={`p-6 ${getCategoryColor(category)} border-2 flex flex-col h-full ${
                    itemUnlocked ? 'ring-2 ring-supernova/50' : ''
                  }`}>
                    <div className="flex items-start gap-4 mb-4 flex-grow">
                      <div className={`p-3 rounded-lg ${
                        itemUnlocked ? 'bg-supernova/20' : 'bg-guardian/10'
                      }`}>
                        <Icon size={24} className={
                          itemUnlocked ? 'text-supernova' : 'text-guardian'
                        } />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white-knight font-jakarta mb-2 whitespace-pre-line">
                          {item.title}
                        </h3>
                        <p className="text-guardian text-sm mb-3">
                          {item.description}
                        </p>
                        
                        {/* Status indicator */}
                        {!itemUnlocked && (
                          <div className="flex items-center gap-2 text-guardian">
                            <Clock size={16} />
                            <span className="text-sm">
                              {item.id === 'clay-table-emails' 
                                ? 'Free upon upgrading plans' 
                                : `Unlocks Day ${item.unlockDay}`
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Action area */}
                    <div className="pt-3 border-t border-guardian/20 space-y-2">
                      {itemUnlocked ? (
                        <button 
                          onClick={() => handleUnlock(item)}
                          className="w-full text-supernova hover:text-supernova/80 text-sm font-medium flex items-center justify-center gap-2 transition-colors py-2"
                        >
                          <ExternalLink size={14} />
                          {item.id === 'super-recruiter' ? 'Schedule Strategy Session' : 'Access Now'}
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleUnlock(item)}
                          className="w-full bg-supernova text-shadowforce hover:bg-supernova/90 text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                          {item.id === 'super-recruiter' ? 'Book My Free Meeting' : 'Buy Now'}
                        </button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}


      </div>
    </div>
  );
};
