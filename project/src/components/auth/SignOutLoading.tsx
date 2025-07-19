import React from 'react';
import { Zap } from 'lucide-react';

export const SignOutLoading: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-shadowforce via-shadowforce-light to-shadowforce flex items-center justify-center px-4">
      <div className="text-center">
        <div className="flex justify-center mb-8">
          <div className="relative">
            <Zap size={64} className="text-supernova fill-current animate-pulse" />
            <div className="absolute inset-0 bg-supernova/30 blur-xl rounded-full"></div>
          </div>
        </div>
        
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-supernova mx-auto mb-6"></div>
        
        <h2 className="text-2xl font-anton text-white-knight uppercase tracking-wide mb-4">
          Signing Out
        </h2>
        
        <p className="text-guardian font-jakarta text-lg">
          Please wait while we securely log you out...
        </p>
      </div>
    </div>
  );
}; 