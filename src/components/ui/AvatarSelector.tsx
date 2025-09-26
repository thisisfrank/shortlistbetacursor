import React from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface AvatarSelectorProps {
  isOpen: boolean;
  currentAvatar?: string;
  onClose: () => void;
  onSelect: (avatar: string) => void;
}

// 20 different avatar options using emoji/unicode characters
const avatarOptions = [
  '👤', '👨', '👩', '🧑', '👴', '👵', '👱', '👨‍💼', '👩‍💼', '👨‍💻',
  '👩‍💻', '👨‍🎓', '👩‍🎓', '👨‍🔬', '👩‍🔬', '👨‍🎨', '👩‍🎨', '👨‍🚀', '👩‍🚀', '🤖'
];

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  isOpen,
  currentAvatar,
  onClose,
  onSelect
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-shadowforce border border-guardian/30 rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-anton text-white-knight uppercase tracking-wide">
            Choose Avatar
          </h3>
          <button
            onClick={onClose}
            className="text-guardian hover:text-white-knight transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="grid grid-cols-5 gap-3 mb-6">
          {avatarOptions.map((avatar, index) => (
            <button
              key={index}
              onClick={() => onSelect(avatar)}
              className={`
                w-12 h-12 rounded-full flex items-center justify-center text-2xl
                transition-all duration-200 hover:scale-110
                ${currentAvatar === avatar 
                  ? 'bg-supernova text-shadowforce ring-2 ring-supernova' 
                  : 'bg-shadowforce-light border border-guardian/30 hover:border-supernova/50'
                }
              `}
              title={`Avatar ${index + 1}`}
            >
              {avatar}
            </button>
          ))}
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-guardian hover:text-white-knight"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
