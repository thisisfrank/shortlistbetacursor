import React, { useState } from 'react';
import { ClientIntakeForm } from '../forms/ClientIntakeForm';
import { useAuth } from '../../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { FormStep } from '../../types';
import { Button } from '../ui/Button';

export const JobSubmissionView: React.FC = () => {
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<FormStep>('job-title');

  const handleGetMoreCandidates = () => {
    navigate('/subscription');
  };


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
    <div className="bg-shadowforce flex items-center justify-center min-h-[calc(100vh-200px)]">
      {/* Hero Section - Conditional Layout */}
      <div className="relative py-8 px-4 overflow-hidden bg-shadowforce w-full">
        <div className="max-w-7xl mx-auto px-4">
          {/* Main Headline - Across the top */}
          {currentStep === 'job-title' && (
            <div className="text-center mb-6 md:mb-8 mt-8 md:mt-16">
              <h2 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-anton text-white-knight mb-4 uppercase tracking-wide px-4">
                Get High-Quality Candidates – Fast
              </h2>
            </div>
          )}

          {/* Form Layout */}
          <div className={currentStep === 'job-title' ? 'max-w-2xl mx-auto' : 'max-w-2xl mx-auto'}>
            <ClientIntakeForm currentStep={currentStep} setCurrentStep={setCurrentStep} />
          </div>

          {/* Get More Candidates Button - Only show on job-title step - Moved much further down */}
          {currentStep === 'job-title' && (
            <div className="mt-8 md:mt-12 mb-2 flex justify-center px-4">
              <Button 
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGetMoreCandidates}
                className="text-supernova border-supernova hover:bg-supernova hover:text-shadowforce w-full sm:w-auto"
              >
                GET MORE CANDIDATES
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};