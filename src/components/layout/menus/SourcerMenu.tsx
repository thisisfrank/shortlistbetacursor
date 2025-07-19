import React from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { SourcerAlerts } from '../SourcerAlerts';
import { Button } from '../../ui/Button';
import { Briefcase, LogOut } from 'lucide-react';

export const SourcerMenu: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      // Let the Header's auto-navigation handle the redirect
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      <div className="mb-6 pb-4 border-b border-guardian/20">
        <h3 className="font-anton text-lg text-white-knight uppercase tracking-wide">
          Sourcer Portal
        </h3>
        <p className="text-guardian font-jakarta text-sm">{user?.email}</p>
      </div>
      
      <SourcerAlerts />
      
      <div className="space-y-3">
        <Button 
          onClick={handleSignOut}
          variant="ghost"
          size="lg"
          fullWidth
          className="flex items-center gap-2"
        >
          <LogOut className="mr-2" size={16} />
          SIGN OUT
        </Button>
      </div>
    </>
  );
};