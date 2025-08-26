import React, { useState } from 'react';
import { ClientIntakeForm } from '../forms/ClientIntakeForm';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Clock, Brain, Filter } from 'lucide-react';
import { FormStep } from '../../types';

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
      <div className="relative py-8 px-4 overflow-hidden bg-shadowforce">
        <div className="max-w-7xl mx-auto px-4">
          {/* Main Headline - Across the top */}
          {currentStep === 'job-title' && (
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-anton text-white-knight mb-4 uppercase tracking-wide">
                Get High-Quality Candidates – Fast
              </h2>
              <p className="text-base md:text-lg text-guardian mx-auto max-w-3xl font-jakarta leading-relaxed">
                Enter your job requirements and get top notch candidates without lifting a finger.
              </p>
            </div>
          )}

          {/* Form Layout */}
          <div className={currentStep === 'job-title' ? 'max-w-4xl mx-auto' : 'max-w-4xl mx-auto'}>
            <ClientIntakeForm currentStep={currentStep} setCurrentStep={setCurrentStep} />
          </div>
        </div>
      </div>
      
      {/* Features Section - Only show on first step */}
      {currentStep === 'job-title' && (
        <div className="py-4 px-4 bg-shadowforce">
          <div className="max-w-6xl mx-auto">

            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                             <div className="flex flex-col items-center p-8 bg-shadowforce/50 rounded-xl border border-guardian/20 hover:border-supernova/50 transition-colors">
                 <Clock className="text-supernova mb-4" size={32} />
                 <h3 className="font-anton text-xl text-white-knight mb-4">SAVE TIME</h3>
                 <p className="text-guardian font-jakarta text-center">No more unqualified resume piles. Get quality delivered straight to your inbox.</p>
               </div>
               
               <div className="flex flex-col items-center p-8 bg-shadowforce/50 rounded-xl border border-guardian/20 hover:border-supernova/50 transition-colors">
                 <Brain className="text-supernova mb-4" size={32} />
                 <h3 className="font-anton text-xl text-white-knight mb-4">HIRE SMARTER</h3>
                 <p className="text-guardian font-jakarta text-center">Every shortlist is filled with candidates who fit your opening and are actually worth your time.</p>
               </div>
               
               <div className="flex flex-col items-center p-8 bg-shadowforce/50 rounded-xl border border-guardian/20 hover:border-supernova/50 transition-colors">
                 <Filter className="text-supernova mb-4" size={32} />
                 <h3 className="font-anton text-xl text-white-knight mb-4">CUT THE NOISE</h3>
                 <p className="text-guardian font-jakarta text-center">Skip the AI-generated resumes – and get a shortlist of candidates you want to hire.</p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};