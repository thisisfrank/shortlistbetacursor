import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../ui/Card';
import { CompanyInfoStep } from './CompanyInfoStep';
import { JobDetailsStep } from './JobDetailsStep';
import { RequirementsStep } from './RequirementsStep';
import { SimpleSummaryStep } from './SimpleSummaryStep';
import { ConfirmationStep } from './ConfirmationStep';
import { FormStep } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';

export const ClientIntakeForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<FormStep>('company-info');
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
    location: '',
    salaryRangeMin: '',
    salaryRangeMax: '',
    keySellingPoints: [] as string[],
    candidatesRequested: '1'
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
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

  const validateJobDetails = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Job title is required';
    }
    
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
    
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    
    if (!formData.salaryRangeMin) {
      newErrors.salaryRangeMin = 'Minimum salary is required';
    }
    
    if (!formData.salaryRangeMax) {
      newErrors.salaryRangeMax = 'Maximum salary is required';
    } else if (
      parseInt(formData.salaryRangeMax) <= parseInt(formData.salaryRangeMin)
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
      case 'company-info':
        isValid = validateCompanyInfo();
        if (isValid) setCurrentStep('job-details');
        break;
        
      case 'job-details':
        isValid = validateJobDetails();
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
        setCurrentStep('company-info');
        break;
        
      case 'requirements':
        setCurrentStep('job-details');
        break;
        
      case 'summary':
        setCurrentStep('requirements');
        break;
        
      default:
        break;
    }
  };

  const handleSubmit = async () => {
    console.log('🎯 REAL job submission started...');
    setIsSubmitting(true);
    
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Create the job data to submit
      const jobData = {
        userId: user.id,
        companyName: formData.companyName,
        title: formData.title,
        description: formData.description,
        seniorityLevel: formData.seniorityLevel,
        workArrangement: formData.workArrangement,
        location: formData.location,
        salaryRangeMin: parseInt(formData.salaryRangeMin),
        salaryRangeMax: parseInt(formData.salaryRangeMax),
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
      location: '',
      salaryRangeMin: '',
      salaryRangeMax: '',
      keySellingPoints: [],
      candidatesRequested: '1'
    });
    setErrors({});
    setCurrentStep('company-info');
  };

  return (
    <Card className="max-w-4xl mx-auto glow-supernova">
      <CardContent className="py-12">
        {currentStep === 'company-info' && (
          <CompanyInfoStep
            formData={formData}
            onChange={handleInputChange}
            onNext={goToNextStep}
            errors={errors}
          />
        )}
        
        {currentStep === 'job-details' && (
          <JobDetailsStep
            formData={formData}
            onChange={handleInputChange}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
            errors={errors}
          />
        )}
        
        {currentStep === 'requirements' && (
          <RequirementsStep
            formData={formData}
            onChange={handleInputChange}
            onSellingPointsChange={handleSellingPointsChange}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
            errors={errors}
          />
        )}
        
        {currentStep === 'summary' && (
          <SimpleSummaryStep
            formData={formData}
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