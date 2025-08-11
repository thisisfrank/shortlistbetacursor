import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getUserUsageStats } from '../utils/userUsageStats';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Users, Clock, Briefcase, Calendar, CreditCard, LogOut, Crown, User } from 'lucide-react';

export const AccountPage: React.FC = () => {
  const { userProfile, signOut } = useAuth();
  const { jobs, candidates, tiers, creditTransactions } = useData();
  const navigate = useNavigate();

  const stats = getUserUsageStats(userProfile as any, jobs, candidates, tiers, creditTransactions);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!userProfile) {
    return (
      <div className="p-8 text-center text-guardian">
        Loading account information...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Profile Information Section */}
      <div className="bg-shadowforce-light/30 rounded-xl p-8 border border-guardian/10 mb-8">
        <h2 className="font-anton text-2xl text-white-knight uppercase tracking-wide mb-6">
          PROFILE INFORMATION
        </h2>
        
        <div className="flex items-center gap-6 mb-8">
          <div className="bg-supernova rounded-full p-4">
            <User size={32} className="text-shadowforce" />
          </div>
          <div>
            <h3 className="font-jakarta font-bold text-white-knight text-2xl mb-1">
              {userProfile.companyName || userProfile.firstName || 'Client'}
            </h3>
            <p className="text-guardian text-lg">{userProfile.email}</p>
          </div>
        </div>

        {/* Current Plan Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-anton text-lg text-white-knight uppercase tracking-wide">
              CURRENT PLAN
            </h4>
            <Badge variant="outline" className="flex items-center gap-2 px-4 py-2">
              <Crown size={16} />
              <span className="font-semibold">{stats?.tierName || 'TIER 2'}</span>
            </Badge>
          </div>
          
          {stats?.creditsResetDate && (
            <div className="text-lg">
              <div className="flex justify-between">
                <span className="text-guardian">Next Reset:</span>
                <span className="text-white-knight font-semibold">
                  {new Date(stats.creditsResetDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-6">
          <Button 
            variant="secondary"
            size="lg"
            className="flex items-center justify-center gap-3 py-4 text-lg font-semibold"
          >
            <CreditCard size={20} />
            MANAGE CREDITS
          </Button>
          
          <Button 
            onClick={() => navigate('/subscription')}
            className="flex items-center justify-center gap-3 py-4 text-lg font-semibold bg-supernova text-shadowforce hover:bg-supernova-light glow-supernova"
          >
            <Crown size={20} />
            UPGRADE PLAN
          </Button>
        </div>
      </div>

      {/* Usage Statistics Section */}
      <div className="bg-shadowforce-light/30 rounded-xl p-8 border border-guardian/10 mb-12">
        <h2 className="font-anton text-2xl text-white-knight uppercase tracking-wide mb-8">
          USAGE STATISTICS
        </h2>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-shadowforce-light/50 rounded-xl p-6 border border-guardian/10">
            <div className="flex items-center gap-4 mb-4">
              <Briefcase size={24} className="text-supernova" />
              <span className="text-guardian text-lg font-semibold">Jobs This Month</span>
            </div>
            <div className="text-white-knight font-bold text-3xl">{stats?.jobsUsed || 2}</div>
          </div>
          
          <div className="bg-shadowforce-light/50 rounded-xl p-6 border border-guardian/10">
            <div className="flex items-center gap-4 mb-4">
              <Users size={24} className="text-supernova" />
              <span className="text-guardian text-lg font-semibold">Credits Used</span>
            </div>
            <div className="text-white-knight font-bold text-3xl">{stats?.candidatesUsed || 20}</div>
          </div>
          
          <div className="bg-shadowforce-light/50 rounded-xl p-6 border border-guardian/10">
            <div className="flex items-center gap-4 mb-4">
              <Clock size={24} className="text-supernova" />
              <span className="text-guardian text-lg font-semibold">Credits Left</span>
            </div>
            <div className="text-white-knight font-bold text-3xl">{stats?.candidatesRemaining || 130}</div>
          </div>
          
          <div className="bg-shadowforce-light/50 rounded-xl p-6 border border-guardian/10">
            <div className="flex items-center gap-4 mb-4">
              <Calendar size={24} className="text-supernova" />
              <span className="text-guardian text-lg font-semibold">Credits Limit</span>
            </div>
            <div className="text-white-knight font-bold text-3xl">{stats?.candidatesLimit || 150}</div>
          </div>
        </div>

        {/* Credit Usage Progress Bar */}
        {stats && stats.candidatesLimit > 0 && (
          <div className="bg-shadowforce-light/50 rounded-xl p-6 border border-guardian/10">
            <div className="flex items-center justify-end mb-4">
              <span className="text-white-knight text-lg font-semibold">
                {stats.candidatesUsed || 20} / {stats.candidatesLimit || 150}
              </span>
            </div>
            <div className="w-full bg-shadowforce rounded-full h-4">
              <div 
                className="bg-supernova h-4 rounded-full transition-all duration-300"
                style={{ width: `${((stats.candidatesUsed || 20) / (stats.candidatesLimit || 150)) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Sign Out Button - Bottom of Page */}
      <div className="flex justify-center">
        <Button 
          onClick={handleSignOut}
          variant="ghost"
          size="lg"
          className="flex items-center justify-center gap-3 py-4 text-lg"
        >
          <LogOut size={20} />
          SIGN OUT
        </Button>
      </div>
    </div>
  );
};
