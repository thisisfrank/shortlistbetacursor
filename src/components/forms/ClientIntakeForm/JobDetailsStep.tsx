import React, { useState } from 'react';
import { FormTextarea, FormInput, FormSelect } from '../FormInput';
import { SearchableSelect } from '../../ui/SearchableSelect';
import { Button } from '../../ui/Button';
import { useData } from '../../../context/DataContext';
import { X, Plus } from 'lucide-react';

interface JobDetailsStepProps {
  formData: {
    title: string;
    companyName: string;
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
  const [newSkill, setNewSkill] = useState('');
  
  // Get free tier for displaying limits
  const freeTier = tiers.find(tier => tier.name === 'Free');
  const maxCandidates = freeTier?.monthlyCandidateAllotment || 20;

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
    onNext();
  };

  const handleRadioChange = (name: string, value: string) => {
    const syntheticEvent = {
      target: {
        name,
        value
      }
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(syntheticEvent);
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
      <h2 className="text-3xl font-anton text-supernova mb-12 uppercase tracking-wide">Job Details & Requirements</h2>
      
      <FormInput
        label="Company Name"
        name="companyName"
        value={formData.companyName}
        onChange={onChange}
        error={errors.companyName}
        required
        placeholder="Enter your company name"
      />
      
      <FormTextarea
        label="Job Description"
        name="description"
        value={formData.description}
        onChange={onChange}
        error={errors.description}
        required
        placeholder="Enter a detailed job description. The more information you can provide, the better our candidate matching system will be able to return you precise, highly qualified candidates."
        rows={6}
      />
      
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
        {(errors.seniorityLevel || !formData.seniorityLevel) && (
          <p className="text-red-400 text-sm mt-2">
            {errors.seniorityLevel || 'Experience level is required'}
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
            onChange={onChange}
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
        {(errors.mustHaveSkills || formData.mustHaveSkills.length < 3) && (
          <p className="mt-2 text-sm text-red-400 font-jakarta font-medium">
            {errors.mustHaveSkills || `${3 - formData.mustHaveSkills.length} more skill${3 - formData.mustHaveSkills.length > 1 ? 's' : ''} required`}
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
          disabled={formData.mustHaveSkills.length < 3}
        >
          CONTINUE
        </Button>
      </div>
    </form>
  );
};