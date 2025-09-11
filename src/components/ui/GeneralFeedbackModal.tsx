import React from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface GeneralFeedbackModalProps {
  isOpen: boolean;
  feedback: string;
  isSubmitting: boolean;
  onClose: () => void;
  onFeedbackChange: (feedback: string) => void;
  onSubmit: () => void;
}

export const GeneralFeedbackModal: React.FC<GeneralFeedbackModalProps> = ({
  isOpen,
  feedback,
  isSubmitting,
  onClose,
  onFeedbackChange,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-shadowforce border border-guardian/30 rounded-lg p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-anton text-white-knight uppercase tracking-wide">
            Submit General Feedback
          </h3>
          <button
            onClick={onClose}
            className="text-guardian hover:text-white-knight transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-jakarta font-semibold text-supernova uppercase tracking-wide mb-3">
            Your Feedback
          </label>
          <textarea
            value={feedback}
            onChange={(e) => onFeedbackChange(e.target.value)}
            placeholder="Please share your thoughts about the platform, suggestions for improvement, feature requests, or any other general feedback..."
            className="w-full p-4 bg-shadowforce-light border border-guardian/30 rounded-lg text-white-knight placeholder-guardian/60 focus:ring-supernova focus:border-supernova font-jakarta resize-vertical min-h-[120px]"
            rows={6}
          />
          <div className="mt-2 text-right">
            <span className={`text-xs font-jakarta ${
              feedback.length > 1000 ? 'text-red-400' : 'text-guardian/60'
            }`}>
              {feedback.length}/1000 characters
            </span>
          </div>
        </div>

        <div className="flex gap-4 justify-end">
          <Button
            variant="outline"
            size="lg"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6"
          >
            CANCEL
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={onSubmit}
            disabled={!feedback.trim() || isSubmitting || feedback.length > 1000}
            isLoading={isSubmitting}
            className="px-8 glow-supernova"
          >
            {isSubmitting ? 'SUBMITTING...' : 'SUBMIT GENERAL FEEDBACK'}
          </Button>
        </div>
      </div>
    </div>
  );
};
