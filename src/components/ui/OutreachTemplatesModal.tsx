import React from 'react';
import { X, Linkedin, Mail } from 'lucide-react';

interface OutreachTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OutreachTemplatesModal: React.FC<OutreachTemplatesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleOpenLinkedIn = () => {
    window.open('https://superrecruiterresources.notion.site/LinkedIn-Templates-to-candidates-2567773d39ea801598f1c43bb68cd2b6', '_blank');
  };

  const handleOpenEmail = () => {
    window.open('https://superrecruiterresources.notion.site/Email-Templates-to-candidates-2557773d39ea8069ba73c20a8a24d613', '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-shadowforce border border-guardian/20 rounded-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-guardian hover:text-white-knight transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold text-white-knight font-jakarta mb-2">
          Outreach Templates
        </h2>
        <p className="text-guardian text-sm mb-6">
          Choose which templates you'd like to access
        </p>

        <div className="space-y-3">
          <button
            onClick={handleOpenLinkedIn}
            className="w-full flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500 rounded-lg hover:bg-blue-500/20 transition-colors group"
          >
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Linkedin size={24} className="text-blue-500" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-white-knight mb-1">LinkedIn Templates</h3>
              <p className="text-sm text-guardian">Messages that get replies on LinkedIn</p>
            </div>
          </button>

          <button
            onClick={handleOpenEmail}
            className="w-full flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500 rounded-lg hover:bg-orange-500/20 transition-colors group"
          >
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Mail size={24} className="text-orange-500" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-white-knight mb-1">Email Templates</h3>
              <p className="text-sm text-guardian">Professional email outreach templates</p>
            </div>
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2 text-guardian hover:text-white-knight transition-colors text-sm"
        >
          Close
        </button>
      </div>
    </div>
  );
};

