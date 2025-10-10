import React, { useState } from 'react';
import { Lock, Clock, Download, Zap, Calculator, Building, Users, BookOpen, Target, ExternalLink, Bot, TrendingUp, Briefcase, Network, Award } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { useMarketplaceUnlock, MarketplaceItem } from '../hooks/useMarketplaceUnlock';
import { CandidateEmailsModal } from '../components/ui/CandidateEmailsModal';
import { OutreachTemplatesModal } from '../components/ui/OutreachTemplatesModal';
import { UnlockModal } from '../components/ui/UnlockModal';
import { useData } from '../context/DataContext';

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
    sequenceIndex: 0.5,
    icon: Download,
    category: 'free',
  },
  {
    id: 'super-recruiter',
    title: 'Convert Your List of Candidates into Real Interviews',
    description: 'Book your free call 15-minute discovery call',
    unlockDay: 10,
    sequenceIndex: 0.5,
    icon: Target,
    category: 'free',
  },
  {
    id: 'cost-per-hire-calculator',
    title: 'Cost Per Hire',
    description: 'See your true cost per hire - and how you can save money and time.',
    unlockDay: 15,
    sequenceIndex: 1,
    icon: Calculator,
    category: 'starter',
  },
  {
    id: 'ai-recruiter-kit',
    title: 'AI Tools',
    description: 'Automate your recruiting with AI-driven workflows and tools.',
    unlockDay: 15,
    sequenceIndex: 1,
    icon: Bot,
    category: 'starter',
  },
  {
    id: 'outreach-templates',
    title: 'Outreach Templates',
    description: 'Turn cold outreach into booked interviews (LinkedIn +email)',
    unlockDay: 15,
    sequenceIndex: 1,
    icon: Award,
    category: 'starter',
  },
  {
    id: 'employee-retention-kit',
    title: 'Retention',
    description: 'Proven strategies to keep your best people longer and reduce costly turnover.',
    unlockDay: 20,
    sequenceIndex: 2,
    icon: Award,
    category: 'starter',
  },
  {
    id: 'interview-kit',
    title: 'Interview Kit',
    description: 'Make the right hire, every time.',
    unlockDay: 20,
    sequenceIndex: 2,
    icon: Users,
    category: 'starter',
  },
  {
    id: 'candidate-scheduling-automation',
    title: 'Candidate Scheduling Automation',
    description: 'Improve your candidate experience while booking interviews on autopilot.',
    unlockDay: 20,
    sequenceIndex: 2,
    icon: Clock,
    category: 'starter',
  },
  {
    id: 'candidate-conversion-kit',
    title: 'Candidate Conversion Kit',
    description: 'Turn passive, high-quality candidates into interviews with these strategies and ready-to-use templates.',
    unlockDay: 25,
    sequenceIndex: 4,
    icon: Target,
    category: 'starter',
  },
  {
    id: 'candidate-conversion-kit-agency',
    title: 'Candidate Conversion Kit (Agency)',
    description: 'Make more placements with these strategies and ready-to-use templates.',
    unlockDay: 25,
    sequenceIndex: 4,
    icon: Briefcase,
    category: 'starter',
  },
  {
    id: 'infrastructure-build',
    title: 'Time Machine',
    description: 'A step-by-step guide to building your fully scalable outbound recruiting machine.',
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
    case 'starter': return 'Super Tools';
    case 'enterprise': return 'Advanced Recruiting Playbooks';
    default: return category;
  }
};

const getGradientBorderClass = () => {
  return 'relative before:absolute before:inset-0 before:rounded-xl before:p-[2px] before:bg-gradient-to-br before:[background:linear-gradient(40deg,#1a1a1a_0%,#FFD700_100%)] before:-z-10 rounded-xl [box-shadow:0_8px_20px_-6px_rgba(255,215,0,0.2),0_4px_12px_-3px_rgba(255,165,0,0.15)]';
};

export const MarketplacePage: React.FC = () => {
  const { 
    getUserPoints,
    isItemUnlocked
  } = useMarketplaceUnlock();
  
  const { unlockMarketplaceItem, isItemUnlockedInDB } = useData();

  const userPoints = getUserPoints();
  const [showEmailsModal, setShowEmailsModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [unlockingItem, setUnlockingItem] = useState<MarketplaceItem | null>(null);

  // Group items by category
  const allItems = marketplaceItems;
  
  const groupedItems = allItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MarketplaceItem[]>);

  const handleUnlockClick = (item: MarketplaceItem) => {
    // If already unlocked in DB, proceed with access
    if (isItemUnlockedInDB(item.id)) {
      handleAccess(item);
      return;
    }

    // If not unlocked but has enough points, show unlock modal
    if (isItemUnlocked(item)) {
      setUnlockingItem(item);
      return;
    }

    // Otherwise locked (shouldn't happen since button is disabled)
    console.log('Item is locked');
  };

  const handleAccess = (item: MarketplaceItem) => {

    // Navigate to AI Message Generator if it's unlocked
    if (item.id === 'ai-message-generator') {
      window.location.href = '/ai-message-generator';
      return;
    }

    // Show modal for Clay table emails
    if (item.id === 'clay-table-emails') {
      setShowEmailsModal(true);
      return;
    }

    // Show modal for Outreach Templates
    if (item.id === 'outreach-templates') {
      setShowTemplatesModal(true);
      return;
    }

    // Handle external links for marketplace items
    const itemUrls: Record<string, string> = {
      'cost-per-hire-calculator': 'https://superrecruiterresources.notion.site/Cost-Per-Hire-Calculation-Kit-2467773d39ea80ab9b84c6a99591ba9d?pvs=74',
      'ai-recruiter-kit': 'https://superrecruiterresources.notion.site/AI-Recruiting-Tools-2387773d39ea8041ae0ac722c76c47be?pvs=74',
      'employee-retention-kit': 'https://superrecruiterresources.notion.site/Employee-Retention-Guide-2467773d39ea80e99ea4e5b295658f10?pvs=74',
      'interview-kit': 'https://superrecruiterresources.notion.site/Evaluating-Interviewing-Candidates-2467773d39ea80bda8b6c2e09693a97e?pvs=74',
      'candidate-scheduling-automation': 'https://superrecruiterresources.notion.site/Candidate-Scheduling-Automation-2477773d39ea81139252c1cd7443f98d?pvs=74',
      'candidate-conversion-kit': 'https://superrecruiterresources.notion.site/?pvs=74',
      'candidate-conversion-kit-agency': 'https://superrecruiterresources.notion.site/Candidate-Conversion-Kit-Agency-Edition-2567773d39ea804fa10af5f0b1a75f02',
      'infrastructure-build': 'https://superrecruiterresources.notion.site/Outbound-Candidate-Funnel-Builder-2277773d39ea80519727d2463b9cc7b5?pvs=74',
      'end-to-end-guide': 'https://ultimatehiringplaybook.notion.site/?pvs=74',
      'outbound-pipelines': 'https://100xrecruiterstack.notion.site/100x-Recruiting-Stack-22d7773d39ea806882d5d5519f675bf6?pvs=74',
      'outbound-pipelines-agency': 'https://www.notion.so/100x-Recruiter-Stack-agency-edition-21b7773d39ea8005a2b4cca0652e3f1c',
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
          <p className="text-xl text-guardian mb-2">
            Unlock premium hiring tools and resources
          </p>
          <p className="text-sm text-guardian/80 mb-4">
            Earn XP: Create jobs (+50) • Daily bonus (+10/day)
          </p>
          <div className="flex justify-center gap-4">
            <div className="inline-flex items-center gap-2 bg-supernova/20 border border-supernova px-4 py-2 rounded-lg">
              <Zap className="text-supernova" size={20} />
              <span className="text-white-knight font-semibold text-sm">
                Level {userPoints}
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
              {items.map((item) => {
                const Icon = item.icon;
                const alreadyUnlocked = isItemUnlockedInDB(item.id);
                const hasEnoughPoints = isItemUnlocked(item);
                const canUnlock = hasEnoughPoints && !alreadyUnlocked;
                
                return (
                  <div key={item.id} className={getGradientBorderClass()}>
                    <Card 
                      className={`p-6 ${getCategoryColor(category)} flex flex-col h-full !border-0 ${
                        alreadyUnlocked ? 'ring-2 ring-supernova/50' : ''
                      }`}
                    >
                    <div className="flex items-start gap-4 mb-4 flex-grow">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white-knight font-jakarta mb-2 whitespace-pre-line">
                          {item.title}
                        </h3>
                        <p className="text-guardian text-sm mb-2">
                          {item.description}
                        </p>
                        {item.id === 'ai-message-generator' && (
                          <div className="inline-block">
                            <span className="text-xs font-bold text-shadowforce bg-supernova px-3 py-1 rounded-full">
                              FEATURED TOOL
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-3 rounded-lg bg-supernova/20">
                        <Icon size={24} className="text-supernova" />
                      </div>
                    </div>
                    
                    {/* Action area */}
                    <div className="pt-3 border-t border-guardian/20 space-y-2">
                      {/* Status indicator */}
                      {!hasEnoughPoints && (
                        <div className="flex items-center gap-2 text-supernova mb-2">
                          <Lock size={16} />
                          <span className="text-sm">
                            Requires Level {item.sequenceIndex * 100}
                          </span>
                        </div>
                      )}
                      {alreadyUnlocked ? (
                        <button 
                          onClick={() => handleUnlockClick(item)}
                          className="w-full text-supernova hover:text-supernova/80 text-sm font-medium flex items-center justify-center gap-2 transition-colors py-2"
                        >
                          <ExternalLink size={14} />
                          {item.id === 'super-recruiter' ? 'Book My Free Call' : 'Access Now'}
                        </button>
                      ) : canUnlock ? (
                        <button 
                          onClick={() => handleUnlockClick(item)}
                          className="w-full bg-supernova text-shadowforce hover:bg-supernova/90 text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                          {item.id === 'super-recruiter' ? 'Book My Free Meeting' : 'Unlock Now'}
                        </button>
                      ) : (
                        <button 
                          disabled
                          className="w-full bg-guardian/20 text-guardian/50 text-sm font-medium py-2 px-4 rounded-lg cursor-not-allowed"
                        >
                          Locked
                        </button>
                      )}
                    </div>
                  </Card>
                  </div>
                );
              })}
            </div>
          </div>
        ))}


      </div>

      {/* Candidate Emails Modal */}
      <CandidateEmailsModal 
        isOpen={showEmailsModal}
        onClose={() => setShowEmailsModal(false)}
      />

      {/* Outreach Templates Modal */}
      <OutreachTemplatesModal 
        isOpen={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
      />

      {/* Unlock Modal */}
      <UnlockModal 
        isOpen={unlockingItem !== null}
        onClose={() => setUnlockingItem(null)}
        item={unlockingItem}
        userPoints={userPoints}
        onUnlock={async () => {
          if (unlockingItem) {
            const success = await unlockMarketplaceItem(unlockingItem.id);
            if (success) {
              handleAccess(unlockingItem);
            }
          }
        }}
      />
    </div>
  );
};
