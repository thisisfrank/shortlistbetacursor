import React from 'react';
import { X, Mail, ExternalLink, Download, CheckCircle, FileText } from 'lucide-react';
import { Button } from './Button';

interface CandidateEmailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const clayTemplates = [
  {
    title: 'Get Candidate Emails',
    url: 'https://www.clay.com/templates/how-clay-uses-clay-to-find-prioritize-and-reach-out-to-job-candidates'
  }
];

export const CandidateEmailsModal: React.FC<CandidateEmailsModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const handleAccessClay = () => {
    // Open Clay with referral link
    window.open('https://www.clay.com/?via=bae546', '_blank');
  };

  const handleTemplateClick = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-shadowforce/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative max-w-2xl w-full mx-4 bg-shadowforce-light rounded-xl shadow-2xl border from-supernova/20 to-supernova/10 border-supernova/30 transform transition-all duration-300 scale-100">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-guardian hover:text-white-knight transition-colors duration-200 z-10"
        >
          <X size={20} />
        </button>

        <div className="p-6">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="p-3 bg-supernova/20 rounded-full">
                <Mail size={32} className="text-supernova" />
              </div>
              <div className="absolute inset-0 bg-supernova/30 blur-lg rounded-full"></div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-anton text-white-knight text-center mb-6 uppercase tracking-wide">
            Get Candidate Emails
          </h2>

          {/* Features List */}
          <div className="bg-shadowforce/50 rounded-lg p-6 mb-6 border border-guardian/20">
            <h3 className="text-lg font-semibold text-white-knight font-jakarta mb-4 text-center">
              What's Included:
            </h3>
            <ul className="grid grid-cols-2 gap-3">
              <li className="flex items-start gap-2">
                <CheckCircle size={18} className="text-supernova flex-shrink-0 mt-0.5" />
                <span className="text-guardian text-sm">Verified email addresses</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={18} className="text-supernova flex-shrink-0 mt-0.5" />
                <span className="text-guardian text-sm">Pre-configured Clay tables</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={18} className="text-supernova flex-shrink-0 mt-0.5" />
                <span className="text-guardian text-sm">Email validation tools</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={18} className="text-supernova flex-shrink-0 mt-0.5" />
                <span className="text-guardian text-sm">Seamless integration</span>
              </li>
            </ul>
          </div>

          {/* Pre-built Templates */}
          <div className="bg-shadowforce/50 rounded-lg p-5 mb-6 border border-guardian/20">
            <h3 className="text-lg font-semibold text-white-knight font-jakarta mb-3 text-center">
              Pre-Built Templates:
            </h3>
            <div className="space-y-2">
              {clayTemplates.map((template, index) => (
                <button
                  key={index}
                  onClick={() => handleTemplateClick(template.url)}
                  className="w-full text-left p-3 bg-shadowforce border border-guardian/30 hover:border-supernova/50 rounded-lg transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm text-guardian group-hover:text-white-knight transition-colors">
                      {template.title}
                    </span>
                    <ExternalLink size={16} className="text-supernova flex-shrink-0 mt-0.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center">
            <Button
              variant="primary"
              onClick={handleAccessClay}
              className="glow-supernova"
            >
              Unlock 3,000 Free Clay Credits
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

