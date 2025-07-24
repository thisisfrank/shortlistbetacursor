import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { getUserUsageStats } from '../../../utils/userUsageStats';
import { UserProfile } from '../../../types';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Users, Clock, Briefcase, Calendar, CreditCard, LogOut, Crown } from 'lucide-react';

export const ClientMenu: React.FC = () => {
  const { userProfile, signOut } = useAuth();
  const { jobs, candidates, tiers } = useData();
  const navigate = useNavigate();

  const stats = getUserUsageStats(userProfile as any, jobs, candidates, tiers);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!userProfile || !stats) {
    return (
      <div className="p-6 text-center text-guardian">
        Loading account stats...
      </div>
    );
  }

  return (
    <>
      {/* USER INFO */}
      <div className="mb-6 pb-4 border-b border-guardian/20">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-anton text-lg text-white-knight uppercase tracking-wide">
            {userProfile.email}
          </h3>
          <Badge variant="outline" className="text-xs">
            {stats.tierName}
          </Badge>
        </div>
      </div>
      {/* SUBSCRIPTION */}
      <div className="mb-6">
        <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <CreditCard className="mr-2 text-orange-400" size={16} />
              <span className="text-sm font-jakarta font-semibold text-orange-400">
                {stats.tierName} Plan
              </span>
            </div>
          </div>
          <p className="text-guardian font-jakarta text-sm">
            Upgrade to unlock premium features
          </p>
        </div>
      </div>
      {/* DYNAMIC CREDITS/JOBS */}
      <div className="space-y-4 mb-6">
        <div className="bg-supernova/10 border border-supernova/30 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Users className="text-supernova mr-2" size={16} />
              <span className="text-sm font-jakarta font-semibold text-supernova">Available Credits</span>
            </div>
            <span className="text-lg font-anton text-white-knight">
              {stats.candidatesRemaining}
            </span>
          </div>
          <div className="w-full bg-shadowforce rounded-full h-2">
            <div 
              className="bg-supernova h-2 rounded-full transition-all duration-300"
              style={{ width: `${(stats.candidatesRemaining / stats.candidatesLimit) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-guardian mt-1">
            of {stats.candidatesLimit} monthly credits
          </p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Briefcase className="text-blue-400 mr-2" size={16} />
              <span className="text-sm font-jakarta font-semibold text-blue-400">Job Submissions</span>
            </div>
            <span className="text-lg font-anton text-white-knight">
              {stats.jobsRemaining}
            </span>
          </div>
          <div className="w-full bg-shadowforce rounded-full h-2">
            <div 
              className="bg-blue-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(stats.jobsRemaining / stats.jobsLimit) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-guardian mt-1">
            of {stats.jobsLimit} monthly jobs
          </p>
        </div>
        <div className="flex items-center text-sm text-guardian">
          <Calendar className="mr-2" size={14} />
          <span className="font-jakarta">
            Credits reset: {stats.creditsResetDate ? new Date(stats.creditsResetDate).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </div>
      {/* ACTION BUTTONS */}
      <div className="space-y-3">
        <Button 
          onClick={() => navigate('/subscription')}
          variant="outline"
          size="lg"
          fullWidth
          className="flex items-center justify-center gap-2"
        >
          <Crown className="mr-2" size={16} />
          UPGRADE PLAN
        </Button>
        <Button 
          onClick={handleSignOut}
          variant="ghost"
          size="lg"
          fullWidth
          className="flex items-center justify-center gap-2"
        >
          <LogOut className="mr-2" size={16} />
          SIGN OUT
        </Button>
      </div>
    </>
  );
};