import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { useProfileEdit } from '../hooks/useProfileEdit';
import { LogOut, User, Edit3, Check as CheckIcon, X } from 'lucide-react';

export const SourcerAccountPage: React.FC = () => {
  const { userProfile, signOut } = useAuth();
  
  // Use the profile editing hook (only need name and avatar for sourcers)
  const {
    name,
    isEditingName,
    nameLoading,
    nameError,
    setName,
    handleEditName,
    handleSaveName,
    handleCancelName,
    avatar,
    avatarLoading,
    handleSelectAvatar,
  } = useProfileEdit();

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
    <div className="max-w-4xl mx-auto p-8">
      {/* Profile Information Section */}
      <div className="bg-shadowforce-light/30 rounded-xl p-8 border border-guardian/10 mb-8">
        <h2 className="font-anton text-2xl text-white-knight uppercase tracking-wide mb-6">
          SOURCER PROFILE
        </h2>
        
        <div className="flex flex-col items-center gap-6">
          {/* Avatar Display and Selection */}
          <div className="w-full max-w-2xl">
            <div className="flex justify-center mb-6">
              <div className="bg-supernova rounded-full w-32 h-32 flex items-center justify-center overflow-hidden relative">
                {avatar?.startsWith('/avatars/') ? (
                  <img 
                    src={avatar} 
                    alt="User avatar" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = '<div class="text-5xl">👤</div>';
                    }}
                  />
                ) : avatar && avatar !== '👤' ? (
                  <span className="text-5xl">{avatar}</span>
                ) : (
                  <User size={48} className="text-shadowforce" />
                )}
                {avatarLoading && (
                  <div className="absolute inset-0 bg-supernova/80 rounded-full flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-2 border-shadowforce border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Avatar Selection Grid */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white-knight mb-3 text-center">Choose Your Avatar</h3>
              <div className="grid grid-cols-6 gap-3 max-h-[300px] overflow-y-auto p-2 bg-shadowforce/30 rounded-lg">
                {Array.from({ length: 60 }, (_, i) => `/avatars/avatar-${i + 1}.png`).map((avatarOption, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectAvatar(avatarOption)}
                    disabled={avatarLoading}
                    className={`
                      w-full aspect-square rounded-full flex items-center justify-center overflow-hidden
                      transition-all duration-200 hover:scale-110
                      ${avatar === avatarOption 
                        ? 'ring-4 ring-supernova' 
                        : 'border-2 border-guardian/30 hover:border-supernova/50'
                      }
                      ${avatarLoading ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    title={`Avatar ${index + 1}`}
                  >
                    <img 
                      src={avatarOption} 
                      alt={`Avatar ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = '👤';
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Profile Info */}
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
            </div>
          </div>
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
