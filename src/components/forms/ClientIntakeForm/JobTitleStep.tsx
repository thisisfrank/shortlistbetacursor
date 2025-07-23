import React from 'react';
import { FormInput } from '../FormInput';
import { Button } from '../../ui/Button';

interface JobTitleStepProps {
  formData: {
    title: string;
  };
  onChange: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
  onNext: () => void;
  errors: Record<string, string>;
}

export const JobTitleStep: React.FC<JobTitleStepProps> = ({
  formData,
  onChange,
  onNext,
  errors
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
      <h2 className="text-3xl font-anton text-guardian mb-12 uppercase tracking-wide">Job Title</h2>
      
      <FormInput
        label="Job Title"
        name="title"
        value={formData.title}
        onChange={onChange}
        error={errors.title}
        required
        placeholder="Enter the job title"
      />

      <div className="pt-8">
        <Button 
          type="submit"
          fullWidth
          size="lg"
        >
          CONTINUE TO JOB DETAILS
        </Button>
      </div>
    </form>
  );
}; 