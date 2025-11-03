import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface UseProfileEditReturn {
  // Name editing
  name: string;
  isEditingName: boolean;
  nameLoading: boolean;
  nameError: string;
  setName: (name: string) => void;
  handleEditName: () => void;
  handleSaveName: () => Promise<void>;
  handleCancelName: () => void;

  // Company editing
  company: string;
  isEditingCompany: boolean;
  companyLoading: boolean;
  companyError: string;
  setCompany: (company: string) => void;
  handleEditCompany: () => void;
  handleSaveCompany: () => Promise<void>;
  handleCancelCompany: () => void;

  // Avatar editing
  avatar: string;
  avatarLoading: boolean;
  handleSelectAvatar: (selectedAvatar: string) => Promise<void>;
}

export const useProfileEdit = (): UseProfileEditReturn => {
  const { userProfile, refreshProfile } = useAuth();

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
  const [avatar, setAvatar] = useState(userProfile?.avatar || '/avatars/avatar-1.png');
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Update local state when userProfile changes
  useEffect(() => {
    setName(userProfile?.name || '');
    setCompany(userProfile?.company || '');
    setAvatar(userProfile?.avatar || '/avatars/avatar-1.png');
  }, [userProfile?.name, userProfile?.company, userProfile?.avatar]);

  // Name editing handlers
  const handleEditName = () => {
    setIsEditingName(true);
    setNameError('');
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

  // Company editing handlers
  const handleEditCompany = () => {
    setIsEditingCompany(true);
    setCompanyError('');
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

  // Avatar editing handler
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
      
      // Refresh the profile to get updated data
      if (refreshProfile) {
        await refreshProfile();
      }
      
    } catch (err: any) {
      console.error('Failed to update avatar:', err.message);
    } finally {
      setAvatarLoading(false);
    }
  };

  return {
    // Name editing
    name,
    isEditingName,
    nameLoading,
    nameError,
    setName,
    handleEditName,
    handleSaveName,
    handleCancelName,

    // Company editing
    company,
    isEditingCompany,
    companyLoading,
    companyError,
    setCompany,
    handleEditCompany,
    handleSaveCompany,
    handleCancelCompany,

    // Avatar editing
    avatar,
    avatarLoading,
    handleSelectAvatar,
  };
};











