import React, { useState, useEffect } from 'react';
import { FormTextarea, FormInput, FormSelect } from '../FormInput';
import { SearchableSelect } from '../../ui/SearchableSelect';
import { Button } from '../../ui/Button';
import { useData } from '../../../context/DataContext';
import { useClientIntakeForm } from './ClientIntakeFormContext';
import { X, Plus, Wand2, RefreshCw, Undo2, Edit3 } from 'lucide-react';

interface JobDetailsStepProps {
  formData: {
    title: string;
    companyName: string;
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
  };
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  onSkillsChange: (skills: string[]) => void;
  onNext: () => void;
  onBack: () => void;
  errors: Record<string, string>;
}

export const JobDetailsStep: React.FC<JobDetailsStepProps> = ({
  formData,
  onChange,
  onSkillsChange,
  onNext,
  onBack,
  errors
}) => {
  const { tiers } = useData();
  const { 
    isGeneratingDescription, 
    descriptionGenerationError, 
    generateJobDescription,
    setDescriptionGenerationError,
    hasUserEditedDescription,
    handleDescriptionChange,
    previousDescription,
    undoAIGeneration,
    clearDescriptionForManualEntry
  } = useClientIntakeForm();
  const [newSkill, setNewSkill] = useState('');
  const [showValidationWarning, setShowValidationWarning] = useState(false);
  
  // Get free tier for displaying limits
  const freeTier = tiers.find(tier => tier.name === 'Free');
  const maxCandidates = freeTier?.monthlyCandidateAllotment || 20;

  // Auto-trigger job description generation when 3 skills are added
  // ONLY if the description field is empty and hasn't been edited by the user
  useEffect(() => {
    const hasExistingDescription = formData.description && formData.description.trim().length > 0;
    
    if (
      formData.mustHaveSkills.length === 3 && 
      formData.title && 
      !hasExistingDescription && // Don't auto-generate if description already has content
      !isGeneratingDescription &&
      !hasUserEditedDescription // Don't auto-generate if user has manually edited
    ) {
      generateJobDescription();
    }
  }, [formData.mustHaveSkills.length, formData.title, formData.description, isGeneratingDescription, hasUserEditedDescription, generateJobDescription]);

  // US States options - dynamically set first option based on remote status
  const stateOptions = [
    { value: '', label: formData.isRemote ? 'Not Required' : 'Select State' },
    { value: 'AL', label: 'Alabama' },
    { value: 'AK', label: 'Alaska' },
    { value: 'AZ', label: 'Arizona' },
    { value: 'AR', label: 'Arkansas' },
    { value: 'CA', label: 'California' },
    { value: 'CO', label: 'Colorado' },
    { value: 'CT', label: 'Connecticut' },
    { value: 'DE', label: 'Delaware' },
    { value: 'FL', label: 'Florida' },
    { value: 'GA', label: 'Georgia' },
    { value: 'HI', label: 'Hawaii' },
    { value: 'ID', label: 'Idaho' },
    { value: 'IL', label: 'Illinois' },
    { value: 'IN', label: 'Indiana' },
    { value: 'IA', label: 'Iowa' },
    { value: 'KS', label: 'Kansas' },
    { value: 'KY', label: 'Kentucky' },
    { value: 'LA', label: 'Louisiana' },
    { value: 'ME', label: 'Maine' },
    { value: 'MD', label: 'Maryland' },
    { value: 'MA', label: 'Massachusetts' },
    { value: 'MI', label: 'Michigan' },
    { value: 'MN', label: 'Minnesota' },
    { value: 'MS', label: 'Mississippi' },
    { value: 'MO', label: 'Missouri' },
    { value: 'MT', label: 'Montana' },
    { value: 'NE', label: 'Nebraska' },
    { value: 'NV', label: 'Nevada' },
    { value: 'NH', label: 'New Hampshire' },
    { value: 'NJ', label: 'New Jersey' },
    { value: 'NM', label: 'New Mexico' },
    { value: 'NY', label: 'New York' },
    { value: 'NC', label: 'North Carolina' },
    { value: 'ND', label: 'North Dakota' },
    { value: 'OH', label: 'Ohio' },
    { value: 'OK', label: 'Oklahoma' },
    { value: 'OR', label: 'Oregon' },
    { value: 'PA', label: 'Pennsylvania' },
    { value: 'RI', label: 'Rhode Island' },
    { value: 'SC', label: 'South Carolina' },
    { value: 'SD', label: 'South Dakota' },
    { value: 'TN', label: 'Tennessee' },
    { value: 'TX', label: 'Texas' },
    { value: 'UT', label: 'Utah' },
    { value: 'VT', label: 'Vermont' },
    { value: 'VA', label: 'Virginia' },
    { value: 'WA', label: 'Washington' },
    { value: 'WV', label: 'West Virginia' },
    { value: 'WI', label: 'Wisconsin' },
    { value: 'WY', label: 'Wyoming' },
    { value: 'DC', label: 'District of Columbia' }
  ];

  // Format number with commas and currency symbol
  const formatCurrency = (value: string): string => {
    // Remove all non-digits
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return '';
    
    // Convert to number and format with commas
    const numberValue = parseInt(numericValue, 10);
    if (isNaN(numberValue)) return '';
    
    // Add commas for thousands
    const formattedNumber = numberValue.toLocaleString('en-US');
    return `$${formattedNumber}`;
  };

  // Handle salary input changes with formatting
  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const formattedValue = formatCurrency(value);
    
    // Call onChange with a properly constructed event-like object
    onChange({
      target: {
        name,
        value: formattedValue
      }
    } as React.ChangeEvent<HTMLInputElement>);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidationWarning(true);
    onNext();
  };
  
  // Hide validation warning when errors are cleared
  useEffect(() => {
    if (Object.keys(errors).length === 0) {
      setShowValidationWarning(false);
    }
  }, [errors]);

  const handleRadioChange = (name: string, value: string) => {
    const syntheticEvent = {
      target: {
        name,
        value
      }
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(syntheticEvent);
  };

  const handleRemoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isRemote = e.target.checked;
    
    // First, update the isRemote field
    onChange(e);
    
    // If remote is checked, clear city and state
    if (isRemote) {
      // Clear city
      const cityClearEvent = {
        target: {
          name: 'city',
          value: ''
        }
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(cityClearEvent);
      
      // Clear state
      const stateClearEvent = {
        target: {
          name: 'state',
          value: ''
        }
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(stateClearEvent);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && formData.mustHaveSkills.length < 3) {
      onSkillsChange([...formData.mustHaveSkills, newSkill.trim()]);
      setNewSkill('');
    }
  };
  const removeSkill = (index: number) => {
    const updated = [...formData.mustHaveSkills];
    updated.splice(index, 1);
    onSkillsChange(updated);
  };
  const handleSkillKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  const seniorityOptions = [
    { value: 'Junior', label: 'Junior (1-3 years)' },
    { value: 'Mid', label: 'Mid (4-6 years)' },
    { value: 'Senior', label: 'Senior (7-10 years)' },
    { value: 'Super Senior', label: 'Super Senior (10+ years)' }
  ];



  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
      <div className="mb-6">
        <h2 className="text-3xl font-anton text-supernova uppercase tracking-wide">Job Details & Requirements</h2>
        {formData.title && (
          <p className="text-2xl font-anton text-white-knight mt-4">{formData.title}</p>
        )}
      </div>
      
      {/* Must Have Skills */}
      <div className="mb-8">
        <label className="block text-sm font-jakarta font-semibold text-supernova mb-3 uppercase tracking-wide">
          Must Have Skills (3+ required)
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={handleSkillKeyDown}
            placeholder="Enter skills here"
            className="flex-1 border-0 border-b-2 px-0 py-4 text-lg bg-transparent text-white-knight placeholder-guardian/60 font-jakarta focus:ring-0 focus:border-supernova transition-colors duration-200 border-guardian/40 hover:border-guardian/60"
          />
          <Button
            type="button"
            onClick={addSkill}
            variant="outline"
            size="md"
            disabled={!newSkill.trim() || formData.mustHaveSkills.length >= 3}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            ADD
          </Button>
        </div>
        {errors.mustHaveSkills && (
          <p className="mt-2 text-sm text-red-400 font-jakarta font-medium">
            {errors.mustHaveSkills}
          </p>
        )}
        {formData.mustHaveSkills.length > 0 && (
          <div className="mt-6 space-y-3">
            {formData.mustHaveSkills.map((skill, index) => (
              <div 
                key={index}
                className="flex items-center bg-supernova/10 border border-supernova/30 p-4 rounded-lg hover:bg-supernova/20 transition-colors"
              >
                <span className="flex-1 text-white-knight font-jakarta font-medium">{skill}</span>
                <button
                  type="button"
                  onClick={() => removeSkill(index)}
                  className="text-guardian hover:text-red-400 transition-colors ml-3"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <FormInput
        label="Company Name"
        name="companyName"
        value={formData.companyName}
        onChange={onChange}
        error={errors.companyName}
        required
        placeholder="Enter your company name"
      />
      
      <div className="space-y-3">
        <label className="block text-sm font-jakarta font-semibold text-supernova uppercase tracking-wide">
          Describe your ideal candidate (1-2 sentences)
        </label>
        
        <textarea
          name="idealCandidate"
          value={formData.idealCandidate}
          onChange={onChange}
          placeholder="Describe your perfect candidate for this role..."
          rows={2}
          className={`w-full px-4 py-3 bg-transparent border-2 rounded-xl text-white-knight placeholder-guardian/60 font-jakarta focus:outline-none focus:ring-0 transition-all duration-200 resize-none ${
            errors.idealCandidate
              ? 'border-red-400 focus:border-red-400'
              : 'border-guardian/40 hover:border-guardian/60 focus:border-supernova'
          }`}
        />
        
        {errors.idealCandidate && (
          <p className="text-red-400 text-sm font-jakarta font-medium">
            {errors.idealCandidate}
          </p>
        )}
      </div>
      
      {/* Job Description with AI Generation */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-jakarta font-semibold text-supernova uppercase tracking-wide">
            Job Description <span className="text-red-400">*</span>
          </label>
          
          {/* AI Generation Controls */}
          <div className="flex items-center gap-2">
            {formData.mustHaveSkills.length >= 3 && formData.title && (
              <>
                {!formData.description && !isGeneratingDescription && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateJobDescription}
                    className="flex items-center gap-2 text-xs"
                  >
                    <Wand2 size={14} />
                    Generate with AI
                  </Button>
                )}
                
                {formData.description && !isGeneratingDescription && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateJobDescription}
                      className="flex items-center gap-2 text-xs"
                    >
                      <RefreshCw size={14} />
                      Regenerate
                    </Button>
                    
                    {/* Undo button - only show if there's a previous description to undo to */}
                    {previousDescription !== undefined && previousDescription !== formData.description && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={undoAIGeneration}
                        className="flex items-center gap-2 text-xs"
                      >
                        <Undo2 size={14} />
                        Undo
                      </Button>
                    )}
                    
                    {/* Clear button - show if AI has generated content (indicated by previousDescription existing) */}
                    {previousDescription !== undefined && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clearDescriptionForManualEntry}
                        className="flex items-center gap-2 text-xs"
                      >
                        <Edit3 size={14} />
                        Enter your own
                      </Button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Loading State */}
        {isGeneratingDescription && (
          <div className="flex items-center gap-3 p-4 bg-supernova/10 border border-supernova/30 rounded-lg">
            <div className="animate-spin">
              <Wand2 size={16} className="text-supernova" />
            </div>
            <span className="text-sm text-supernova font-jakarta font-medium">
              Generating job description with AI...
            </span>
          </div>
        )}
        
        {/* Error State */}
        {descriptionGenerationError && (
          <div className="p-4 bg-red-400/10 border border-red-400/30 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-400 font-jakarta font-medium">
                {descriptionGenerationError}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDescriptionGenerationError(null)}
                className="text-xs"
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}
        
        <textarea
          name="description"
          value={formData.description}
          onChange={handleDescriptionChange}
          placeholder={
            formData.mustHaveSkills.length >= 3 && formData.title && !hasUserEditedDescription
              ? "AI will generate a description when you add 3 skills, or you can write your own..."
              : "Paste job description"
          }
          rows={6}
          required
          disabled={isGeneratingDescription}
          className={`w-full px-4 py-3 bg-transparent border-2 rounded-xl text-white-knight placeholder-guardian/60 font-jakarta focus:outline-none focus:ring-0 transition-all duration-200 resize-none ${
            errors.description
              ? 'border-red-400 focus:border-red-400'
              : 'border-guardian/40 hover:border-guardian/60 focus:border-supernova'
          } ${isGeneratingDescription ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        
        {errors.description && (
          <p className="text-red-400 text-sm font-jakarta font-medium">
            {errors.description}
          </p>
        )}
      </div>
      
      <FormInput
        label="Industry"
        name="industry"
        value={formData.industry}
        onChange={onChange}
        error={errors.industry}
        placeholder="e.g., Technology, Healthcare, Finance, Manufacturing"
        required
      />
      
      {/* Experience Required */}
      <div className="space-y-3">
        <label className="block text-sm font-jakarta font-semibold text-supernova mb-3 uppercase tracking-wide">
          Experience Required <span className="text-red-400">*</span>
        </label>
        <div className="space-y-3">
          {seniorityOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleRadioChange('seniorityLevel', option.value)}
              className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                formData.seniorityLevel === option.value
                  ? 'border-supernova bg-supernova/10 text-white-knight'
                  : 'border-guardian/30 bg-shadowforce/50 text-guardian hover:border-guardian/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  formData.seniorityLevel === option.value
                    ? 'border-supernova'
                    : 'border-guardian/50'
                }`}>
                  {formData.seniorityLevel === option.value && (
                    <div className="w-3 h-3 rounded-full bg-supernova"></div>
                  )}
                </div>
                <span className="font-jakarta font-medium">{option.label}</span>
              </div>
            </button>
          ))}
        </div>
        {errors.seniorityLevel && (
          <p className="text-red-400 text-sm mt-2">
            {errors.seniorityLevel}
          </p>
        )}
      </div>
      
      {/* Location */}
      <div>
        <div className="grid grid-cols-2 gap-8 mb-2">
          <FormInput
            label="City"
            name="city"
            value={formData.city}
            onChange={onChange}
            error={errors.city}
            required={!formData.isRemote}
            disabled={formData.isRemote}
            placeholder={formData.isRemote ? "Not required for remote positions" : "Enter city name"}
          />
          
          <SearchableSelect
            label="State"
            name="state"
            value={formData.state}
            onChange={onChange}
            options={stateOptions}
            error={errors.state}
            required={!formData.isRemote}
            disabled={formData.isRemote}
            placeholder="Type to search states..."
          />
        </div>
        
        <div className="flex items-center mb-12">
          <input
            type="checkbox"
            id="isRemote"
            name="isRemote"
            checked={formData.isRemote}
            onChange={handleRemoteChange}
            className="w-5 h-5 text-supernova bg-gray-700 border-gray-600 rounded focus:ring-supernova focus:ring-2"
          />
          <label htmlFor="isRemote" className="ml-3 text-sm font-jakarta font-semibold text-supernova uppercase tracking-wide">
            Remote Position
          </label>
        </div>
      </div>
      
      {/* Salary Range */}
      <div className="grid grid-cols-2 gap-8">
        <FormInput
          label="Minimum Salary (USD)"
          name="salaryRangeMin"
          type="text"
          value={formData.salaryRangeMin}
          onChange={handleSalaryChange}
          error={errors.salaryRangeMin}
          required
          placeholder="$50,000"
        />
        
        <FormInput
          label="Maximum Salary (USD)"
          name="salaryRangeMax"
          type="text"
          value={formData.salaryRangeMax}
          onChange={handleSalaryChange}
          error={errors.salaryRangeMax}
          required
          placeholder="$80,000"
        />
      </div>

      {/* Validation Warning Message */}
      {showValidationWarning && Object.keys(errors).length > 0 && (
        <div className="p-4 bg-red-400/10 border border-red-400/30 rounded-lg animate-fadeIn">
          <p className="text-sm text-red-400 font-jakarta font-medium">
            ⚠️ Please fill out all required fields before continuing.
          </p>
        </div>
      )}

      <div className="flex pt-8 gap-6">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onBack}
          className="flex-1"
          size="lg"
        >
          BACK TO POSITION TITLE
        </Button>
        <Button 
          type="submit"
          className="flex-1"
          size="lg"
        >
          CONTINUE
        </Button>
      </div>
    </form>
  );
};