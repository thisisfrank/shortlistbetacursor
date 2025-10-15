import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FormStep } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { generateJobDescription as generateJobDescriptionService } from '../../../services/jobDescriptionService';

export interface FormData {
  companyName: string;
  title: string;
  idealCandidate: string;
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
  
  // Job Description Generation State
  isGeneratingDescription: boolean;
  setIsGeneratingDescription: (generating: boolean) => void;
  descriptionGenerationError: string | null;
  setDescriptionGenerationError: (error: string | null) => void;
  generateJobDescription: () => Promise<void>;
  hasUserEditedDescription: boolean;
  setHasUserEditedDescription: (edited: boolean) => void;
  previousDescription: string;
  undoAIGeneration: () => void;
  clearDescriptionForManualEntry: () => void;
  
  // Alert Modal State
  alertModal: AlertModalState;
  setAlertModal: (modal: AlertModalState) => void;
  
  // Form Actions
  resetForm: () => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleSkillsChange: (skills: string[]) => void;
  handleDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const ClientIntakeFormContext = createContext<ClientIntakeFormContextType | undefined>(undefined);

const initialFormData: FormData = {
  companyName: '',
  title: '',
  idealCandidate: '',
  description: '',
  industry: '',
  seniorityLevel: '',
  city: '',
  state: '',
  isRemote: false,
  salaryRangeMin: '',
  salaryRangeMax: '',
  mustHaveSkills: [],
  candidatesRequested: '20'
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
  const { userProfile } = useAuth();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertModal, setAlertModal] = useState<AlertModalState>(initialAlertModal);
  
  // Job Description Generation State
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [descriptionGenerationError, setDescriptionGenerationError] = useState<string | null>(null);
  const [hasUserEditedDescription, setHasUserEditedDescription] = useState(false);
  const [previousDescription, setPreviousDescription] = useState<string>(''); // Track previous description for undo

  // Auto-fill company name from user profile when available
  useEffect(() => {
    if (userProfile?.company && !formData.companyName) {
      setFormData(prev => ({ ...prev, companyName: userProfile.company }));
    }
  }, [userProfile?.company, formData.companyName]);

  // Set default candidates requested based on user tier (only on mount)
  useEffect(() => {
    if (userProfile && formData.candidatesRequested === '20') {
      const isFreeUser = userProfile.tierId === '5841d1d6-20d7-4360-96f8-0444305fac5b';
      const defaultCandidates = isFreeUser ? '20' : '50';
      setFormData(prev => ({ ...prev, candidatesRequested: defaultCandidates }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.tierId]);

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

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    updateFormField('description', value);
    clearFieldError('description');
    setHasUserEditedDescription(true); // Mark as user-edited
  };

  const generateJobDescription = async () => {
    if (!formData.title || formData.mustHaveSkills.length < 3) {
      setDescriptionGenerationError('Job title and at least 3 skills are required');
      return;
    }

    setIsGeneratingDescription(true);
    setDescriptionGenerationError(null);

    // Save current description for undo functionality
    setPreviousDescription(formData.description);

    try {
      const generatedDescription = await generateJobDescriptionService({
        title: formData.title,
        mustHaveSkills: formData.mustHaveSkills,
        companyName: formData.companyName || undefined,
        industry: formData.industry || undefined,
        seniorityLevel: formData.seniorityLevel || undefined
      });

      updateFormField('description', generatedDescription);
      clearFieldError('description');
      setHasUserEditedDescription(false); // Reset flag since AI generated this
    } catch (error) {
      setDescriptionGenerationError(
        error instanceof Error ? error.message : 'Failed to generate job description. Please try again.'
      );
      // Restore previous description if generation failed
      setPreviousDescription('');
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const undoAIGeneration = () => {
    updateFormField('description', previousDescription);
    setPreviousDescription(''); // Clear the undo history
    setHasUserEditedDescription(previousDescription.length > 0); // Set flag if there was previous content
  };

  const clearDescriptionForManualEntry = () => {
    updateFormField('description', '');
    setPreviousDescription(''); // Clear the undo history
    setHasUserEditedDescription(true); // Mark as edited to prevent auto-generation from firing
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setErrors({});
    setIsSubmitting(false);
    setAlertModal(initialAlertModal);
    setIsGeneratingDescription(false);
    setDescriptionGenerationError(null);
    setHasUserEditedDescription(false);
    setPreviousDescription('');
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
    
    // Job Description Generation State
    isGeneratingDescription,
    setIsGeneratingDescription,
    descriptionGenerationError,
    setDescriptionGenerationError,
    generateJobDescription,
    hasUserEditedDescription,
    setHasUserEditedDescription,
    previousDescription,
    undoAIGeneration,
    clearDescriptionForManualEntry,
    
    // Alert Modal State
    alertModal,
    setAlertModal,
    
    // Form Actions
    resetForm,
    handleInputChange,
    handleSkillsChange,
    handleDescriptionChange
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
