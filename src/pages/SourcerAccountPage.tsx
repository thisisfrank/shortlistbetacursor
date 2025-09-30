import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { Users, Clock, Briefcase, Target, Check, LogOut, User, Edit3, Check as CheckIcon, X, Zap } from 'lucide-react';

export const SourcerAccountPage: React.FC = () => {
  const { userProfile, signOut, refreshProfile } = useAuth();
  const { jobs } = useData();
  const navigate = useNavigate();
  
  // Name editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(userProfile?.name || '');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState('');

  // Company editing state
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [company, setCompany] = useState(userProfile?.company || '');
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyError, setCompanyError] = useState('');

  // Update local state when userProfile changes
  React.useEffect(() => {
    setName(userProfile?.name || '');
    setCompany(userProfile?.company || '');
  }, [userProfile?.name, userProfile?.company]);

  // Calculate sourcer-specific stats
  const sourcerStats = React.useMemo(() => {
    if (!userProfile || !jobs) return null;
    
    const unclaimedCount = jobs.filter(job => job.status === 'Unclaimed').length;
    const claimedCount = jobs.filter(job => job.status === 'Claimed' && job.sourcerId === userProfile.id).length;
    const completedCount = jobs.filter(job => job.status === 'Completed' && job.sourcerId === userProfile.id).length;
    const myJobsCount = jobs.filter(job => job.sourcerId === userProfile.id).length;
    
    return {
      unclaimedCount,
      claimedCount,
      completedCount,
      myJobsCount
    };
  }, [userProfile, jobs]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSaveName = async () => {
    if (!userProfile || !name.trim()) return;
    
    setNameLoading(true);
    setNameError('');
    
    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ name: name.trim() })
        .eq('id', userProfile.id);
      
      if (updateError) {
        throw updateError;
      }
      
      setIsEditingName(false);
      
      // Refresh the profile to get updated data
      if (refreshProfile) {
        await refreshProfile();
      }
      
    } catch (err: any) {
      setNameError(err.message || 'Failed to update name');
    } finally {
      setNameLoading(false);
    }
  };

  const handleCancelName = () => {
    setName(userProfile?.name || '');
    setIsEditingName(false);
    setNameError('');
  };

  const handleEditName = () => {
    setIsEditingName(true);
    setNameError('');
  };

  const handleSaveCompany = async () => {
    if (!userProfile) return;
    
    setCompanyLoading(true);
    setCompanyError('');
    
    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ company: company.trim() || null })
        .eq('id', userProfile.id);
      
      if (updateError) {
        throw updateError;
      }
      
      setIsEditingCompany(false);
      
      // Refresh the profile to get updated data
      if (refreshProfile) {
        await refreshProfile();
      }
      
    } catch (err: any) {
      setCompanyError(err.message || 'Failed to update company');
    } finally {
      setCompanyLoading(false);
    }
  };

  const handleCancelCompany = () => {
    setCompany(userProfile?.company || '');
    setIsEditingCompany(false);
    setCompanyError('');
  };

  const handleEditCompany = () => {
    setIsEditingCompany(true);
    setCompanyError('');
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
          SOURCER PROFILE
        </h2>
        
        <div className="flex items-center gap-6 mb-8">
          <div className="bg-supernova rounded-full p-4">
            <Zap size={32} className="text-shadowforce" />
          </div>
          <div>
            <div className="space-y-4">
              {/* Name Field */}
              <div>
                <label className="block text-supernova text-sm font-semibold uppercase tracking-wide mb-2">
                  Name
                </label>
                <div className="flex items-center gap-3">
                  {!isEditingName ? (
                    <>
                      <h3 className="font-jakarta font-bold text-white-knight text-2xl">
                        {userProfile.name && userProfile.name.trim() !== '' 
                          ? userProfile.name 
                          : 'Complete Your Profile'}
                      </h3>
                      <button
                        onClick={handleEditName}
                        className="p-1 text-guardian hover:text-supernova transition-colors flex items-end"
                        title="Edit name"
                      >
                        <Edit3 size={16} />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="font-jakarta font-bold text-white-knight text-2xl bg-transparent border-b-2 border-supernova focus:outline-none focus:border-supernova-light"
                        placeholder="Enter your name"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveName}
                          disabled={!name.trim() || nameLoading}
                          className="p-1 bg-supernova text-shadowforce rounded text-sm font-semibold hover:bg-supernova-light disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Save name"
                        >
                          {nameLoading ? '...' : <CheckIcon size={16} />}
                        </button>
                        <button
                          onClick={handleCancelName}
                          className="p-1 bg-guardian/20 text-guardian rounded text-sm font-semibold hover:bg-guardian/30"
                          title="Cancel"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {nameError && (
                  <p className="text-red-400 text-sm mt-2">{nameError}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-supernova text-sm font-semibold uppercase tracking-wide mb-2">
                  Email
                </label>
                <p className="text-guardian text-lg">{userProfile.email}</p>
              </div>
              
              {/* Company Field */}
              <div>
                <label className="block text-supernova text-sm font-semibold uppercase tracking-wide mb-2">
                  Company
                </label>
                <div className="flex items-center gap-3">
                  {!isEditingCompany ? (
                    <>
                      <p className="text-guardian text-lg">
                        {userProfile.company && userProfile.company.trim() !== '' 
                          ? userProfile.company 
                          : 'No company specified'}
                      </p>
                      <button
                        onClick={handleEditCompany}
                        className="p-1 text-guardian hover:text-supernova transition-colors"
                        title="Edit company"
                      >
                        <Edit3 size={14} />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="text-guardian text-lg bg-transparent border-b-2 border-supernova focus:outline-none focus:border-supernova-light"
                        placeholder="Enter your company name"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveCompany}
                          disabled={companyLoading}
                          className="p-1 bg-supernova text-shadowforce rounded text-sm font-semibold hover:bg-supernova-light disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Save company"
                        >
                          {companyLoading ? '...' : <CheckIcon size={14} />}
                        </button>
                        <button
                          onClick={handleCancelCompany}
                          className="p-1 bg-guardian/20 text-guardian rounded text-sm font-semibold hover:bg-guardian/30"
                          title="Cancel"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {companyError && (
                  <p className="text-red-400 text-sm mt-2">{companyError}</p>
                )}
              </div>
            </div>
            
            <p className="text-supernova text-sm font-semibold uppercase tracking-wide mt-4">
            </p>
          </div>
        </div>
      </div>

      {/* Sourcer Statistics Section */}
      <div className="bg-shadowforce-light/30 rounded-xl p-8 border border-guardian/10 mb-12">
        <h2 className="font-anton text-2xl text-white-knight uppercase tracking-wide mb-8">
          SOURCER STATISTICS
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-supernova/20 to-supernova/10 border border-supernova/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-anton text-lg text-supernova uppercase tracking-wide">Available</h3>
                <p className="text-3xl font-anton text-white-knight">{sourcerStats?.unclaimedCount || 0}</p>
              </div>
              <Clock className="text-supernova" size={32} />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/10 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-anton text-lg text-blue-400 uppercase tracking-wide">In Progress</h3>
                <p className="text-3xl font-anton text-white-knight">{sourcerStats?.claimedCount || 0}</p>
              </div>
              <Target className="text-blue-400" size={32} />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500/20 to-green-500/10 border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-anton text-lg text-green-400 uppercase tracking-wide">Completed</h3>
                <p className="text-3xl font-anton text-white-knight">{sourcerStats?.completedCount || 0}</p>
              </div>
              <Check className="text-green-400" size={32} />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/10 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-anton text-lg text-purple-400 uppercase tracking-wide">My Jobs</h3>
                <p className="text-3xl font-anton text-white-knight">{sourcerStats?.myJobsCount || 0}</p>
              </div>
              <Users className="text-purple-400" size={32} />
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-shadowforce-light/50 rounded-xl p-6 border border-guardian/10">
          <h4 className="font-anton text-lg text-white-knight uppercase tracking-wide mb-4">
            PERFORMANCE SUMMARY
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-supernova mb-2">
                {sourcerStats?.completedCount || 0}
              </div>
              <div className="text-guardian text-sm">Jobs Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400 mb-2">
                {sourcerStats?.claimedCount || 0}
              </div>
              <div className="text-guardian text-sm">Currently Working</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400 mb-2">
                {sourcerStats?.myJobsCount > 0 ? Math.round((sourcerStats.completedCount / sourcerStats.myJobsCount) * 100) : 0}%
              </div>
              <div className="text-guardian text-sm">Completion Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-shadowforce-light/30 rounded-xl p-8 border border-guardian/10 mb-12">
        <h2 className="font-anton text-2xl text-white-knight uppercase tracking-wide mb-6">
          QUICK ACTIONS
        </h2>
        
        <div className="flex justify-center">
          <Button 
            onClick={() => navigate('/sourcer')}
            className="flex items-center justify-center gap-3 py-4 text-lg font-semibold bg-supernova text-shadowforce hover:bg-supernova-light glow-supernova"
          >
            <Briefcase size={20} />
            VIEW AVAILABLE JOBS
          </Button>
        </div>
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
