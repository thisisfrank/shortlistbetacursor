import React from 'react';
import { X, ExternalLink, Sparkles } from 'lucide-react';
import { MarketplaceItem } from '../../hooks/useMarketplaceUnlock';
import { Button } from './Button';

interface UnlockSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MarketplaceItem | null;
  onAccessLink: () => void;
}

export const UnlockSuccessModal: React.FC<UnlockSuccessModalProps> = ({
  isOpen,
  onClose,
  item,
  onAccessLink
}) => {
  if (!isOpen || !item) return null;

  const Icon = item.icon;

  const handleAccessClick = () => {
    onAccessLink();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-shadowforce/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative max-w-md w-full mx-4 bg-shadowforce-light rounded-xl shadow-2xl border border-supernova/30 transform transition-all duration-300 scale-100">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-guardian hover:text-white-knight transition-colors duration-200 z-10"
        >
          <X size={20} />
        </button>

        <div className="p-6">
          {/* Icon with celebration effect */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="p-4 bg-supernova/20 rounded-full">
                <Icon size={48} className="text-supernova" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Sparkles size={24} className="text-supernova animate-pulse" />
              </div>
              <div className="absolute inset-0 bg-supernova/30 blur-lg rounded-full"></div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-anton text-white-knight text-center mb-2 uppercase tracking-wide">
            Congratulations!
          </h2>

          {/* Unlock message */}
          <p className="text-guardian font-jakarta text-center text-lg mb-6">
            You've just unlocked <span className="text-supernova font-semibold">{item.title}</span>
          </p>

          {/* Access Button */}
          <Button
            variant="primary"
            onClick={handleAccessClick}
            className="w-full glow-supernova flex items-center justify-center gap-2 mb-4"
          >
            <ExternalLink size={18} />
            Access Now
          </Button>

          {/* Helper text */}
          <p className="text-guardian/80 text-sm text-center leading-relaxed">
            Click here to open a new window with your new unlockable content. Make sure you bookmark for later use.
          </p>
        </div>
      </div>
    </div>
  );
};


