import React from 'react';
import { FormStep } from '../../../types';
import { JobTitleStep } from './JobTitleStep';
import { JobDetailsStep } from './JobDetailsStep';
import { CompanyInfoStep } from './CompanyInfoStep';
import { SimpleSummaryStep } from './SimpleSummaryStep';
import { ConfirmationStep } from './ConfirmationStep';
import { useClientIntakeForm } from './ClientIntakeFormContext';

interface FormStepRendererProps {
  currentStep: FormStep;
  onNext: () => void;
  onBack: () => void;
  onSubmit: () => void;
  onReset: () => void;
}

export const FormStepRenderer: React.FC<FormStepRendererProps> = ({
  currentStep,
  onNext,
  onBack,
  onSubmit,
  onReset
}) => {
  const { formData, handleInputChange, handleSkillsChange, errors, isSubmitting } = useClientIntakeForm();

  switch (currentStep) {
    case 'job-title':
      return (
        <JobTitleStep
          formData={{
            title: formData.title
          }}
          onChange={handleInputChange}
          onNext={onNext}
          errors={errors}
        />
      );

    case 'job-details':
      return (
        <JobDetailsStep
          formData={{
            title: formData.title,
            description: formData.description,
            industry: formData.industry,
            seniorityLevel: formData.seniorityLevel,
            city: formData.city,
            state: formData.state,
            isRemote: formData.isRemote,
            salaryRangeMin: formData.salaryRangeMin,
            salaryRangeMax: formData.salaryRangeMax,
            mustHaveSkills: formData.mustHaveSkills,
            candidatesRequested: formData.candidatesRequested
          }}
          onChange={handleInputChange}
          onSkillsChange={handleSkillsChange}
          onNext={onNext}
          onBack={onBack}
          errors={errors}
        />
      );

    case 'company-info':
      return (
        <CompanyInfoStep
          formData={{
            title: formData.title,
            companyName: formData.companyName,
            contactName: formData.contactName,
            email: formData.email,
            phone: formData.phone
          }}
          onChange={handleInputChange}
          onNext={onNext}
          onBack={onBack}
          errors={errors}
        />
      );

    case 'summary':
      return (
        <SimpleSummaryStep
          formData={{
            companyName: formData.companyName,
            contactName: formData.contactName,
            email: formData.email,
            phone: formData.phone,
            title: formData.title,
            description: formData.description,
            industry: formData.industry,
            seniorityLevel: formData.seniorityLevel,
            city: formData.city,
            state: formData.state,
            isRemote: formData.isRemote,
            salaryRangeMin: formData.salaryRangeMin,
            salaryRangeMax: formData.salaryRangeMax,
            mustHaveSkills: formData.mustHaveSkills,
            candidatesRequested: formData.candidatesRequested
          }}
          onChange={handleInputChange}
          onSubmit={onSubmit}
          onBack={onBack}
          isSubmitting={isSubmitting}
        />
      );

    case 'confirmation':
      return <ConfirmationStep onReset={onReset} />;

    default:
      return null;
  }
};
