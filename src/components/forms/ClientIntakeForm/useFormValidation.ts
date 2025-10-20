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
      errors.title = 'Position title is required';
    }
    
    return errors;
  }, []);

  const validateJobDetails = useCallback((formData: FormData): ValidationErrors => {
    const errors: ValidationErrors = {};
    
    if (!formData.companyName.trim()) {
      errors.companyName = 'Company name is required';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Job description is required';
    }
    
    if (!formData.industry.trim()) {
      errors.industry = 'Industry is required';
    }
    
    if (!formData.seniorityLevel) {
      errors.seniorityLevel = 'Seniority level is required';
    }
    
    // Only validate location fields if not remote
    if (!formData.isRemote) {
      if (!formData.country?.trim()) {
        errors.country = 'Country is required';
      }
      
      if (!formData.city.trim()) {
        errors.city = 'City is required';
      }
      
      // State is only required for US
      if (formData.country === 'US' && !formData.state) {
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
    
    if (formData.mustHaveSkills.length < 3) {
      errors.mustHaveSkills = `${3 - formData.mustHaveSkills.length} more skill${3 - formData.mustHaveSkills.length > 1 ? 's' : ''} required`;
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
    

    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else {
      // Phone should be in format: +X XXXXXXXXXX
      const phoneRegex = /^\+\d{1,4}\s\d{5,15}$/;
      if (!phoneRegex.test(formData.phone)) {
        errors.phone = 'Please enter a valid phone number';
      }
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
