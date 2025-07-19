import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Users, Clock, Briefcase, Calendar, CreditCard, LogOut, Crown } from 'lucide-react';

export const ClientMenu: React.FC = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      {/* COMPLETELY STATIC USER INFO */}
      <div className="mb-6 pb-4 border-b border-guardian/20">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-anton text-lg text-white-knight uppercase tracking-wide">
            STATIC USER
          </h3>
          <Badge variant="outline" className="text-xs">
            FREE
          </Badge>
        </div>
      </div>
      
      {/* STATIC SUBSCRIPTION */}
      <div className="mb-6">
        <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <CreditCard className="mr-2 text-orange-400" size={16} />
              <span className="text-sm font-jakarta font-semibold text-orange-400">
                Free Plan
              </span>
            </div>
          </div>
          <p className="text-guardian font-jakarta text-sm">
            Upgrade to unlock premium features
          </p>
        </div>
      </div>

      {/* STATIC CREDITS */}
      <div className="space-y-4 mb-6">
        <div className="bg-supernova/10 border border-supernova/30 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Users className="text-supernova mr-2" size={16} />
              <span className="text-sm font-jakarta font-semibold text-supernova">Available Credits</span>
            </div>
            <span className="text-lg font-anton text-white-knight">
              20
            </span>
          </div>
          <div className="w-full bg-shadowforce rounded-full h-2">
            <div 
              className="bg-supernova h-2 rounded-full transition-all duration-300"
              style={{ width: "100%" }}
            ></div>
          </div>
          <p className="text-xs text-guardian mt-1">
            of 20 monthly credits
          </p>
          <p className="text-xs text-guardian/60 mt-1">
            Used: 0 candidates
          </p>
        </div>
        
        <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Briefcase className="text-blue-400 mr-2" size={16} />
              <span className="text-sm font-jakarta font-semibold text-blue-400">Job Submissions</span>
            </div>
            <span className="text-lg font-anton text-white-knight">
              1
            </span>
          </div>
          <div className="w-full bg-shadowforce rounded-full h-2">
            <div 
              className="bg-blue-400 h-2 rounded-full transition-all duration-300"
              style={{ width: "100%" }}
            ></div>
          </div>
          <p className="text-xs text-guardian mt-1">
            of 1 monthly jobs
          </p>
          <p className="text-xs text-guardian/60 mt-1">
            Submitted: 0 jobs
          </p>
        </div>
        
        <div className="flex items-center text-sm text-guardian">
          <Calendar className="mr-2" size={14} />
          <span className="font-jakarta">
            Credits reset: Jan 30, 2025
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