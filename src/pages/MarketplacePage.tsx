import React from 'react';
import { Lock, Star, Download, Gift, Zap, Calculator, Building, Users, BookOpen, Target } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

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

  // Create marketplace items with dynamic lock status
  const createMarketplaceItems = (): MarketplaceItem[] => [
  {
    id: 'ai-message-generator',
    title: 'AI Message Generator',
    description: 'Personalize your outreach in seconds - with messages that actually get replies.',
    points: 'FREE',
    unlockCondition: userProfile?.role === 'client' 
      ? hasSubmittedFirstJob() 
        ? 'Unlocked! You submitted your first job' 
        : `Submit your first job to unlock (${clientJobCount}/1 jobs submitted)`
      : 'Available for all users',
    icon: Zap,
    category: 'free',
    isLocked: userProfile?.role === 'client' ? !hasSubmittedFirstJob() : false
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
    id: 'bonus-candidates',
    title: 'Bonus 20 Candidates',
    description: 'Get an extra 20 FREE candidates on the house!',
    points: 'FREE',
    unlockCondition: 'Unlocked after your first purchase',
    icon: Gift,
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
    title: 'Candidate Conversion Kit (Agency Edition)',
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
    title: 'Outbound Candidate Pipelines That Scale',
    description: 'Build repeatable pipelines to consistently reach and convert top talent - without relying on job boards, referrals, or staffing firms.',
    points: 2500,
    icon: Users,
    category: 'enterprise',
    isLocked: true
  },
  {
    id: 'outbound-pipelines-agency',
    title: '100x Recruiter Stack (Agency Edition)',
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
  const { user, userProfile } = useAuth();
  const dataContext = useData();
  const currentPoints = 0; // This will be replaced with actual points from context later
  
  // Check if client has submitted their first job
  const hasSubmittedFirstJob = (): boolean => {
    if (!user || !userProfile || userProfile.role !== 'client') {
      return true; // Non-clients can access everything
    }
    const userJobs = dataContext.jobs.filter(job => job.userId === user.id);
    return userJobs.length > 0;
  };
  
  const clientJobCount = user && userProfile?.role === 'client' 
    ? dataContext.jobs.filter(job => job.userId === user.id).length 
    : 0;

  const marketplaceItems = createMarketplaceItems();
  const groupedItems = marketplaceItems.reduce((acc, item) => {
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
    } else if (item.id === 'ai-message-generator' && item.isLocked) {
      // Redirect to client page to encourage job submission
      window.location.href = '/client';
    } else {
      // This will be implemented when the points system is ready
      console.log('Attempting to unlock:', item.title);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-shadowforce via-shadowforce-light to-shadowforce py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white-knight font-jakarta mb-4">
            Marketplace
          </h1>
          <p className="text-xl text-guardian mb-6">
          Turn your activity into rewards - get premium hiring tools and resources just by using the platform
          </p>
          <div className="inline-flex items-center gap-2 bg-supernova/20 border border-supernova px-6 py-3 rounded-lg">
            <Star className="text-supernova" size={24} />
            <span className="text-white-knight font-semibold">
              Current Points: {currentPoints.toLocaleString()}
            </span>
          </div>
        </div>

        {/* AI Message Generator Status Banner for Clients */}
        {userProfile?.role === 'client' && (
          <>
            {!hasSubmittedFirstJob() ? (
              <div className="mb-8 p-6 bg-gradient-to-r from-supernova/10 to-orange-500/10 border border-supernova/30 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-supernova/20 rounded-lg">
                    <Zap className="text-supernova" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white-knight mb-2">
                      🎉 Unlock AI Message Generator
                    </h3>
                    <p className="text-guardian mb-3">
                      Submit your first job to unlock our AI-powered message generator and start crafting personalized outreach messages that get replies!
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-guardian">
                        Progress: {clientJobCount}/1 jobs submitted
                      </div>
                      <Button
                        onClick={() => window.location.href = '/client'}
                        className="bg-supernova hover:bg-supernova/90 text-shadowforce font-semibold px-4 py-2"
                        size="sm"
                      >
                        Submit Your First Job →
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-8 p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/20 rounded-lg">
                    <Gift className="text-green-500" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white-knight mb-2">
                      ✅ AI Message Generator Unlocked!
                    </h3>
                    <p className="text-guardian mb-3">
                      Congratulations! You've submitted {clientJobCount} job{clientJobCount !== 1 ? 's' : ''} and unlocked the AI Message Generator. Start creating personalized outreach messages now!
                    </p>
                    <Button
                      onClick={() => window.location.href = '/ai-message-generator'}
                      className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2"
                      size="sm"
                    >
                      Open AI Message Generator →
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* How to Earn Points Section */}
        <div className="mb-12 p-8 bg-shadowforce-light/30 border border-guardian/20 rounded-lg">
          <h2 className="text-2xl font-bold text-white-knight font-jakarta mb-4">
            How to Earn Points
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-supernova/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users size={24} className="text-supernova" />
              </div>
              <h3 className="text-white-knight mb-2">Enter Jobs</h3>
              <p className="text-guardian text-sm">Earn points every time you post a job</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-supernova/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Target size={24} className="text-supernova" />
              </div>
              <h3 className="text-white-knight mb-2">Activity</h3>
              <p className="text-guardian text-sm">Get rewarded for consistent platform use</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-supernova/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Star size={24} className="text-supernova" />
              </div>
              <h3 className="text-white-knight mb-2">Achievements</h3>
              <p className="text-guardian text-sm">Unlock bonus points as you hit milestones</p>
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
                        <h3 className="text-lg font-semibold text-white-knight font-jakarta mb-2">
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
                              {item.id === 'ai-message-generator' 
                                ? 'Submit First Job' 
                                : typeof item.points === 'number' && !canAfford 
                                  ? 'Insufficient Points' 
                                  : 'Locked'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Download size={14} />
                            <span className="text-sm">Download</span>
                          </div>
                        )}
                      </Button>
                      
                      {item.points !== 'FREE' && (
                        <Button
                          onClick={() => console.log('Buy now:', item.title)}
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
