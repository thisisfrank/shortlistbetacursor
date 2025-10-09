import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ghlService } from '../services/ghlService';

interface GeneralFeedbackModal {
  isOpen: boolean;
  feedback: string;
  isSubmitting: boolean;
}

interface AlertModal {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'warning' | 'error' | 'upgrade';
}

export const useGeneralFeedback = (currentContext?: string) => {
  const { user, userProfile } = useAuth();
  
  const [generalFeedbackModal, setGeneralFeedbackModal] = useState<GeneralFeedbackModal>({
    isOpen: false,
    feedback: '',
    isSubmitting: false
  });
  
  const [alertModal, setAlertModal] = useState<AlertModal>({
    isOpen: false,
    title: '',
    message: ''
  });

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
          currentContext: currentContext || 'header',
          page: window.location.pathname
        },
        feedbackType: 'general'
      };

      // Submit to Make.com webhook (existing)
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

      // Also send to GHL for email automation (non-blocking)
      try {
        await ghlService.sendFeedbackSubmission(feedbackData);
      } catch (ghlError) {
        console.warn('⚠️ GHL feedback webhook failed (non-blocking):', ghlError);
      }
      
      setAlertModal({
        isOpen: true,
        title: 'Feedback Submitted',
        message: 'Thank you for your feedback! We appreciate your input.',
        type: 'warning'
      });
      
      handleCloseGeneralFeedbackModal();
    } catch (error) {
      console.error('Error submitting general feedback:', error);
      setAlertModal({
        isOpen: true,
        title: 'Submission Failed',
        message: 'Failed to submit feedback. Please try again.',
        type: 'error'
      });
    } finally {
      setGeneralFeedbackModal(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  return {
    generalFeedbackModal,
    alertModal,
    handleOpenGeneralFeedbackModal,
    handleCloseGeneralFeedbackModal,
    handleGeneralFeedbackChange,
    handleSubmitGeneralFeedback,
    setAlertModal
  };
};
