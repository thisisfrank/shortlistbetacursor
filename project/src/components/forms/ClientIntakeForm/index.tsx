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
  const { addJob } = useData(); // ✅ Removed addClient, updateClient - not needed
  const { user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState<FormStep>('company-info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
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
    candidatesRequested: ''
  });
  
  // Load form data from localStorage on component mount (simplified)
  useEffect(() => {
    const savedFormData = localStorage.getItem('clientIntakeFormData');
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData);
        setFormData(parsedData);
      } catch (error) {
        console.error('Error loading saved form data:', error);
        localStorage.removeItem('clientIntakeFormData');
      }
    }
  }, []);

  useEffect(() => {
    if (Object.values(formData).some(value => 
      Array.isArray(value) ? value.length > 0 : value.toString().trim()
    )) {
      localStorage.setItem('clientIntakeFormData', JSON.stringify(formData));
    }
  }, [formData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
    console.log('🎯 Form submission started for authenticated user...');
    console.log('👤 Current user email:', user?.email);
    console.log('📝 Form company:', formData.companyName);
    setIsSubmitting(true);
    
    try {
      // ✅ No need to create/find client - user already exists from auth
      // Just create the job directly linked to the authenticated user
      console.log('📋 Adding job for authenticated user...');
      
      const job = await addJob({
        // ✅ Use user ID directly from auth context (Job type expects clientId)
        clientId: user?.id || '', 
        companyName: formData.companyName,
        title: formData.title,
        description: formData.description,
        seniorityLevel: formData.seniorityLevel as any,
        workArrangement: formData.workArrangement as any,
        location: formData.location,
        salaryRangeMin: parseInt(formData.salaryRangeMin),
        salaryRangeMax: parseInt(formData.salaryRangeMax),
        keySellingPoints: formData.keySellingPoints,
        candidatesRequested: parseInt(formData.candidatesRequested)
      });
      
      console.log('✅ Job submitted successfully:', job);
      
      // ✅ No need to update client credits - using user-based system now
      
      // Move to confirmation step
      setCurrentStep('confirmation');
      
      // Clear saved form data after successful submission
      localStorage.removeItem('clientIntakeFormData');
    } catch (error) {
      console.error('💥 Error submitting form:', error);
      alert(`Submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      console.log('🏁 Form submission process complete');
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    // Clear localStorage when resetting
    localStorage.removeItem('clientIntakeFormData');
    
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
            onNext={goToNextStep}
            onBack={goToPreviousStep}
            onSellingPointsChange={handleSellingPointsChange}
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
          <ConfirmationStep
            onReset={resetForm}
            companyName={formData.companyName}
            jobTitle={formData.title}
          />
        )}
      </CardContent>
    </Card>
  );
};