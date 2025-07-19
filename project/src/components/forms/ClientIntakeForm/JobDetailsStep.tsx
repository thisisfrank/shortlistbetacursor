import React from 'react';
import { FormInput, FormTextarea, FormSelect } from '../FormInput';
import { Button } from '../../ui/Button';

interface JobDetailsStepProps {
  formData: {
    title: string;
    description: string;
    seniorityLevel: string;
    workArrangement: string;
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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const seniorityOptions = [
    { value: '1-3 years', label: '1-3 years experience' },
    { value: '4-7 years', label: '4-7 years experience' },
    { value: '8-10+ years', label: '8-10+ years experience' }
  ];

  const workArrangementOptions = [
    { value: 'Remote', label: 'Remote' },
    { value: 'On-site', label: 'On-site' },
    { value: 'Hybrid', label: 'Hybrid' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
      <h2 className="text-3xl font-anton text-guardian mb-12 uppercase tracking-wide">Job Details</h2>
      
      <FormInput
        label="Job Title"
        name="title"
        value={formData.title}
        onChange={onChange}
        error={errors.title}
        required
        placeholder="Enter the job title"
      />
      
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
      
      <FormSelect
        label="Experience Required"
        name="seniorityLevel"
        value={formData.seniorityLevel}
        onChange={onChange}
        options={seniorityOptions}
        error={errors.seniorityLevel}
        required
      />
      
      <FormSelect
        label="Work Arrangement"
        name="workArrangement"
        value={formData.workArrangement}
        onChange={onChange}
        options={workArrangementOptions}
        error={errors.workArrangement}
        required
      />

      <div className="flex pt-8 gap-6">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onBack}
          className="flex-1"
          size="lg"
        >
          BACK
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