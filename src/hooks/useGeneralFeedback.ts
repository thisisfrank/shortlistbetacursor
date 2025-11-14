import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ghlService } from '../services/ghlService';
import { supabase } from '../lib/supabase';
import { FeedbackFormData } from '../components/ui/GeneralFeedbackModal';

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

  const handleSubmitGeneralFeedback = async (formData?: FeedbackFormData) => {
    // Handle both old string format and new structured format
    const hasValidFeedback = formData 
      ? (formData.scaleRating !== null) 
      : generalFeedbackModal.feedback.trim();
    
    if (!hasValidFeedback) return;
    
    setGeneralFeedbackModal(prev => ({ ...prev, isSubmitting: true }));
    
    try {
      // Check if user has already claimed feedback bonus
      const { data: existingBonus, error: checkError } = await supabase
        .from('credit_transactions')
        .select('id')
        .eq('user_id', user?.id)
        .eq('description', 'Feedback bonus')
        .limit(1);

      if (checkError) {
        console.error('Error checking feedback bonus:', checkError);
        throw checkError;
      }

      const hasClaimedBonus = existingBonus && existingBonus.length > 0;

      // Prepare general feedback data for webhook
      const feedbackData = formData ? {
        // Structured feedback data
        feedbackData: {
          scaleRating: formData.scaleRating,
          leastFavorite: formData.leastFavorite,
          favoritePart: formData.favorite,
          futureNeeds: formData.futureNeeds,
          timeSaved: formData.timeSaved,
          mostValuableFeatures: formData.mostValuableFeature,
          otherFeature: formData.otherFeature || null,
          testimonialPermission: formData.testimonialPermission,
          testimonialText: formData.testimonialText || null
        },
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
        feedbackType: 'general',
        bonusGranted: !hasClaimedBonus
      } : {
        // Legacy string format
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
        feedbackType: 'general',
        bonusGranted: !hasClaimedBonus
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

      // Grant 50 credits if this is their first feedback submission
      if (!hasClaimedBonus && user?.id) {
        try {
          // Get current credits
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('available_credits')
            .eq('id', user.id)
            .single();

          if (profileError) throw profileError;

          const currentCredits = profileData?.available_credits || 0;
          const newCredits = currentCredits + 50;

          // Update user credits
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ available_credits: newCredits })
            .eq('id', user.id);

          if (updateError) throw updateError;

          // Record the credit transaction
          const { error: transactionError } = await supabase
            .from('credit_transactions')
            .insert({
              user_id: user.id,
              transaction_type: 'addition',
              amount: 50,
              description: 'Feedback bonus'
            });

          if (transactionError) throw transactionError;

          console.log('✅ 50 credits granted for feedback submission');

          setAlertModal({
            isOpen: true,
            title: 'Thank You!',
            message: 'Your feedback has been submitted!\n50 candidate credits have been added to your account.',
            type: 'success'
          });
        } catch (creditError) {
          console.error('❌ Error granting feedback bonus credits:', creditError);
          // Still show success for feedback submission even if credit grant fails
          setAlertModal({
            isOpen: true,
            title: 'Feedback Submitted',
            message: 'Thank you for your feedback! We appreciate your input.',
            type: 'warning'
          });
        }
      } else {
        // Already claimed bonus
        setAlertModal({
          isOpen: true,
          title: 'Feedback Submitted',
          message: hasClaimedBonus 
            ? 'Thank you for your feedback! (Note: The 50 credit bonus can only be claimed once per account)'
            : 'Thank you for your feedback! We appreciate your input.',
          type: 'warning'
        });
      }
      
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
