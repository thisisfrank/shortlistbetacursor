import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-shadowforce border-t border-guardian/20 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <div className="sr-logo text-xl mb-2">
              <span className="text-supernova">SUPER</span>
              <span className="text-white-knight ml-1">RECRUITER</span>
            </div>
            <p className="text-guardian text-sm font-jakarta">
              © {new Date().getFullYear()} Super Recruiter. Transforming recruitment through AI technology.
            </p>
          </div>
          <div className="flex space-x-8">
            <a href="#" className="text-guardian hover:text-supernova text-sm font-jakarta font-medium transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-guardian hover:text-supernova text-sm font-jakarta font-medium transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-guardian hover:text-supernova text-sm font-jakarta font-medium transition-colors">
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};