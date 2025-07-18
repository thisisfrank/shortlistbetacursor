import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../ui/Button';

export const AnonymousMenu: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="text-center space-y-3">
      <Button 
        onClick={() => navigate('/login')}
        size="lg"
        className="glow-supernova w-full"
      >
        SIGN IN
      </Button>
      
      <Button 
        onClick={() => navigate('/signup')}
        variant="outline"
        size="lg"
        className="w-full"
      >
        SIGN UP
      </Button>
    </div>
  );
};