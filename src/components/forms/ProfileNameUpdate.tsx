import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { FormInput } from './FormInput';
import { User, Check, Edit3 } from 'lucide-react';

export const ProfileNameUpdate: React.FC = () => {
  const { userProfile, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(userProfile?.name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!userProfile || !name.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ name: name.trim() })
        .eq('id', userProfile.id);
      
      if (updateError) {
        throw updateError;
      }
      
      setSuccess(true);
      setIsEditing(false);
      
      // Refresh the profile to get updated data
      if (refreshProfile) {
        await refreshProfile();
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (err: any) {
      setError(err.message || 'Failed to update name');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName(userProfile?.name || '');
    setIsEditing(false);
    setError('');
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError('');
    setSuccess(false);
  };

  // Don't show if user already has a proper name
  if (userProfile?.name && userProfile.name.trim() !== '') {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-6 mb-8">
      <div className="flex items-center gap-3 mb-4">
        <User size={24} className="text-amber-500" />
        <h3 className="font-anton text-lg text-white-knight uppercase tracking-wide">
          COMPLETE YOUR PROFILE
        </h3>
      </div>
      
      <p className="text-guardian mb-4">
        Please add your name to complete your profile setup.
      </p>

      {!isEditing ? (
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-guardian text-sm">Current name:</p>
            <p className="text-white-knight font-semibold">
              {userProfile?.name || 'Not set'}
            </p>
          </div>
          <Button
            onClick={handleEdit}
            variant="secondary"
            size="sm"
            className="flex items-center gap-2"
          >
            <Edit3 size={16} />
            {userProfile?.name ? 'Edit' : 'Add Name'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <FormInput
            label="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            required
          />
          
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
          
          {success && (
            <p className="text-green-400 text-sm flex items-center gap-2">
              <Check size={16} />
              Name updated successfully!
            </p>
          )}
          
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={!name.trim() || loading}
              size="sm"
              className="flex items-center gap-2"
            >
              {loading ? 'Saving...' : 'Save Name'}
            </Button>
            <Button
              onClick={handleCancel}
              variant="ghost"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
