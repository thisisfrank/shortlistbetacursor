import React, { useState } from 'react';
import { ClientIntakeForm } from '../forms/ClientIntakeForm';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Sparkles, Target, Users, Zap } from 'lucide-react';
import { FormStep } from '../../types';
import BoltIcon from '../../assets/v2.png';

export const JobSubmissionView: React.FC = () => {
  const { user, userProfile, loading } = useAuth();
  const [currentStep, setCurrentStep] = useState<FormStep>('job-title');

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-shadowforce flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-supernova mx-auto mb-4"></div>
          <p className="text-guardian font-jakarta">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect unauthenticated users to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect non-clients to their appropriate page
  if (userProfile && userProfile.role !== 'client') {
    switch (userProfile.role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'sourcer':
        return <Navigate to="/sourcer" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return (
    <div className="min-h-screen bg-shadowforce">
      {/* Hero Section - Conditional Layout */}
      <div className="relative py-20 px-4 overflow-hidden bg-shadowforce">
        <div className="max-w-7xl mx-auto px-4">
          <div className={currentStep === 'job-title' ? 'grid grid-cols-1 lg:grid-cols-5 gap-12 items-start' : 'max-w-4xl mx-auto'}>
            {currentStep === 'job-title' && (
              <div className="lg:col-span-2 order-2 lg:order-1">
                <div className="text-center lg:text-left">
                  <div className="flex justify-center lg:justify-start mb-12">
                    <div className="relative">
                      <img
                        src={BoltIcon}
                        alt="Lightning Bolt"
                        className="animate-pulse"
                        style={{ width: '150px', height: '70px', filter: 'drop-shadow(0 0 16px #FFD600)', objectFit: 'contain' }}
                      />
                      <div className="absolute inset-0 bg-supernova/30 blur-2xl"></div>
                    </div>
                  </div>
                  
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-anton text-white-knight mb-8 uppercase tracking-wide">
                    Get Premium Candidates Fast
                  </h2>
                  
                  <p className="text-base md:text-lg lg:text-xl text-guardian mx-auto lg:mx-0 mb-6 font-jakarta leading-relaxed">
                    Welcome!<br /><br />Submit your job requirements and get premium verified candidates in 
                    <span className="text-supernova font-bold"> 24 hours or less</span>.
                  </p>
                </div>
              </div>
            )}

            <div className={currentStep === 'job-title' ? 'lg:col-span-3 order-1 lg:order-2' : ''}>
              <ClientIntakeForm currentStep={currentStep} setCurrentStep={setCurrentStep} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section - Only show on first step */}
      {currentStep === 'job-title' && (
        <div className="py-20 px-4 bg-shadowforce">
          <div className="max-w-6xl mx-auto">

            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center p-8 bg-shadowforce/50 rounded-xl border border-guardian/20 hover:border-supernova/50 transition-colors">
                <Target className="text-supernova mb-6" size={48} />
                <h3 className="font-anton text-xl text-white-knight mb-4">PRECISION TARGETING</h3>
                <p className="text-guardian font-jakarta text-center">Advanced matching algorithms identify the perfect candidates for your specific requirements</p>
              </div>
              
              <div className="flex flex-col items-center p-8 bg-shadowforce/50 rounded-xl border border-guardian/20 hover:border-supernova/50 transition-colors">
                <Sparkles className="text-supernova mb-6" size={48} />
                <h3 className="font-anton text-xl text-white-knight mb-4">PREMIUM QUALITY</h3>
                <p className="text-guardian font-jakarta text-center">Hand-curated shortlists from top-tier talent pools with verified credentials</p>
              </div>
              
              <div className="flex flex-col items-center p-8 bg-shadowforce/50 rounded-xl border border-guardian/20 hover:border-supernova/50 transition-colors">
                <Zap className="text-supernova mb-6" size={48} />
                <h3 className="font-anton text-xl text-white-knight mb-4">LIGHTNING FAST</h3>
                <p className="text-guardian font-jakarta text-center">Rapid delivery without compromising on quality or thoroughness</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};