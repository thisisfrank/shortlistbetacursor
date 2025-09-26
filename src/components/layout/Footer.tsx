import React from 'react';
import { Link } from 'react-router-dom';
import { useGeneralFeedback } from '../../hooks/useGeneralFeedback';
import { GeneralFeedbackModal } from '../ui/GeneralFeedbackModal';

export const Footer: React.FC = () => {
  const {
    generalFeedbackModal,
    handleOpenGeneralFeedbackModal,
    handleCloseGeneralFeedbackModal,
    handleGeneralFeedbackChange,
    handleSubmitGeneralFeedback
  } = useGeneralFeedback('footer');

  return (
    <footer className="bg-shadowforce border-t border-guardian/20 py-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-guardian text-sm font-jakarta">
              © 2025 Super Recruiter. Get high-quality candidates your job postings won't reach.
            </p>
          </div>
          <div className="flex space-x-8">
            <Link to="/privacy" className="text-guardian hover:text-supernova text-sm font-jakarta font-medium transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-guardian hover:text-supernova text-sm font-jakarta font-medium transition-colors">
              Terms of Service
            </Link>
            <button 
              onClick={handleOpenGeneralFeedbackModal}
              className="text-guardian hover:text-supernova text-sm font-jakarta font-medium transition-colors"
            >
              Feedback
            </button>
            <a href="mailto:alex@superrecruiter.io" className="text-guardian hover:text-supernova text-sm font-jakarta font-medium transition-colors">
              Contact Us
            </a>
          </div>
        </div>
      </div>
      
      {/* General Feedback Modal */}
      <GeneralFeedbackModal
        isOpen={generalFeedbackModal.isOpen}
        feedback={generalFeedbackModal.feedback}
        isSubmitting={generalFeedbackModal.isSubmitting}
        onClose={handleCloseGeneralFeedbackModal}
        onFeedbackChange={handleGeneralFeedbackChange}
        onSubmit={handleSubmitGeneralFeedback}
      />
    </footer>
  );
};