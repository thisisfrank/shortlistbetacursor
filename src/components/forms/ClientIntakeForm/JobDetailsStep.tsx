import React from 'react';
import { FormTextarea } from '../FormInput';
import { Button } from '../../ui/Button';

interface JobDetailsStepProps {
  formData: {
    title: string;
    description: string;
    seniorityLevel: string;
  };
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  onNext: () => void;
  onBack: () => void;
  errors: Record<string, string>;
}

export const JobDetailsStep: React.FC<JobDetailsStepProps> = ({
  formData,
  onChange,
  onNext,
  onBack,
  errors
}) => {
  // console.log('🔍 JobDetailsStep - received formData:', formData);
  // console.log('🔍 JobDetailsStep - title specifically:', formData.title);
  
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

  const seniorityOptions = [
    { value: 'Junior', label: 'Junior (1-3 years)' },
    { value: 'Mid', label: 'Mid (4-6 years)' },
    { value: 'Senior', label: 'Senior (7-10 years)' },
    { value: 'Executive', label: 'Executive (10+ years)' }
  ];



  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
      <h2 className="text-3xl font-anton text-guardian mb-12 uppercase tracking-wide">Job Details</h2>
      
      <FormTextarea
        label="Job Description"
        name="description"
        value={formData.description}
        onChange={onChange}
        error={errors.description}
        required
        placeholder="Enter a detailed job description"
        rows={6}
      />
      
      {/* Experience Required */}
      <div className="space-y-3">
        <label className="block text-sm font-jakarta font-semibold text-guardian mb-3 uppercase tracking-wide">
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
          <p className="text-red-400 text-sm mt-2">{errors.seniorityLevel}</p>
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
          BACK TO JOB TITLE
        </Button>
        <Button 
          type="submit"
          className="flex-1"
          size="lg"
        >
          CONTINUE TO COMPANY INFO
        </Button>
      </div>
    </form>
  );
};