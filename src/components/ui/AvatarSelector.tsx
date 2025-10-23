import React from 'react';
import { X } from 'lucide-react';

interface AvatarSelectorProps {
  isOpen: boolean;
  currentAvatar?: string;
  onClose: () => void;
  onSelect: (avatar: string) => void;
}

// 60 avatar image options - expecting avatar-1.png through avatar-60.png in public/avatars/
const avatarOptions = Array.from({ length: 60 }, (_, i) => `/avatars/avatar-${i + 1}.png`);

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  isOpen,
  currentAvatar,
  onClose,
  onSelect
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-shadowforce border border-guardian/30 rounded-lg p-6 max-w-4xl w-full my-8">
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
        
        <div className="grid grid-cols-10 gap-3 mb-6 p-8 overflow-visible">
          {avatarOptions.map((avatar, index) => (
            <button
              key={index}
              onClick={() => onSelect(avatar)}
               className={`
                 w-14 h-14 rounded-full flex items-center justify-center overflow-hidden
                 transition-all duration-200 hover:scale-200 hover:z-50
                 ${currentAvatar === avatar 
                   ? 'ring-2 ring-supernova' 
                   : 'border-2 border-guardian/30 hover:border-supernova/50'
                 }
               `}
              title={`Avatar ${index + 1}`}
            >
              <img 
                src={avatar} 
                alt={`Avatar ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to emoji if image doesn't exist
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '👤';
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
