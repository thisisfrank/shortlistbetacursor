import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';

export const SubscriptionSuccess: React.FC = () => {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [hasRefreshed, setHasRefreshed] = useState(false);

  useEffect(() => {
    // Only refresh once to avoid infinite loop
    if (!hasRefreshed) {
      const timer = setTimeout(() => {
        refreshProfile();
        setHasRefreshed(true);
      }, 3000); // 3 second delay to ensure webhook has processed

      return () => clearTimeout(timer);
    }
  }, [refreshProfile, hasRefreshed]);

  return (
    <div className="min-h-screen bg-shadowforce flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white-knight/10 border border-guardian/20 rounded-lg p-8 text-center">
        <CheckCircle className="mx-auto mb-4 text-green-500" size={64} />
        <h1 className="text-2xl font-anton text-white-knight mb-4">
          Subscription Activated!
        </h1>
        <p className="text-guardian mb-6 font-jakarta">
          Your subscription has been successfully activated. We're updating your account - this may take a few moments.
        </p>
        <Button
          onClick={() => navigate('/client')}
          size="lg"
          fullWidth
        >
          GO TO DASHBOARD
        </Button>
      </div>
    </div>
  );
};