import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Store } from 'lucide-react';

interface LeftPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const panelRef = useRef<HTMLDivElement>(null);

  const navigationItems = [
    {
      icon: User,
      label: 'Account',
      path: '/account',
      description: 'View your profile and usage stats'
    },
    {
      icon: Store,
      label: 'Marketplace',
      path: '/marketplace',
      description: 'Browse services and solutions'
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  // Handle click outside to close panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && panelRef.current && !panelRef.current.contains(event.target as Node)) {
        // Also check if the click is on the menu toggle button to avoid conflicts
        const target = event.target as HTMLElement;
        const isMenuButton = target.closest('[title="Toggle Navigation Menu"]');
        if (!isMenuButton) {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <div 
      ref={panelRef}
      className={`fixed left-0 top-20 h-[calc(100vh-5rem)] bg-shadowforce shadow-lg transition-all duration-300 z-40 ${
        isOpen ? 'w-80' : 'w-0'
      } overflow-hidden`}
    >
      {/* Navigation Menu */}
      <div className="w-80 p-6 h-full">
        <div className="space-y-3">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-4 p-4 rounded-lg transition-all duration-200 ${
                  active
                    ? 'bg-supernova text-shadowforce shadow-lg'
                    : 'bg-shadowforce-light/30 text-white-knight hover:bg-supernova/20 hover:text-supernova border border-guardian/10'
                }`}
              >
                <Icon size={20} className={active ? 'text-shadowforce' : 'text-supernova'} />
                <div className="flex-1 text-left">
                  <div className={`font-jakarta font-semibold ${active ? 'text-shadowforce' : 'text-white-knight'}`}>
                    {item.label}
                  </div>
                  <div className={`text-sm ${active ? 'text-shadowforce/70' : 'text-guardian'}`}>
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
