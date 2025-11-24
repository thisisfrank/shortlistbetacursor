import React from 'react';
import { Link } from 'react-router-dom';
import { Linkedin, Twitter } from 'lucide-react';
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
    <footer className="bg-shadowforce border-t border-guardian/20 py-6 md:py-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
          {/* Copyright */}
          <div className="text-center md:text-left mb-2 md:mb-0">
            <p className="text-guardian text-sm font-jakarta">
              2025 Super Recruiter. Get high-quality candidates.
            </p>
          </div>
          
          {/* Social Media Icons - Mobile: Center, Desktop: Right */}
          <div className="flex items-center justify-center space-x-4 mb-2 md:mb-0">
            <a 
              href="https://www.linkedin.com/company/superrecruiterio" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-guardian hover:text-supernova transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin size={20} />
            </a>
            <a 
              href="https://x.com/ResumeManSR" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-guardian hover:text-supernova transition-colors"
              aria-label="Twitter"
            >
              <Twitter size={20} />
            </a>
            <a 
              href="https://discord.gg/by5xRxWQjG" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-guardian hover:text-supernova transition-colors"
              aria-label="Discord"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M9.5 7.5c0 .83-.67 1.5-1.5 1.5S6.5 8.33 6.5 7.5 7.17 6 8 6s1.5.67 1.5 1.5zm7 0c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5S14.17 6 15 6s1.5.67 1.5 1.5z"/>
                <path d="M20.38 6.62c-1.73-2.66-5.04-4.12-7.88-4.12-2.84 0-6.15 1.46-7.88 4.12a23.83 23.83 0 0 0-2.87 10.38c2.09 2.34 5.58 3.5 8.25 3.5 1.39 0 2.82-.23 4.13-.7.38-.14.81-.05 1.09.23l1.98 1.98c.47.47 1.28.14 1.28-.52v-2.57c1.65-1.2 2.9-3.04 2.9-5.3a11.94 11.94 0 0 0-2.87-6z"/>
              </svg>
            </a>
          </div>
          
          {/* Links - Mobile: Stack in 2 columns, Desktop: Horizontal */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 md:flex md:items-center md:space-x-6 md:gap-0">
            {/* Divider - Desktop Only */}
            <div className="hidden md:block h-5 w-px bg-guardian/20 md:mr-2"></div>
            
            <Link to="/privacy" className="text-guardian hover:text-supernova text-xs md:text-sm font-jakarta font-medium transition-colors text-center md:text-left">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-guardian hover:text-supernova text-xs md:text-sm font-jakarta font-medium transition-colors text-center md:text-left">
              Terms of Service
            </Link>
            <button 
              onClick={handleOpenGeneralFeedbackModal}
              className="text-guardian hover:text-supernova text-xs md:text-sm font-jakarta font-medium transition-colors text-center md:text-left"
            >
              Feedback
            </button>
            <a href="mailto:alex@superrecruiter.io" className="text-guardian hover:text-supernova text-xs md:text-sm font-jakarta font-medium transition-colors text-center md:text-left">
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