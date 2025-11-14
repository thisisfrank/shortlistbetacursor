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
  // console.log('🔍 JobTitleStep - received formData:', formData);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-1 animate-fadeIn">
      <FormInput
        label=""
        name="title"
        value={formData.title}
        onChange={onChange}
        error={errors.title}
        placeholder="Enter the position title"
      />

      <div className="pt-0">
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