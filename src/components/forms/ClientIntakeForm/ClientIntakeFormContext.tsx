import React, { createContext, useContext, useState, ReactNode } from 'react';
import { FormStep } from '../../../types';

export interface FormData {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  title: string;
  description: string;
  industry: string;
  seniorityLevel: string;
  city: string;
  state: string;
  isRemote: boolean;
  salaryRangeMin: string;
  salaryRangeMax: string;
  mustHaveSkills: string[];
  candidatesRequested: string;
}

export interface AlertModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'warning' | 'error' | 'upgrade';
  actionLabel?: string;
  onAction?: () => void;
}

export interface ClientIntakeFormContextType {
  // Form State
  formData: FormData;
  setFormData: (data: FormData) => void;
  updateFormField: (field: keyof FormData, value: any) => void;
  
  // Validation State
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
  clearFieldError: (field: string) => void;
  
  // Submission State
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
  
  // Alert Modal State
  alertModal: AlertModalState;
  setAlertModal: (modal: AlertModalState) => void;
  
  // Form Actions
  resetForm: () => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleSkillsChange: (skills: string[]) => void;
}

const ClientIntakeFormContext = createContext<ClientIntakeFormContextType | undefined>(undefined);

const initialFormData: FormData = {
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  title: '',
  description: '',
  industry: '',
  seniorityLevel: '',
  city: '',
  state: '',
  isRemote: false,
  salaryRangeMin: '',
  salaryRangeMax: '',
  mustHaveSkills: [],
  candidatesRequested: '1'
};

const initialAlertModal: AlertModalState = {
  isOpen: false,
  title: '',
  message: ''
};

interface ClientIntakeFormProviderProps {
  children: ReactNode;
}

export const ClientIntakeFormProvider: React.FC<ClientIntakeFormProviderProps> = ({ children }) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertModal, setAlertModal] = useState<AlertModalState>(initialAlertModal);

  const updateFormField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const clearFieldError = (field: string) => {
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    updateFormField(name as keyof FormData, fieldValue);
    clearFieldError(name);
  };

  const handleSkillsChange = (skills: string[]) => {
    updateFormField('mustHaveSkills', skills);
    clearFieldError('mustHaveSkills');
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setErrors({});
    setIsSubmitting(false);
    setAlertModal(initialAlertModal);
  };

  const value: ClientIntakeFormContextType = {
    // Form State
    formData,
    setFormData,
    updateFormField,
    
    // Validation State
    errors,
    setErrors,
    clearFieldError,
    
    // Submission State
    isSubmitting,
    setIsSubmitting,
    
    // Alert Modal State
    alertModal,
    setAlertModal,
    
    // Form Actions
    resetForm,
    handleInputChange,
    handleSkillsChange
  };

  return (
    <ClientIntakeFormContext.Provider value={value}>
      {children}
    </ClientIntakeFormContext.Provider>
  );
};

export const useClientIntakeForm = (): ClientIntakeFormContextType => {
  const context = useContext(ClientIntakeFormContext);
  if (context === undefined) {
    throw new Error('useClientIntakeForm must be used within a ClientIntakeFormProvider');
  }
  return context;
};
