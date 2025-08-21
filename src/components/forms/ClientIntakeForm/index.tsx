import React from 'react';
import { Card, CardContent } from '../../ui/Card';
import { FormStep } from '../../../types';
import { AlertModal } from '../../ui/AlertModal';
import { ClientIntakeFormProvider, useClientIntakeForm } from './ClientIntakeFormContext';
import { useFormNavigation } from './useFormNavigation';
import { useFormSubmission } from './useFormSubmission';
import { FormStepRenderer } from './FormStepRenderer';

interface ClientIntakeFormProps {
  currentStep: FormStep;
  setCurrentStep: (step: FormStep) => void;
}

// Inner component that uses the context
const ClientIntakeFormContent: React.FC<ClientIntakeFormProps> = ({ 
  currentStep, 
  setCurrentStep 
}) => {
  const { alertModal, setAlertModal } = useClientIntakeForm();
  const { goToNextStep, goToPreviousStep } = useFormNavigation({ currentStep, setCurrentStep });
  const { handleSubmit, handleReset } = useFormSubmission({ setCurrentStep });

  const handleCloseModal = () => {
    setAlertModal(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <>
    <Card className="max-w-4xl mx-auto glow-supernova">
      <CardContent className="py-12">
          <FormStepRenderer
            currentStep={currentStep}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
            onSubmit={handleSubmit}
            onReset={handleReset}
          />
      </CardContent>
    </Card>

    <AlertModal
      isOpen={alertModal.isOpen}
        onClose={handleCloseModal}
      title={alertModal.title}
      message={alertModal.message}
      type={alertModal.type}
      actionLabel={alertModal.actionLabel}
      onAction={alertModal.onAction}
    />
  </>
  );
};

// Main exported component with provider
export const ClientIntakeForm: React.FC<ClientIntakeFormProps> = (props) => {
  return (
    <ClientIntakeFormProvider>
      <ClientIntakeFormContent {...props} />
    </ClientIntakeFormProvider>
  );
};