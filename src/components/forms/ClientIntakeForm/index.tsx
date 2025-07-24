import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../ui/Card';
import { JobTitleStep } from './JobTitleStep';
import { JobDetailsStep } from './JobDetailsStep';
import { CompanyInfoStep } from './CompanyInfoStep';
import { RequirementsStep } from './RequirementsStep';
import { SimpleSummaryStep } from './SimpleSummaryStep';
import { ConfirmationStep } from './ConfirmationStep';
import { FormStep } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { getUserUsageStats } from '../../../utils/userUsageStats';
import { AlertModal } from '../../ui/AlertModal';
import { useNavigate } from 'react-router-dom';

interface ClientIntakeFormProps {
  currentStep: FormStep;
  setCurrentStep: (step: FormStep) => void;
}

export const ClientIntakeForm: React.FC<ClientIntakeFormProps> = ({ 
  currentStep, 
  setCurrentStep 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'warning' | 'error' | 'upgrade';
    actionLabel?: string;
    onAction?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: ''
  });
  
  const { addJob, jobs, candidates, tiers, creditTransactions } = useData();
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    title: '',
    description: '',
    seniorityLevel: '',
    city: '',
    state: '',
    isRemote: false,
    salaryRangeMin: '',
    salaryRangeMax: '',
    keySellingPoints: [] as string[],
    candidatesRequested: '1'
  });

  // Debug step changes
  useEffect(() => {
    // console.log('🔍 Step changed to:', currentStep);
    // console.log('🔍 formData.title when step changed:', formData.title);
  }, [currentStep, formData.title]);
  
  // Debug component mounting
  useEffect(() => {
    // console.log('🔍 ClientIntakeForm mounted');
    return () => {
      // console.log('🔍 ClientIntakeForm unmounted');
    };
  }, []);
  
  // Wrap setFormData with debugging
  const setFormDataWithDebug = (newData: any) => {
    // console.log('🔍 setFormData called with:', newData);
    // console.log('🔍 Previous title:', formData.title);
    // console.log('🔍 New title:', newData.title);
    setFormData(newData);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    // console.log('🔍 Form input change:', { name, value: fieldValue, currentTitle: formData.title });
    
    setFormDataWithDebug({ ...formData, [name]: fieldValue });
    
    // Clear error for this field if it exists
    if (errors[name]) {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
  };

  const handleSellingPointsChange = (points: string[]) => {
    setFormDataWithDebug({ ...formData, keySellingPoints: points });
    
    // Clear error for this field if it exists
    if (errors.keySellingPoints) {
      const newErrors = { ...errors };
      delete newErrors.keySellingPoints;
      setErrors(newErrors);
    }
  };

  const validateCompanyInfo = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    
    if (!formData.contactName.trim()) {
      newErrors.contactName = 'Contact name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateJobTitle = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Job title is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateJobDetails = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.description.trim()) {
      newErrors.description = 'Job description is required';
    }
    
    if (!formData.seniorityLevel) {
      newErrors.seniorityLevel = 'Seniority level is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRequirements = () => {
    const newErrors: Record<string, string> = {};
    
    // Only validate city and state if not remote
    if (!formData.isRemote) {
      if (!formData.city.trim()) {
        newErrors.city = 'City is required';
      }
      
      if (!formData.state) {
        newErrors.state = 'State is required';
      }
    }
    
    if (!formData.salaryRangeMin) {
      newErrors.salaryRangeMin = 'Minimum salary is required';
    }
    
    if (!formData.salaryRangeMax) {
      newErrors.salaryRangeMax = 'Maximum salary is required';
    } else if (
      extractNumericValue(formData.salaryRangeMax) <= extractNumericValue(formData.salaryRangeMin)
    ) {
      newErrors.salaryRangeMax = 'Maximum salary must be greater than minimum salary';
    }
    
    if (formData.keySellingPoints.length === 0) {
      newErrors.keySellingPoints = 'At least one selling point is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goToNextStep = () => {
    // console.log('🔍 Before validation - current title:', formData.title);
    let isValid = false;
    
    switch (currentStep) {
      case 'job-title':
        isValid = validateJobTitle();
        // console.log('🔍 After job-title validation - title:', formData.title);
        if (isValid) setCurrentStep('job-details');
        break;
        
      case 'job-details':
        isValid = validateJobDetails();
        // console.log('🔍 After job-details validation - title:', formData.title);
        if (isValid) setCurrentStep('company-info');
        break;
        
      case 'company-info':
        isValid = validateCompanyInfo();
        // console.log('🔍 After company-info validation - title:', formData.title);
        if (isValid) setCurrentStep('requirements');
        break;
        
      case 'requirements':
        isValid = validateRequirements();
        // console.log('🔍 After requirements validation - title:', formData.title);
        if (isValid) setCurrentStep('summary');
        break;
        
      default:
        break;
    }
  };

  const goToPreviousStep = () => {
    switch (currentStep) {
      case 'job-details':
        setCurrentStep('job-title');
        break;
        
      case 'company-info':
        setCurrentStep('job-details');
        break;
        
      case 'requirements':
        setCurrentStep('company-info');
        break;
        
      case 'summary':
        setCurrentStep('requirements');
        break;
        
      default:
        break;
    }
  };

  // Helper function to extract numeric value from formatted currency
  const extractNumericValue = (formattedValue: string): number => {
    const numericString = formattedValue.replace(/[$,]/g, '');
    return parseInt(numericString) || 0;
  };

  const handleSubmit = async () => {
    // console.log('🎯 REAL job submission started...');
    // console.log('🔍 Complete form data at submission:', formData);
    setIsSubmitting(true);
    
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Check tier limits before submission
      const stats = getUserUsageStats(userProfile as any, jobs, candidates, tiers, creditTransactions);
      const requestedCandidates = parseInt(formData.candidatesRequested) || 1;
      
      // Check if either limit is reached and block submission
      const jobLimitReached = stats && stats.jobsRemaining <= 0;
      const candidateLimitReached = stats && stats.candidatesRemaining < requestedCandidates;
      
      if (jobLimitReached || candidateLimitReached) {
        let title = '';
        let message = '';
        
        if (jobLimitReached && candidateLimitReached) {
          title = 'Credit Limits Reached';
          message = `You have reached both your job limit (${stats.jobsLimit}) and don't have enough candidate credits (need ${requestedCandidates}, have ${stats.candidatesRemaining}). Upgrade your plan to continue submitting jobs.`;
        } else if (jobLimitReached) {
          title = 'Job Limit Reached';
          message = `You have reached your monthly limit of ${stats.jobsLimit} job${stats.jobsLimit > 1 ? 's' : ''}. Upgrade your plan to submit more jobs and unlock premium features.`;
        } else {
          title = 'Insufficient Candidate Credits';
          message = `You need ${requestedCandidates} candidate credit${requestedCandidates > 1 ? 's' : ''} but only have ${stats.candidatesRemaining} remaining. Upgrade your plan to get more candidate credits.`;
        }
        
        setAlertModal({
          isOpen: true,
          title,
          message,
          type: 'upgrade',
          actionLabel: 'Upgrade Plan',
          onAction: () => navigate('/subscription')
        });
        return;
      }

      // Combine city and state into location for backend
      const location = formData.isRemote ? 'Remote' : `${formData.city}, ${formData.state}`;

      // Create the job data to submit
      const jobData = {
        userId: user.id,
        companyName: formData.companyName,
        title: formData.title,
        description: formData.description,
        seniorityLevel: formData.seniorityLevel,
        location: location,
        salaryRangeMin: extractNumericValue(formData.salaryRangeMin),
        salaryRangeMax: extractNumericValue(formData.salaryRangeMax),
        keySellingPoints: formData.keySellingPoints,
        candidatesRequested: parseInt(formData.candidatesRequested)
      };

      // console.log('🔍 Form data title before job creation:', formData.title);
      // console.log('📋 REAL job data to submit:', jobData);
      
      // Use the actual DataContext addJob function
      const newJob = await addJob(jobData);
      
      // console.log('✅ REAL job created successfully:', newJob);
      
      // Move to confirmation step
      setCurrentStep('confirmation');
    } catch (error) {
      // console.error('💥 Error submitting REAL job:', error);
      setAlertModal({
        isOpen: true,
        title: 'Submission Failed',
        message: error instanceof Error ? error.message : 'An unknown error occurred. Please try again.',
        type: 'error'
      });
    } finally {
      // console.log('🏁 REAL job submission process complete');
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormDataWithDebug({
      companyName: '',
      contactName: '',
      email: '',
      phone: '',
      title: '',
      description: '',
      seniorityLevel: '',
      city: '',
      state: '',
      isRemote: false,
      salaryRangeMin: '',
      salaryRangeMax: '',
      keySellingPoints: [],
      candidatesRequested: '1'
    });
    setErrors({});
    setCurrentStep('job-title');
  };

  return (
    <>
    <Card className="max-w-4xl mx-auto glow-supernova">
      <CardContent className="py-12">
        {(() => {
          // console.log(`🔍 Rendering step: ${currentStep}, formData.title: "${formData.title}"`);
          return null;
        })()}
        
        {currentStep === 'job-title' && (
          <JobTitleStep
            formData={{
              title: formData.title
            }}
            onChange={handleInputChange}
            onNext={goToNextStep}
            errors={errors}
          />
        )}
        
        {currentStep === 'job-details' && (
          <JobDetailsStep
            formData={{
              title: formData.title,
              description: formData.description,
              seniorityLevel: formData.seniorityLevel
            }}
            onChange={handleInputChange}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
            errors={errors}
          />
        )}
        
        {currentStep === 'company-info' && (
          <CompanyInfoStep
            formData={{
              title: formData.title,
              companyName: formData.companyName,
              contactName: formData.contactName,
              email: formData.email,
              phone: formData.phone
            }}
            onChange={handleInputChange}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
            errors={errors}
          />
        )}
        
        {currentStep === 'requirements' && (
          <RequirementsStep
            formData={{
              title: formData.title,
              city: formData.city,
              state: formData.state,
              isRemote: formData.isRemote,
              salaryRangeMin: formData.salaryRangeMin,
              salaryRangeMax: formData.salaryRangeMax,
              keySellingPoints: formData.keySellingPoints,
              candidatesRequested: formData.candidatesRequested
            }}
            onChange={handleInputChange}
            onSellingPointsChange={handleSellingPointsChange}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
            errors={errors}
          />
        )}
        
        {currentStep === 'summary' && (
          <SimpleSummaryStep
            formData={{
              companyName: formData.companyName,
              contactName: formData.contactName,
              email: formData.email,
              phone: formData.phone,
              title: formData.title,
              description: formData.description,
              seniorityLevel: formData.seniorityLevel,
              city: formData.city,
              state: formData.state,
              isRemote: formData.isRemote,
              salaryRangeMin: formData.salaryRangeMin,
              salaryRangeMax: formData.salaryRangeMax,
              keySellingPoints: formData.keySellingPoints,
              candidatesRequested: formData.candidatesRequested
            }}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            onBack={goToPreviousStep}
            isSubmitting={isSubmitting}
          />
        )}
        
        {currentStep === 'confirmation' && (
          <ConfirmationStep onReset={resetForm} />
        )}
        
      </CardContent>
    </Card>

    <AlertModal
      isOpen={alertModal.isOpen}
      onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
      title={alertModal.title}
      message={alertModal.message}
      type={alertModal.type}
      actionLabel={alertModal.actionLabel}
      onAction={alertModal.onAction}
    />
  </>
  );
};