import React from 'react';
import { ClientIntakeForm } from '../forms/ClientIntakeForm';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Sparkles, Target, Users, Zap } from 'lucide-react';
import BoltIcon from '../../assets/v2.png';

export const JobSubmissionView: React.FC = () => {
  const { user, userProfile, loading } = useAuth();

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
      {/* Hero Section */}
      <div className="relative py-20 px-4 overflow-hidden bg-shadowforce">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <img
                src={BoltIcon}
                alt="Lightning Bolt"
                className="animate-pulse"
                style={{ width: '200px', height: '94px', filter: 'drop-shadow(0 0 16px #FFD600)', objectFit: 'contain' }}
              />
              <div className="absolute inset-0 bg-supernova/30 blur-2xl"></div>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-anton text-white-knight mb-6 leading-tight">
            SUBMIT YOUR
            <span className="block text-supernova">
              JOB REQUEST
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-guardian max-w-3xl mx-auto mb-12 font-jakarta leading-relaxed">
            Welcome back! Submit your job requirements and our expert sourcers will deliver premium candidates in 
            <span className="text-supernova font-bold"> 24 hours or less</span>.
          </p>
          
          
          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="flex flex-col items-center p-6 bg-shadowforce-light/50 rounded-xl border border-guardian/20">
              <Target className="text-supernova mb-4" size={48} />
              <h3 className="font-anton text-xl text-white-knight mb-2">PRECISION TARGETING</h3>
              <p className="text-guardian font-jakarta text-center">AI-driven candidate matching for perfect role alignment</p>
            </div>
            
            <div className="flex flex-col items-center p-6 bg-shadowforce-light/50 rounded-xl border border-guardian/20">
              <Sparkles className="text-supernova mb-4" size={48} />
              <h3 className="font-anton text-xl text-white-knight mb-2">PREMIUM QUALITY</h3>
              <p className="text-guardian font-jakarta text-center">Hand-curated shortlists from top-tier talent pools</p>
            </div>
            
            <div className="flex flex-col items-center p-6 bg-shadowforce-light/50 rounded-xl border border-guardian/20">
              <Zap className="text-supernova mb-4" size={48} />
              <h3 className="font-anton text-xl text-white-knight mb-2">LIGHTNING FAST</h3>
              <p className="text-guardian font-jakarta text-center">Rapid delivery without compromising on quality</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Form Section */}
      <div className="pb-20 px-4 bg-shadowforce">
        <ClientIntakeForm />
      </div>
    </div>
  );
};