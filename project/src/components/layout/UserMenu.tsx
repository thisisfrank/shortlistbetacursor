import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminMenu } from './menus/AdminMenu';
import { ClientMenu } from './menus/ClientMenu';
import { SourcerMenu } from './menus/SourcerMenu';
import { AnonymousMenu } from './menus/AnonymousMenu';
import { User } from 'lucide-react';

export const UserMenu: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const handleMouseEnter = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    setIsOpen(true);
  };
  
  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setIsOpen(false);
    }, 300); // 300ms delay before closing
    setHoverTimeout(timeout);
  };
  
  const getMenuContent = () => {
    // During sign-out, user might be null but userProfile still exists briefly
    // Show anonymous menu immediately when user is null to prevent flickering
    if (!user) {
      return <AnonymousMenu />;
    }
    
    if (!userProfile) {
      return <AnonymousMenu />;
    }

    switch (userProfile.role) {
      case 'client':
        return <ClientMenu />;
      case 'sourcer':
        return <SourcerMenu />;
      case 'admin':
        return <AdminMenu />;
      default:
        return <ClientMenu />;
    }
  };
  
  return (
    <div className="relative">
      <button
        onMouseEnter={handleMouseEnter}
        className="flex items-center justify-center w-10 h-10 bg-supernova rounded-full hover:bg-supernova-light transition-colors duration-200 shadow-lg hover:shadow-xl"
      >
        <User size={20} className="text-shadowforce" />
      </button>
      
      {isOpen && (
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="absolute right-0 top-12 w-96 bg-shadowforce-light border border-guardian/20 rounded-xl shadow-2xl z-50 p-6 animate-fadeIn"
        >
          {getMenuContent()}
        </div>
      )}
    </div>
  );
};