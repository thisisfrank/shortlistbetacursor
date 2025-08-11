import React from 'react';
import { Lock, Star, Download, Gift, Zap, Calculator, Building, Users, BookOpen, Target } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  points: number | 'FREE';
  unlockCondition?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  category: 'free' | 'starter' | 'enterprise';
  isLocked: boolean;
}

const marketplaceItems: MarketplaceItem[] = [
  {
    id: 'ai-message-generator',
    title: 'AI Message Generator',
    description: 'Generate personalized outreach messages for candidates using AI',
    points: 'FREE',
    unlockCondition: 'Free with first job entry',
    icon: Zap,
    category: 'free',
    isLocked: true
  },
  {
    id: 'clay-table-emails',
    title: 'Clay Table To Get Emails',
    description: 'Advanced email discovery tool for candidate outreach',
    points: 'FREE',
    unlockCondition: 'Free with first purchase',
    icon: Download,
    category: 'free',
    isLocked: true
  },
  {
    id: 'bonus-candidates',
    title: 'Bonus 20 Candidates',
    description: 'Extra candidate credits to expand your talent pool',
    points: 'FREE',
    unlockCondition: 'After first purchase of more candidates',
    icon: Gift,
    category: 'free',
    isLocked: true
  },
  {
    id: 'employee-retention-kit',
    title: 'Employee Retention Kit',
    description: 'Comprehensive guide and tools for employee retention strategies',
    points: 150,
    icon: Users,
    category: 'starter',
    isLocked: true
  },
  {
    id: 'ai-recruiter-kit',
    title: 'AI Recruiter Kit',
    description: 'Advanced AI tools and templates for modern recruiting',
    points: 150,
    icon: Zap,
    category: 'starter',
    isLocked: true
  },
  {
    id: 'candidate-conversion-kit',
    title: 'Candidate Conversion Kit',
    description: 'Proven strategies to convert candidates into hires',
    points: 150,
    icon: Target,
    category: 'starter',
    isLocked: true
  },
  {
    id: 'candidate-conversion-kit-agency',
    title: 'Candidate Conversion Kit (Agency Edition)',
    description: 'Agency-specific strategies for candidate conversion',
    points: 150,
    icon: Target,
    category: 'starter',
    isLocked: true
  },
  {
    id: 'cost-per-hire-calculator',
    title: 'Cost Per Hire Calculator',
    description: 'Calculate and optimize your recruitment costs',
    points: 150,
    icon: Calculator,
    category: 'starter',
    isLocked: true
  },
  {
    id: 'infrastructure-build',
    title: 'Infrastructure Build',
    description: 'Complete recruitment infrastructure setup guide',
    points: 150,
    icon: Building,
    category: 'starter',
    isLocked: true
  },
  {
    id: 'outbound-pipelines',
    title: 'Outbound Candidate Pipelines That Scale',
    description: 'Scalable outbound recruiting pipeline strategies',
    points: 2500,
    icon: Users,
    category: 'enterprise',
    isLocked: true
  },
  {
    id: 'outbound-pipelines-agency',
    title: 'Outbound Candidate Pipelines That Scale (Agency Edition)',
    description: 'Agency-focused scalable outbound recruiting strategies',
    points: 2500,
    icon: Users,
    category: 'enterprise',
    isLocked: true
  },
  {
    id: 'end-to-end-guide',
    title: 'End To End Recruiter Guide',
    description: 'Complete comprehensive guide for modern recruitment',
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
    case 'starter': return 'Starter Tools';
    case 'enterprise': return 'Enterprise';
    default: return category;
  }
};

export const MarketplacePage: React.FC = () => {
  const currentPoints = 0; // This will be replaced with actual points from context later

  const groupedItems = marketplaceItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MarketplaceItem[]>);

  const handleUnlock = (item: MarketplaceItem) => {
    // This will be implemented when the points system is ready
    console.log('Attempting to unlock:', item.title);
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
            Unlock powerful tools and resources by earning points through platform usage
          </p>
          <div className="inline-flex items-center gap-2 bg-supernova/20 border border-supernova px-6 py-3 rounded-lg">
            <Star className="text-supernova" size={24} />
            <span className="text-white-knight font-semibold">
              Current Points: {currentPoints.toLocaleString()}
            </span>
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
                  <Card key={item.id} className={`p-6 ${getCategoryColor(category)} border-2`}>
                    <div className="flex items-start gap-4 mb-4">
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

                    {/* Action Button */}
                    <Button
                      onClick={() => handleUnlock(item)}
                      disabled={item.isLocked && (typeof item.points === 'number' ? !canAfford : true)}
                      className={`w-full ${
                        item.isLocked 
                          ? (typeof item.points === 'number' && !canAfford)
                            ? 'bg-guardian/30 text-guardian cursor-not-allowed'
                            : 'bg-guardian/50 text-white-knight hover:bg-guardian/70'
                          : 'bg-supernova text-shadowforce hover:bg-supernova/90'
                      }`}
                    >
                      {item.isLocked ? (
                        <div className="flex items-center gap-2">
                          <Lock size={16} />
                          {typeof item.points === 'number' && !canAfford ? 'Insufficient Points' : 'Locked'}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Download size={16} />
                          Download
                        </div>
                      )}
                    </Button>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

        {/* How to Earn Points Section */}
        <div className="mt-16 p-8 bg-shadowforce-light/30 border border-guardian/20 rounded-lg">
          <h2 className="text-2xl font-bold text-white-knight font-jakarta mb-4">
            How to Earn Points
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-supernova/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users size={24} className="text-supernova" />
              </div>
              <h3 className="font-semibold text-white-knight mb-2">Complete Jobs</h3>
              <p className="text-guardian text-sm">Earn points for every successful job completion</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-supernova/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Target size={24} className="text-supernova" />
              </div>
              <h3 className="font-semibold text-white-knight mb-2">Platform Activity</h3>
              <p className="text-guardian text-sm">Regular platform usage and engagement</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-supernova/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Star size={24} className="text-supernova" />
              </div>
              <h3 className="font-semibold text-white-knight mb-2">Achievements</h3>
              <p className="text-guardian text-sm">Unlock bonus points through milestones</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
