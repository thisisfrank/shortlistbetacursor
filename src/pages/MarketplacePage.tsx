import React from 'react';
import { Lock, Star, Download, Gift, Zap, Calculator, Building, Users, BookOpen, Target, Play } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useMarketplaceUnlock } from '../hooks/useMarketplaceUnlock';

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  points: number | 'FREE';
  unlockCondition?: string;
  icon: any;
  category: 'free' | 'starter' | 'enterprise';
  isLocked: boolean;
}

const marketplaceItems: MarketplaceItem[] = [
  {
    id: 'ai-message-generator',
    title: 'AI Message Generator',
    description: 'Personalize your outreach in seconds - with messages that actually get replies.',
    points: 'FREE',
    unlockCondition: 'Free with your first job entry',
    icon: Zap,
    category: 'free',
    isLocked: false
  },
  {
    id: 'clay-table-emails',
    title: 'Get Candidate Emails',
    description: 'Unlock a Clay table with verified candidate emails to power your outreach.',
    points: 'FREE',
    unlockCondition: 'Free with your first purchase',
    icon: Download,
    category: 'free',
    isLocked: true
  },
  {
    id: 'super-recruiter',
    title: 'Super Recruiter: Convert your candidate list into real interviews',
    description: 'Free outbound implementation meeting with your first job entry.',
    points: 'FREE',
    unlockCondition: 'Free with your first job entry',
    icon: Target,
    category: 'free',
    isLocked: true
  },
  {
    id: 'employee-retention-kit',
    title: 'Employee Retention Kit',
    description: 'Proven strategies to keep your best people longer and reduce costly turnover.',
    points: 150,
    icon: Users,
    category: 'starter',
    isLocked: true
  },
  {
    id: 'ai-recruiter-kit',
    title: 'AI Recruiter Kit',
    description: 'Automate your recruiting with AI-driven workflows and tools.',
    points: 150,
    icon: Zap,
    category: 'starter',
    isLocked: true
  },
  {
    id: 'candidate-conversion-kit',
    title: 'Candidate Conversion Kit',
    description: 'Turn passive, high-quality candidates into interviews with these strategies and ready-to-use templates.',
    points: 150,
    icon: Target,
    category: 'starter',
    isLocked: true
  },
  {
    id: 'candidate-conversion-kit-agency',
    title: 'Candidate Conversion Kit\n(Agency Edition)',
    description: 'Make more placements with these strategies and ready-to-use templates.',
    points: 150,
    icon: Target,
    category: 'starter',
    isLocked: true
  },
  {
    id: 'cost-per-hire-calculator',
    title: 'Cost Per Hire Calculator',
    description: 'See your true cost per hire - and how you can save money and time.',
    points: 150,
    icon: Calculator,
    category: 'starter',
    isLocked: true
  },
  {
    id: 'infrastructure-build',
    title: 'Infrastructure Build',
    description: 'Get the complete playbook to set up a scalable, world-class recruiting operation from the ground up.',
    points: 1000,
    icon: Building,
    category: 'starter',
    isLocked: true
  },
  {
    id: 'outbound-pipelines',
    title: '100x Recruiter Stack',
    description: 'Build repeatable pipelines to consistently reach and convert top talent - without relying on job boards, referrals, or staffing firms.',
    points: 2500,
    icon: Users,
    category: 'enterprise',
    isLocked: true
  },
  {
    id: 'outbound-pipelines-agency',
    title: '100x Recruiter Stack\n(Agency Edition)',
    description: 'An agency-focused recruiting stack to cut costs, scale outreach, and make more placements.',
    points: 2500,
    icon: Users,
    category: 'enterprise',
    isLocked: true
  },
  {
    id: 'end-to-end-guide',
    title: 'End-to-End Recruiter Guide',
    description: 'Master modern recruiting with a complete playbook that covers every step - from sourcing to hire.',
    points: 5000,
    icon: BookOpen,
    category: 'enterprise',
    isLocked: true
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
  const currentPoints = 0; // This will be replaced with actual points from context later
  const { isAIGeneratorUnlocked } = useMarketplaceUnlock();

  // Update AI Generator lock status based on job submissions
  const updatedMarketplaceItems = marketplaceItems.map(item => {
    if (item.id === 'ai-message-generator') {
      return {
        ...item,
        isLocked: !isAIGeneratorUnlocked()
      };
    }
    return item;
  });

  // Separate AI Message Generator from other items
  const aiMessageGenerator = updatedMarketplaceItems.find(item => item.id === 'ai-message-generator');
  const otherItems = updatedMarketplaceItems.filter(item => item.id !== 'ai-message-generator');
  
  const groupedItems = otherItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MarketplaceItem[]>);

  const handleUnlock = (item: MarketplaceItem) => {
    // Navigate to AI Message Generator if it's unlocked
    if (item.id === 'ai-message-generator' && !item.isLocked) {
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
      'infrastructure-build': 'https://superrecruiterinfo.com/hiring-playbook'
    };

    const url = itemUrls[item.id];
    if (url) {
      window.open(url, '_blank');
    } else {
      // This will be implemented when the points system is ready
      console.log('Attempting to unlock:', item.title);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-shadowforce via-shadowforce-light to-shadowforce py-8">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Two Column Layout: Header/Points/How to Earn on Left, AI Generator on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          
          {/* Left Column: Header, Points, How to Earn */}
          <div className="flex flex-col">
            {/* Header */}
            <div className="text-left mb-8">
              <div className="flex items-center gap-6 mb-4">
                <h1 className="text-4xl font-bold text-white-knight font-jakarta leading-tight">
                  Superpowers
                </h1>
                <div className="inline-flex items-center gap-2 bg-supernova/20 border border-supernova px-4 py-2 rounded-lg">
                  <Star className="text-supernova" size={20} />
                  <span className="text-white-knight font-semibold text-sm">
                    Current Points: {currentPoints.toLocaleString()}
                  </span>
                </div>
              </div>
              <p className="text-xl text-guardian mb-6">
                Turn your activity into rewards - get premium hiring tools and resources just by using the platform
              </p>
            </div>

            {/* How to Earn Points Section */}
            <div className="flex-1 p-6 bg-shadowforce-light/30 border border-guardian/20 rounded-lg flex flex-col justify-center">
              <h2 className="text-2xl font-bold text-white-knight font-jakarta mb-4">
                How to Earn Points
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-supernova/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users size={24} className="text-supernova" />
                  </div>
                  <div>
                    <h3 className="text-white-knight">Enter Jobs</h3>
                    <p className="text-guardian text-sm">Earn points every time you post a job</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-supernova/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Target size={24} className="text-supernova" />
                  </div>
                  <div>
                    <h3 className="text-white-knight">Activity</h3>
                    <p className="text-guardian text-sm">Get rewarded for consistent platform use</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-supernova/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Star size={24} className="text-supernova" />
                  </div>
                  <div>
                    <h3 className="text-white-knight">Achievements</h3>
                    <p className="text-guardian text-sm">Unlock bonus points as you hit milestones</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Featured AI Message Generator */}
          {aiMessageGenerator && (
            <div className="flex flex-col">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-white-knight font-jakarta mb-2 leading-tight">
                  Featured Tool
                </h2>
              </div>
              
              <Card className="flex-1 relative overflow-hidden bg-gradient-to-br from-supernova/20 via-supernova/10 to-transparent border-2 border-supernova/50 shadow-2xl flex flex-col justify-center">
                {/* Animated background elements */}
                <div className="absolute inset-0 bg-gradient-to-r from-supernova/5 to-transparent"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-supernova/10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-supernova/10 rounded-full translate-y-12 -translate-x-12"></div>
                
                <div className="relative p-6 md:p-8">
                  <div className="text-center">
                      {/* Badge */}
                      <div className="mb-6">
                        <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500 px-3 py-1 rounded-full">
                          <Gift size={14} className="text-green-500" />
                          <span className="text-green-500 font-semibold text-sm">FREE TOOL</span>
                        </div>
                      </div>
                    
                    {/* Content */}
                    <div>
                      <h3 className="text-2xl font-bold text-white-knight font-jakarta mb-3">
                        AI Message Generator
                      </h3>
                      <p className="text-guardian mb-6 leading-relaxed">
                        Personalize your outreach in seconds - with messages that actually get replies. 
                
                      </p>
                      
                      {/* Action Button */}
                      <Button
                        onClick={() => handleUnlock(aiMessageGenerator)}
                        disabled={aiMessageGenerator.isLocked}
                        className={`px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 ${
                          aiMessageGenerator.isLocked 
                            ? 'bg-guardian/50 text-white-knight hover:bg-guardian/70 cursor-not-allowed'
                            : 'bg-supernova text-shadowforce hover:bg-supernova/90 shadow-lg hover:shadow-xl'
                        }`}
                      >
                        {aiMessageGenerator.isLocked ? (
                          <div className="flex items-center gap-3">
                            <Lock size={20} />
                            <span>Submit Your First Job to Unlock</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <Play size={20} />
                            <span>Start Creating Messages</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Categories */}
        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} className="mb-12">
            <h2 className="text-2xl font-bold text-white-knight font-jakarta mb-6 capitalize">
              {getCategoryLabel(category)}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => {
                const Icon = item.icon;
                const canAfford = typeof item.points === 'number' ? currentPoints >= item.points : true;
                
                return (
                  <Card key={item.id} className={`p-6 ${getCategoryColor(category)} border-2 flex flex-col h-full`}>
                    <div className="flex items-start gap-4 mb-4 flex-grow">
                      <div className="p-3 bg-shadowforce rounded-lg">
                        <Icon size={24} className="text-supernova" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white-knight font-jakarta mb-2 whitespace-pre-line">
                          {item.title}
                        </h3>
                        <p className="text-guardian text-sm">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Points/Unlock Condition */}
                    <div className="mb-4">
                      {item.points === 'FREE' ? (
                        <div className="flex items-center gap-2 mb-2">
                          <Gift size={16} className="text-green-500" />
                          <span className="text-green-500 font-semibold">FREE</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mb-2">
                          <Star size={16} className="text-supernova" />
                          <span className="text-white-knight font-semibold">
                            {item.points.toLocaleString()} Points
                          </span>
                        </div>
                      )}
                      
                      {item.unlockCondition && (
                        <p className="text-xs text-guardian italic">
                          {item.unlockCondition}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <Button
                        onClick={() => handleUnlock(item)}
                        disabled={item.isLocked && (typeof item.points === 'number' ? !canAfford : true)}
                        className={`w-full text-sm ${
                          item.isLocked 
                            ? (typeof item.points === 'number' && !canAfford)
                              ? 'bg-guardian/30 text-guardian cursor-not-allowed'
                              : 'bg-guardian/50 text-white-knight hover:bg-guardian/70'
                            : 'bg-supernova text-shadowforce hover:bg-supernova/90'
                        }`}
                      >
                        {item.isLocked ? (
                          <div className={`flex items-center gap-2 ${typeof item.points === 'number' && !canAfford ? 'justify-center' : ''}`}>
                            <Lock size={14} />
                            <span className="text-sm">
                              {typeof item.points === 'number' && !canAfford ? 'Insufficient Points' : 'Locked'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {item.id === 'ai-message-generator' ? (
                              <Play size={14} />
                            ) : (
                              <Download size={14} />
                            )}
                            <span className="text-sm">
                              {item.id === 'ai-message-generator' ? 'Use Now' : 
                               item.id === 'super-recruiter' ? 'Schedule My Strategy Session' : 'Download'}
                            </span>
                          </div>
                        )}
                      </Button>
                      
                      {item.points !== 'FREE' && (
                        <Button
                          onClick={() => handleUnlock(item)}
                          className="w-full bg-supernova text-shadowforce hover:bg-supernova/90 text-sm"
                        >
                          Buy Now
                        </Button>
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
