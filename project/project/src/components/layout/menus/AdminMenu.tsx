import React from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Crown, LogOut } from 'lucide-react';

export const AdminMenu: React.FC = () => {
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
      <div className="mb-6 pb-4 border-b border-guardian/20 text-center flex flex-col items-center">
        <h3 className="font-anton text-lg text-white-knight uppercase tracking-wide">
          {user?.email?.split('@')[0] || 'Admin'}
        </h3>
        <p className="text-guardian font-jakarta text-sm">{user?.email}</p>
      </div>
      
      <div className="space-y-3 flex flex-col items-center">
        <Button 
          onClick={handleSignOut}
          variant="ghost"
          size="lg"
          fullWidth
          className="flex items-center gap-2 justify-center"
        >
          <LogOut className="mr-2" size={16} />
          SIGN OUT
        </Button>
      </div>
    </>
  );
};