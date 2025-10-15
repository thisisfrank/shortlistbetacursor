import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { getUserUsageStats } from '../../../utils/userUsageStats';
import { ghlService } from '../../../services/ghlService';
import { formatJobDescription } from '../../../services/jobDescriptionService';
import { useClientIntakeForm } from './ClientIntakeFormContext';
import { useFormValidation } from './useFormValidation';
import { FormStep } from '../../../types';

interface UseFormSubmissionProps {
  setCurrentStep: (step: FormStep) => void;
}

export const useFormSubmission = ({ setCurrentStep }: UseFormSubmissionProps) => {
  const navigate = useNavigate();
  const { addJob, jobs, candidates, tiers, creditTransactions } = useData();
  const { user, userProfile } = useAuth();
  const { formData, setIsSubmitting, setAlertModal, resetForm } = useClientIntakeForm();
  const { extractNumericValue } = useFormValidation();

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Check candidate credit limits before submission (job limits removed)
      const stats = getUserUsageStats(userProfile as any, jobs, candidates, tiers, creditTransactions);
      const requestedCandidates = parseInt(formData.candidatesRequested) || 20;
      
      // Only check candidate limit, job submissions are now unlimited
      const candidateLimitReached = stats && stats.candidatesRemaining < requestedCandidates;
      
      if (candidateLimitReached) {
        setAlertModal({
          isOpen: true,
          title: 'Insufficient Candidate Credits',
          message: `You need ${requestedCandidates} candidate credit${requestedCandidates > 1 ? 's' : ''} but only have ${stats.candidatesRemaining} remaining. Upgrade your plan to get more candidate credits.`,
          type: 'upgrade',
          actionLabel: 'Upgrade Plan',
          onAction: () => navigate('/subscription')
        });
        return;
      }

      // Combine city and state into location for backend
      const location = formData.isRemote ? 'Remote' : `${formData.city}, ${formData.state}`;

      // Format the job description before submission
      let formattedDescription = formData.description;
      try {
        formattedDescription = await formatJobDescription({
          description: formData.description,
          title: formData.title,
          companyName: formData.companyName,
          seniorityLevel: formData.seniorityLevel
        });
        console.log('✅ Job description formatted successfully');
      } catch (error) {
        console.warn('⚠️ Job description formatting failed, using original:', error);
        // Continue with original description if formatting fails
      }

      // Create the job data to submit
      const jobData = {
        userId: user.id,
        companyName: formData.companyName,
        title: formData.title,
        idealCandidate: formData.idealCandidate,
        description: formattedDescription,
        seniorityLevel: formData.seniorityLevel as 'Junior' | 'Mid' | 'Senior' | 'Super Senior',
        location: location,
        salaryRangeMin: extractNumericValue(formData.salaryRangeMin),
        salaryRangeMax: extractNumericValue(formData.salaryRangeMax),
        mustHaveSkills: formData.mustHaveSkills,
        candidatesRequested: parseInt(formData.candidatesRequested)
      };
      
      // Use the actual DataContext addJob function
      const newJob = await addJob(jobData);
      
      // Save company name to user profile if not already set
      if (userProfile && formData.companyName && !userProfile.company) {
        try {
          const { supabase } = await import('../../../lib/supabase');
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ company: formData.companyName.trim() })
            .eq('id', user.id);
          
          if (updateError) {
            console.warn('⚠️ Failed to save company to user profile:', updateError);
          } else {
            console.log('✅ Company name saved to user profile:', formData.companyName);
          }
        } catch (error) {
          console.warn('⚠️ Error saving company to user profile:', error);
          // Don't fail the job submission if profile update fails
        }
      }
      
      // Send job submission confirmation to Go High Level webhook
      if (userProfile && newJob) {
        try {
          await ghlService.sendJobSubmissionConfirmation(newJob, userProfile);
          console.log('✅ Job submission confirmation sent to GHL');
        } catch (ghlError) {
          console.warn('⚠️ GHL Job Submission Confirmation webhook failed:', ghlError);
          // Don't fail the job submission if GHL webhook fails
        }
      }
      
      // Move to confirmation step
      setCurrentStep('confirmation');
    } catch (error) {
      setAlertModal({
        isOpen: true,
        title: 'Submission Failed',
        message: error instanceof Error ? error.message : 'An unknown error occurred. Please try again.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    user?.id,
    userProfile,
    formData,
    jobs,
    candidates,
    tiers,
    creditTransactions,
    addJob,
    setIsSubmitting,
    setAlertModal,
    setCurrentStep,
    navigate,
    extractNumericValue
  ]);

  const handleReset = useCallback(() => {
    resetForm();
    setCurrentStep('job-title');
  }, [resetForm, setCurrentStep]);

  return {
    handleSubmit,
    handleReset
  };
};
