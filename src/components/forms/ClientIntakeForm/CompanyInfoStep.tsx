import React from 'react';
import { FormInput } from '../FormInput';
import { PhoneInput } from '../PhoneInput';
import { Button } from '../../ui/Button';

interface CompanyInfoStepProps {
  formData: {
    title: string;
    companyName: string;
    email: string;
    phone: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNext: () => void;
  onBack?: () => void;
  errors: Record<string, string>;
}

export const CompanyInfoStep: React.FC<CompanyInfoStepProps> = ({
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
      <h2 className="text-3xl font-anton text-guardian mb-12 uppercase tracking-wide">Company Information</h2>
      
      <FormInput
        label="Company Name"
        name="companyName"
        value={formData.companyName}
        onChange={onChange}
        error={errors.companyName}
        required
        placeholder="Enter your company name"
      />
      

      <FormInput
        label="Email Address"
        name="email"
        type="email"
        value={formData.email}
        onChange={onChange}
        error={errors.email}
        required
        placeholder="Enter your email address"
      />
      
      <PhoneInput
        label="Phone Number"
        name="phone"
        value={formData.phone}
        onChange={onChange}
        error={errors.phone}
        required
        placeholder="Enter phone number"
      />

      <div className="pt-8 flex gap-4">
        {onBack && (
          <Button type="button" variant="outline" size="lg" onClick={onBack} className="flex-1">
            BACK TO JOB DETAILS
          </Button>
        )}
        <Button type="submit" size="lg" className="flex-1">
          CONFIRM YOUR CANDIDATE SEARCH
        </Button>
      </div>
    </form>
  );
};