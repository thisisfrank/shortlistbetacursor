import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FormStep } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { generateJobDescription as generateJobDescriptionService } from '../../../services/jobDescriptionService';
import { generateCandidateProfiles, CandidateProfile } from '../../../services/candidateProfileService';

export interface FormData {
  companyName: string;
  title: string;
  idealCandidate: string;
  description: string;
  industry: string;
  seniorityLevel: string;
  country: string;
  city: string;
  state: string;
  isRemote: boolean;
  salaryRangeMin: string;
  salaryRangeMax: string;
  mustHaveSkills: string[];
  candidatesRequested: string;
  selectedProfileTemplate: string;
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
  hasNewInputForRegeneration: boolean;
  
  // Candidate Profile Generation State
  isGeneratingProfiles: boolean;
  generatedProfiles: CandidateProfile[];
  profileGenerationError: string | null;
  setProfileGenerationError: (error: string | null) => void;
  generateProfiles: () => Promise<void>;
  handleProfileSelection: (profileId: string) => void;
  
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
  country: 'US',
  city: '',
  state: '',
  isRemote: false,
  salaryRangeMin: '',
  salaryRangeMax: '',
  mustHaveSkills: [],
  candidatesRequested: '20',
  selectedProfileTemplate: ''
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
  const [lastGeneratedWithIdealCandidate, setLastGeneratedWithIdealCandidate] = useState<string>(''); // Track if idealCandidate has changed

  // Candidate Profile Generation State
  const [isGeneratingProfiles, setIsGeneratingProfiles] = useState(false);
  const [generatedProfiles, setGeneratedProfiles] = useState<CandidateProfile[]>([]);
  const [profileGenerationError, setProfileGenerationError] = useState<string | null>(null);

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
        seniorityLevel: formData.seniorityLevel || undefined,
        idealCandidate: formData.idealCandidate || undefined
      });

      updateFormField('description', generatedDescription);
      clearFieldError('description');
      setHasUserEditedDescription(false); // Reset flag since AI generated this
      setLastGeneratedWithIdealCandidate(formData.idealCandidate); // Track that we've incorporated this idealCandidate value
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

  const generateProfiles = async () => {
    if (!formData.title || formData.mustHaveSkills.length < 3 || !formData.seniorityLevel) {
      setProfileGenerationError('Title, 3 skills, and seniority level are required to generate profiles');
      return;
    }

    setIsGeneratingProfiles(true);
    setProfileGenerationError(null);

    try {
      // Build location string
      let location: string | undefined;
      if (!formData.isRemote && formData.city) {
        location = formData.state 
          ? `${formData.city}, ${formData.state}`
          : formData.city;
      }

      const profiles = await generateCandidateProfiles({
        title: formData.title,
        mustHaveSkills: formData.mustHaveSkills,
        seniorityLevel: formData.seniorityLevel,
        location,
        isRemote: formData.isRemote,
        industry: formData.industry || undefined,
        idealCandidate: formData.idealCandidate || undefined
      });

      setGeneratedProfiles(profiles);
    } catch (error) {
      setProfileGenerationError(
        error instanceof Error ? error.message : 'Failed to generate candidate profiles. Please try again.'
      );
    } finally {
      setIsGeneratingProfiles(false);
    }
  };

  const handleProfileSelection = (profileId: string) => {
    const currentSelection = formData.selectedProfileTemplate;
    
    if (currentSelection === profileId) {
      // Deselect if clicking the same profile
      updateFormField('selectedProfileTemplate', '');
    } else {
      // Select the new profile (only one allowed)
      updateFormField('selectedProfileTemplate', profileId);
    }
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
    setLastGeneratedWithIdealCandidate('');
    setIsGeneratingProfiles(false);
    setGeneratedProfiles([]);
    setProfileGenerationError(null);
  };

  // Computed value: Check if there's new input (idealCandidate) that hasn't been incorporated
  const hasNewInputForRegeneration = 
    formData.description.length > 0 && // Description exists
    formData.idealCandidate.trim().length > 0 && // idealCandidate has content
    formData.idealCandidate !== lastGeneratedWithIdealCandidate; // idealCandidate has changed since last generation

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
    hasNewInputForRegeneration,
    
    // Candidate Profile Generation State
    isGeneratingProfiles,
    generatedProfiles,
    profileGenerationError,
    setProfileGenerationError,
    generateProfiles,
    handleProfileSelection,
    
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
