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
  
  const { addJob } = useData();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    title: '',
    description: '',
    seniorityLevel: '',
    workArrangement: '',
    city: '',
    state: '',
    isRemote: false,
    salaryRangeMin: '',
    salaryRangeMax: '',
    keySellingPoints: [] as string[],
    candidatesRequested: '1'
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    const fieldValue = type === 'checkbox' ? checked : value;
    setFormData({ ...formData, [name]: fieldValue });
    
    // Clear error for this field if it exists
    if (errors[name]) {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
  };

  const handleSellingPointsChange = (points: string[]) => {
    setFormData({ ...formData, keySellingPoints: points });
    
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
    
    if (!formData.workArrangement) {
      newErrors.workArrangement = 'Work arrangement is required';
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
    let isValid = false;
    
    switch (currentStep) {
      case 'job-title':
        isValid = validateJobTitle();
        if (isValid) setCurrentStep('job-details');
        break;
        
      case 'job-details':
        isValid = validateJobDetails();
        if (isValid) setCurrentStep('company-info');
        break;
        
      case 'company-info':
        isValid = validateCompanyInfo();
        if (isValid) setCurrentStep('requirements');
        break;
        
      case 'requirements':
        isValid = validateRequirements();
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
    console.log('🎯 REAL job submission started...');
    setIsSubmitting(true);
    
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
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
        workArrangement: formData.workArrangement,
        location: location,
        salaryRangeMin: extractNumericValue(formData.salaryRangeMin),
        salaryRangeMax: extractNumericValue(formData.salaryRangeMax),
        keySellingPoints: formData.keySellingPoints,
        candidatesRequested: parseInt(formData.candidatesRequested)
      };

      console.log('📋 REAL job data to submit:', jobData);
      
      // Use the actual DataContext addJob function
      const newJob = await addJob(jobData);
      
      console.log('✅ REAL job created successfully:', newJob);
      
      // Move to confirmation step
      setCurrentStep('confirmation');
    } catch (error) {
      console.error('💥 Error submitting REAL job:', error);
      alert(`Submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      console.log('🏁 REAL job submission process complete');
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      companyName: '',
      contactName: '',
      email: '',
      phone: '',
      title: '',
      description: '',
      seniorityLevel: '',
      workArrangement: '',
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
    <Card className="max-w-4xl mx-auto glow-supernova">
      <CardContent className="py-12">
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
              description: formData.description,
              seniorityLevel: formData.seniorityLevel,
              workArrangement: formData.workArrangement
            }}
            onChange={handleInputChange}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
            errors={errors}
          />
        )}
        
        {currentStep === 'company-info' && (
          <CompanyInfoStep
            formData={formData}
            onChange={handleInputChange}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
            errors={errors}
          />
        )}
        
        {currentStep === 'requirements' && (
          <RequirementsStep
            formData={{
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
              workArrangement: formData.workArrangement,
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
  );
};