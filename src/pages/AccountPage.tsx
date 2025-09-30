import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getUserUsageStats } from '../utils/userUsageStats';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { GeneralFeedbackModal } from '../components/ui/GeneralFeedbackModal';
import { AlertModal } from '../components/ui/AlertModal';
import { AvatarSelector } from '../components/ui/AvatarSelector';
import { useGeneralFeedback } from '../hooks/useGeneralFeedback';
import { supabase } from '../lib/supabase';
import { Users, Briefcase, CreditCard, LogOut, Crown, User, Edit3, Check, X, MessageCircle } from 'lucide-react';

export const AccountPage: React.FC = () => {
  const { userProfile, signOut, refreshProfile } = useAuth();
  const { jobs, candidates, tiers, creditTransactions } = useData();
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

  // Avatar editing state
  const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false);
  const [avatar, setAvatar] = useState(userProfile?.avatar || '👤');
  const [avatarLoading, setAvatarLoading] = useState(false);

  // General feedback functionality
  const {
    generalFeedbackModal,
    alertModal,
    handleOpenGeneralFeedbackModal,
    handleCloseGeneralFeedbackModal,
    handleGeneralFeedbackChange,
    handleSubmitGeneralFeedback,
    setAlertModal
  } = useGeneralFeedback('account');

  // Update local state when userProfile changes
  React.useEffect(() => {
    setName(userProfile?.name || '');
    setCompany(userProfile?.company || '');
    setAvatar(userProfile?.avatar || '👤');
  }, [userProfile?.name, userProfile?.company, userProfile?.avatar]);

  const stats = getUserUsageStats(userProfile as any, jobs, candidates, tiers, creditTransactions);

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

  const handleOpenAvatarSelector = () => {
    setIsAvatarSelectorOpen(true);
  };

  const handleCloseAvatarSelector = () => {
    setIsAvatarSelectorOpen(false);
  };

  const handleSelectAvatar = async (selectedAvatar: string) => {
    if (!userProfile) return;
    
    setAvatarLoading(true);
    
    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar: selectedAvatar })
        .eq('id', userProfile.id);
      
      if (updateError) {
        throw updateError;
      }
      
      setAvatar(selectedAvatar);
      setIsAvatarSelectorOpen(false);
      
      // Refresh the profile to get updated data
      if (refreshProfile) {
        await refreshProfile();
      }
      
    } catch (err: any) {
      console.error('Failed to update avatar:', err.message);
      // Could show an error message here if needed
    } finally {
      setAvatarLoading(false);
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
          <button
            onClick={handleOpenAvatarSelector}
            disabled={avatarLoading}
            className="bg-supernova rounded-full p-4 hover:bg-supernova-light transition-colors cursor-pointer group relative"
            title="Click to change avatar"
          >
            {avatar && avatar !== '👤' ? (
              <span className="text-3xl">{avatar}</span>
            ) : (
              <User size={32} className="text-shadowforce" />
            )}
            {avatarLoading && (
              <div className="absolute inset-0 bg-supernova/80 rounded-full flex items-center justify-center">
                <div className="animate-spin w-6 h-6 border-2 border-shadowforce border-t-transparent rounded-full"></div>
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Edit3 size={16} className="text-white" />
            </div>
          </button>
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
                          {nameLoading ? '...' : <Check size={16} />}
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
                          {companyLoading ? '...' : <Check size={14} />}
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
          </div>
        </div>

        {/* Current Plan Section */}
        <div className="mb-8">
          <h4 className="font-anton text-lg text-white-knight uppercase tracking-wide mb-4">
            CURRENT PLAN
          </h4>
          
          <div className="bg-shadowforce-light/50 rounded-xl p-6 border border-guardian/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-supernova rounded-full p-2">
                  <Crown size={20} className="text-shadowforce" />
                </div>
                <div>
                  <div className="font-anton text-xl text-white-knight uppercase tracking-wide">
                    {stats?.tierName || 'TIER 2'}
                  </div>
                  <div className="text-guardian text-sm">
                    Active Subscription Plan
                  </div>
                </div>
              </div>
              
              <Badge variant="outline" className="bg-supernova/20 border-supernova text-supernova px-4 py-2 font-semibold">
                ACTIVE
              </Badge>
            </div>
            
            {stats?.creditsResetDate && stats?.tierName !== 'Free' && (
              <div className="pt-4 border-t border-guardian/20">
                <div className="flex items-center justify-between">
                  <span className="text-guardian font-medium">Next Credit Reset:</span>
                  <span className="text-white-knight font-semibold text-lg">
                    {new Date(stats.creditsResetDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            )}
            
            {stats?.tierName === 'Free' && (
              <div className="pt-4 border-t border-guardian/20">
                <div className="flex items-center justify-between">
                  <span className="text-guardian font-medium">Credit Type:</span>
                  <span className="text-white-knight font-semibold text-lg">
                    One-time allocation
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-6">
          <Button 
            onClick={handleOpenGeneralFeedbackModal}
            variant="outline"
            size="lg"
            className="flex items-center justify-center gap-3 py-4 text-lg text-guardian hover:text-white-knight border-guardian/30 hover:border-supernova/50 transition-all duration-300"
          >
            <MessageCircle size={20} />
            SUBMIT FEEDBACK
          </Button>
          
          <Button 
            onClick={() => navigate('/subscription')}
            className="flex items-center justify-center gap-3 py-4 text-lg font-semibold bg-supernova text-shadowforce hover:bg-supernova-light glow-supernova"
          >
            <Crown size={20} />
            GET MORE CANDIDATES
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
              <Users size={24} className="text-supernova" />
              <span className="text-guardian text-lg font-semibold">Total Candidates Sourced</span>
            </div>
            <div className="text-white-knight font-bold text-3xl">{stats?.totalCandidatesSourced || 0}</div>
          </div>
          
          <div className="bg-shadowforce-light/50 rounded-xl p-6 border border-guardian/10">
            <div className="flex items-center gap-4 mb-4">
              <Users size={24} className="text-supernova" />
              <span className="text-guardian text-lg font-semibold">Candidates Sourced This Month</span>
            </div>
            <div className="text-white-knight font-bold text-3xl">{stats?.candidatesSourcedThisMonth || 0}</div>
          </div>
          
          <div className="bg-shadowforce-light/50 rounded-xl p-6 border border-guardian/10">
            <div className="flex items-center gap-4 mb-4">
              <Briefcase size={24} className="text-supernova" />
              <span className="text-guardian text-lg font-semibold">Total Jobs</span>
            </div>
            <div className="text-white-knight font-bold text-3xl">{stats?.totalJobs || 0}</div>
          </div>
          
          <div className="bg-shadowforce-light/50 rounded-xl p-6 border border-guardian/10">
            <div className="flex items-center gap-4 mb-4">
              <Briefcase size={24} className="text-supernova" />
              <span className="text-guardian text-lg font-semibold">Jobs This Month</span>
            </div>
            <div className="text-white-knight font-bold text-3xl">{stats?.jobsThisMonth || 0}</div>
          </div>
        </div>


        {/* Credit Usage Progress Bar */}
        {stats && stats.candidatesLimit > 0 && (
          <div className="bg-shadowforce-light/50 rounded-xl p-6 border border-guardian/10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-guardian text-lg font-semibold">Candidates Remaining this Month</span>
              <span className="text-white-knight text-lg font-semibold">
                {stats.candidatesUsed || 20}
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

        {/* Manage Credits Button */}
        <div className="flex justify-center mt-6">
          <Button 
            variant="secondary"
            size="lg"
            className="flex items-center justify-center gap-3 py-4 text-lg font-semibold"
            onClick={() => window.open('https://billing.stripe.com/p/login/test_fZu7sLaoK9lN1oRfap9R600', '_blank')}
          >
            <CreditCard size={20} />
            MANAGE CREDITS
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

      {/* General Feedback Modal */}
      <GeneralFeedbackModal
        isOpen={generalFeedbackModal.isOpen}
        onClose={handleCloseGeneralFeedbackModal}
        feedback={generalFeedbackModal.feedback}
        isSubmitting={generalFeedbackModal.isSubmitting}
        onFeedbackChange={handleGeneralFeedbackChange}
        onSubmit={handleSubmitGeneralFeedback}
      />

      {/* Alert Modal */}
      {alertModal.isOpen && (
        <AlertModal
          isOpen={alertModal.isOpen}
          onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
          title={alertModal.title}
          message={alertModal.message}
          type={alertModal.type}
        />
      )}

      {/* Avatar Selector Modal */}
      <AvatarSelector
        isOpen={isAvatarSelectorOpen}
        currentAvatar={avatar}
        onClose={handleCloseAvatarSelector}
        onSelect={handleSelectAvatar}
      />
    </div>
  );
};
