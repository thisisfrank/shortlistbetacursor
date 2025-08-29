import React, { useState } from 'react';
import { ClientIntakeForm } from '../forms/ClientIntakeForm';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Clock, Brain, Filter, MessageCircle, X } from 'lucide-react';
import { FormStep } from '../../types';
import { Button } from '../ui/Button';
import { AlertModal } from '../ui/AlertModal';

export const JobSubmissionView: React.FC = () => {
  const { user, userProfile, loading } = useAuth();
  const [currentStep, setCurrentStep] = useState<FormStep>('job-title');
  const [generalFeedbackModal, setGeneralFeedbackModal] = useState<{
    isOpen: boolean;
    feedback: string;
    isSubmitting: boolean;
  }>({
    isOpen: false,
    feedback: '',
    isSubmitting: false
  });
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'warning' | 'error' | 'upgrade';
  }>({
    isOpen: false,
    title: '',
    message: ''
  });

  // General feedback handlers
  const handleOpenGeneralFeedbackModal = () => {
    setGeneralFeedbackModal({
      isOpen: true,
      feedback: '',
      isSubmitting: false
    });
  };

  const handleCloseGeneralFeedbackModal = () => {
    setGeneralFeedbackModal({
      isOpen: false,
      feedback: '',
      isSubmitting: false
    });
  };

  const handleGeneralFeedbackChange = (feedback: string) => {
    setGeneralFeedbackModal(prev => ({
      ...prev,
      feedback
    }));
  };

  const handleSubmitGeneralFeedback = async () => {
    if (!generalFeedbackModal.feedback.trim()) return;
    
    setGeneralFeedbackModal(prev => ({ ...prev, isSubmitting: true }));
    
    try {
      // Prepare general feedback data for webhook
      const feedbackData = {
        feedback: generalFeedbackModal.feedback.trim(),
        timestamp: new Date().toISOString(),
        user: {
          id: user?.id,
          email: user?.email,
          role: userProfile?.role,
          name: userProfile?.name
        },
        context: {
          currentStep: currentStep,
          page: 'job-submission'
        },
        feedbackType: 'general'
      };

      // Submit to general feedback webhook
      const response = await fetch('https://hook.us1.make.com/l0wxoj3wktjgswsskzjugpn6pkllezwp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData)
      });

      if (!response.ok) {
        throw new Error(`Webhook failed with status: ${response.status}`);
      }
      
      setAlertModal({
        isOpen: true,
        title: 'General Feedback Submitted',
        message: 'Thank you for your general feedback! We appreciate your input.',
        type: 'warning'
      });
      
      handleCloseGeneralFeedbackModal();
    } catch (error) {
      console.error('Error submitting general feedback:', error);
      setAlertModal({
        isOpen: true,
        title: 'Submission Failed',
        message: 'Failed to submit general feedback. Please try again.',
        type: 'error'
      });
    } finally {
      setGeneralFeedbackModal(prev => ({ ...prev, isSubmitting: false }));
    }
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
      
      {/* General Feedback Button - bottom of get candidates page */}
      <div className="py-8 px-4 bg-shadowforce">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="lg"
              onClick={handleOpenGeneralFeedbackModal}
              className="flex items-center gap-3 px-8 py-4 text-guardian hover:text-white-knight border-guardian/30 hover:border-supernova/50 transition-all duration-300"
            >
              <MessageCircle size={20} />
              SUBMIT GENERAL FEEDBACK
            </Button>
          </div>
          <p className="text-center text-guardian/60 text-sm mt-2 font-jakarta">
            Share your thoughts about the platform, job submission process, or overall experience
          </p>
        </div>
      </div>

      {/* General Feedback Modal */}
      {generalFeedbackModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-shadowforce border border-guardian/30 rounded-lg p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-anton text-white-knight uppercase tracking-wide">
                Submit General Feedback
              </h3>
              <button
                onClick={handleCloseGeneralFeedbackModal}
                className="text-guardian hover:text-white-knight transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-jakarta font-semibold text-supernova uppercase tracking-wide mb-3">
                Your Feedback
              </label>
              <textarea
                value={generalFeedbackModal.feedback}
                onChange={(e) => handleGeneralFeedbackChange(e.target.value)}
                placeholder="Please share your thoughts about the platform, suggestions for improvement, feature requests, or any other general feedback..."
                className="w-full p-4 bg-shadowforce-light border border-guardian/30 rounded-lg text-white-knight placeholder-guardian/60 focus:ring-supernova focus:border-supernova font-jakarta resize-vertical min-h-[120px]"
                rows={6}
              />
              <div className="mt-2 text-right">
                <span className={`text-xs font-jakarta ${
                  generalFeedbackModal.feedback.length > 1000 ? 'text-red-400' : 'text-guardian/60'
                }`}>
                  {generalFeedbackModal.feedback.length}/1000 characters
                </span>
              </div>
            </div>

            <div className="flex gap-4 justify-end">
              <Button
                variant="outline"
                size="lg"
                onClick={handleCloseGeneralFeedbackModal}
                disabled={generalFeedbackModal.isSubmitting}
                className="px-6"
              >
                CANCEL
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleSubmitGeneralFeedback}
                disabled={!generalFeedbackModal.feedback.trim() || generalFeedbackModal.isSubmitting || generalFeedbackModal.feedback.length > 1000}
                isLoading={generalFeedbackModal.isSubmitting}
                className="px-8 glow-supernova"
              >
                {generalFeedbackModal.isSubmitting ? 'SUBMITTING...' : 'SUBMIT GENERAL FEEDBACK'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
    </div>
  );
};