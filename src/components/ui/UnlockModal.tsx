import React, { useState } from 'react';
import { X, Zap, Lock, Unlock, Sparkles } from 'lucide-react';
import { MarketplaceItem } from '../../hooks/useMarketplaceUnlock';

interface UnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MarketplaceItem | null;
  userPoints: number;
  onUnlock: () => void;
}

export const UnlockModal: React.FC<UnlockModalProps> = ({ 
  isOpen, 
  onClose, 
  item, 
  userPoints,
  onUnlock 
}) => {
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  if (!isOpen || !item) return null;

  const Icon = item.icon;
  const requiredPoints = item.requiredLevel;
  const hasEnoughPoints = userPoints >= requiredPoints;

  const handleUnlock = () => {
    if (!hasEnoughPoints) return;
    
    setIsUnlocking(true);
    
    // Simulate unlock transaction
    setTimeout(() => {
      setIsUnlocking(false);
      setIsUnlocked(true);
      
      // After animation, trigger the actual unlock
      setTimeout(() => {
        onUnlock();
        handleClose();
      }, 1500);
    }, 1000);
  };

  const handleClose = () => {
    setIsUnlocking(false);
    setIsUnlocked(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-shadowforce border border-guardian/20 rounded-xl max-w-md w-full p-6 relative overflow-hidden">
        {/* Background animation */}
        {isUnlocking && (
          <div className="absolute inset-0 bg-gradient-to-br from-supernova/20 via-transparent to-supernova/20 animate-pulse" />
        )}
        
        {isUnlocked && (
          <div className="absolute inset-0 bg-gradient-to-br from-supernova/30 via-transparent to-supernova/30">
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="text-supernova animate-ping" size={60} />
            </div>
          </div>
        )}

        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-guardian hover:text-white-knight transition-colors z-10"
          disabled={isUnlocking}
        >
          <X size={20} />
        </button>

        <div className="relative z-10">
          {/* Icon - bigger and centered */}
          <div className="flex justify-center mb-6">
            <div className={`p-6 rounded-2xl transition-all duration-500 ${
              isUnlocked 
                ? 'bg-supernova/30 border-2 border-supernova scale-110' 
                : 'bg-supernova/10 border border-supernova/30'
            }`}>
              {isUnlocked ? (
                <Unlock size={64} className="text-supernova animate-bounce" />
              ) : (
                <Icon size={64} className={`text-supernova ${
                  isUnlocking ? 'animate-pulse' : ''
                }`} />
              )}
            </div>
          </div>

          {/* Title and Description */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white-knight font-jakarta mb-2">
              {isUnlocked ? 'Unlocked!' : item.title}
            </h2>
            <p className="text-guardian text-sm">
              {isUnlocked ? 'You now have access to this resource' : item.description}
            </p>
          </div>

          {/* XP Display */}
          {!isUnlocked && (
            <div className="bg-shadowforce-light border border-guardian/20 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="text-supernova" size={20} />
                  <span className="text-white-knight font-semibold">Your XP</span>
                </div>
                <span className="text-white-knight text-lg font-bold">XP {userPoints}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="text-supernova" size={20} />
                  <span className="text-guardian">Required</span>
                </div>
                <span className={`text-lg font-bold ${
                  hasEnoughPoints ? 'text-green-500' : 'text-red-500'
                }`}>
                  XP {requiredPoints}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!isUnlocked && (
            <div className="space-y-3">
              {hasEnoughPoints ? (
                <button
                  onClick={handleUnlock}
                  disabled={isUnlocking}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                    isUnlocking
                      ? 'bg-supernova/50 text-shadowforce cursor-wait'
                      : 'bg-supernova hover:bg-supernova/90 text-shadowforce'
                  }`}
                >
                  {isUnlocking ? (
                    <span className="flex items-center justify-center gap-2">
                      <Zap className="animate-spin" size={20} />
                      Unlocking...
                    </span>
                  ) : (
                    'Unlock Now'
                  )}
                </button>
              ) : (
                <div className="text-center py-3 px-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                  <p className="text-red-500 font-semibold">
                    Need {requiredPoints - userPoints} more XP
                  </p>
                  <p className="text-guardian text-sm mt-1">
                    Create jobs (+50 XP) • Daily bonus (+10 XP/day)
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

