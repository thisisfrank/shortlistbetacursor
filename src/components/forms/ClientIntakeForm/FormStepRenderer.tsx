import React, { useEffect } from 'react';
import { FormStep } from '../../../types';
import { JobTitleStep } from './JobTitleStep';
import { JobDetailsStep } from './JobDetailsStep';
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
  const { formData, handleInputChange, handleSkillsChange, errors, isSubmitting, generatedProfiles } = useClientIntakeForm();

  // Scroll to top whenever the current step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

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
            companyName: formData.companyName,
            idealCandidate: formData.idealCandidate,
            description: formData.description,
            industry: formData.industry,
            seniorityLevel: formData.seniorityLevel,
            country: formData.country,
            city: formData.city,
            state: formData.state,
            isRemote: formData.isRemote,
            salaryRangeMin: formData.salaryRangeMin,
            salaryRangeMax: formData.salaryRangeMax,
            mustHaveSkills: formData.mustHaveSkills,
            candidatesRequested: formData.candidatesRequested,
            selectedProfileTemplate: formData.selectedProfileTemplate
          }}
          onChange={handleInputChange}
          onSkillsChange={handleSkillsChange}
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
            title: formData.title,
            description: formData.description,
            industry: formData.industry,
            seniorityLevel: formData.seniorityLevel,
            country: formData.country,
            city: formData.city,
            state: formData.state,
            isRemote: formData.isRemote,
            salaryRangeMin: formData.salaryRangeMin,
            salaryRangeMax: formData.salaryRangeMax,
            mustHaveSkills: formData.mustHaveSkills,
            candidatesRequested: formData.candidatesRequested,
            selectedProfileTemplate: formData.selectedProfileTemplate
          }}
          selectedProfile={
            formData.selectedProfileTemplate
              ? generatedProfiles.find(p => p.id === formData.selectedProfileTemplate)
              : undefined
          }
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
