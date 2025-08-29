import { useCallback } from 'react';
import { FormStep } from '../../../types';
import { useClientIntakeForm } from './ClientIntakeFormContext';
import { useFormValidation } from './useFormValidation';

interface UseFormNavigationProps {
  currentStep: FormStep;
  setCurrentStep: (step: FormStep) => void;
}

export const useFormNavigation = ({ currentStep, setCurrentStep }: UseFormNavigationProps) => {
  const { formData, setErrors } = useClientIntakeForm();
  const { validateJobTitle, validateJobDetails } = useFormValidation();

  const goToNextStep = useCallback(() => {
    let validationErrors: Record<string, string> = {};
    let isValid = false;
    
    switch (currentStep) {
      case 'job-title':
        validationErrors = validateJobTitle(formData);
        isValid = Object.keys(validationErrors).length === 0;
        if (isValid) {
          setCurrentStep('job-details');
        }
        break;
        
      case 'job-details':
        validationErrors = validateJobDetails(formData);
        isValid = Object.keys(validationErrors).length === 0;
        if (isValid) {
          setCurrentStep('summary');
        }
        break;
        
      default:
        break;
    }
    
    setErrors(validationErrors);
    return isValid;
  }, [currentStep, formData, setCurrentStep, setErrors, validateJobTitle, validateJobDetails]);

  const goToPreviousStep = useCallback(() => {
    switch (currentStep) {
      case 'job-details':
        setCurrentStep('job-title');
        break;
        
      case 'summary':
        setCurrentStep('job-details');
        break;
        
      default:
        break;
    }
  }, [currentStep, setCurrentStep]);

  const goToStep = useCallback((step: FormStep) => {
    setCurrentStep(step);
  }, [setCurrentStep]);

  return {
    goToNextStep,
    goToPreviousStep,
    goToStep
  };
};
