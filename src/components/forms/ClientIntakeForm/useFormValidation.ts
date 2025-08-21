import { useCallback } from 'react';
import { FormData } from './ClientIntakeFormContext';

// Helper function to extract numeric value from formatted currency
const extractNumericValue = (formattedValue: string): number => {
  const numericString = formattedValue.replace(/[$,]/g, '');
  return parseInt(numericString) || 0;
};

export interface ValidationErrors {
  [key: string]: string;
}

export const useFormValidation = () => {
  const validateJobTitle = useCallback((formData: FormData): ValidationErrors => {
    const errors: ValidationErrors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Job title is required';
    }
    
    return errors;
  }, []);

  const validateJobDetails = useCallback((formData: FormData): ValidationErrors => {
    const errors: ValidationErrors = {};
    
    if (!formData.description.trim()) {
      errors.description = 'Job description is required';
    }
    
    if (!formData.seniorityLevel) {
      errors.seniorityLevel = 'Seniority level is required';
    }
    
    // Only validate city and state if not remote
    if (!formData.isRemote) {
      if (!formData.city.trim()) {
        errors.city = 'City is required';
      }
      
      if (!formData.state) {
        errors.state = 'State is required';
      }
    }
    
    if (!formData.salaryRangeMin) {
      errors.salaryRangeMin = 'Minimum salary is required';
    }
    
    if (!formData.salaryRangeMax) {
      errors.salaryRangeMax = 'Maximum salary is required';
    } else if (
      extractNumericValue(formData.salaryRangeMax) <= extractNumericValue(formData.salaryRangeMin)
    ) {
      errors.salaryRangeMax = 'Maximum salary must be greater than minimum salary';
    }
    
    if (formData.mustHaveSkills.length === 0) {
      errors.mustHaveSkills = 'At least one skill is required';
    } else if (formData.mustHaveSkills.length > 3) {
      errors.mustHaveSkills = 'No more than 3 skills allowed';
    }
    
    return errors;
  }, []);

  const validateCompanyInfo = useCallback((formData: FormData): ValidationErrors => {
    const errors: ValidationErrors = {};
    
    if (!formData.companyName.trim()) {
      errors.companyName = 'Company name is required';
    }
    
    if (!formData.contactName.trim()) {
      errors.contactName = 'Contact name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Phone is required';
    }
    
    return errors;
  }, []);

  return {
    validateJobTitle,
    validateJobDetails,
    validateCompanyInfo,
    extractNumericValue
  };
};
