import React from 'react';
import { Button } from '../../ui/Button';
import { CheckCircle, Zap, Clock, Users } from 'lucide-react';

interface ConfirmationStepProps {
  onReset: () => void;
}

export const ConfirmationStep: React.FC<ConfirmationStepProps> = ({ onReset }) => {
  return (
    <div className="text-center py-8 animate-fadeIn">
      <div className="flex justify-center mb-6">
        <div className="relative">
          <CheckCircle size={48} className="text-supernova animate-pulse" />
          <div className="absolute inset-0 bg-supernova/30 blur-xl rounded-full"></div>
        </div>
      </div>
      
      <h2 className="text-4xl font-anton text-white-knight mb-6 uppercase tracking-wide">
        REQUEST SUBMITTED SUCCESSFULLY!
      </h2>
      
      <div className="bg-supernova/10 border border-supernova/30 p-6 rounded-xl mb-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-center mb-4">
          <h3 className="font-anton text-2xl text-supernova uppercase">What Happens Next</h3>
        </div>
        
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute top-4 left-0 right-0 h-1 bg-supernova/30 rounded-full"></div>
          <div className="absolute top-4 left-0 w-full h-1 bg-gradient-to-r from-supernova via-supernova to-supernova/30 rounded-full"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {/* Right Now */}
            <div className="text-center relative">
              <div className="bg-supernova rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-3 relative z-10 border-2 border-shadowforce">
              </div>
              <h4 className="font-anton text-white-knight mb-1 text-lg">RIGHT NOW</h4>
              <p className="text-guardian font-jakarta text-xs">Analyzing your job requirements.</p>
            </div>
            
            {/* Next */}
            <div className="text-center relative">
              <div className="bg-supernova rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-3 relative z-10 border-2 border-shadowforce">
              </div>
              <h4 className="font-anton text-white-knight mb-1 text-lg">NEXT</h4>
              <p className="text-guardian font-jakarta text-xs">We source new candidates for your exact role.</p>
            </div>
            
            {/* Qualify */}
            <div className="text-center relative">
              <div className="bg-supernova rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-3 relative z-10 border-2 border-shadowforce">
              </div>
              <h4 className="font-anton text-white-knight mb-1 text-lg">QUALIFY</h4>
              <p className="text-guardian font-jakarta text-xs">Match and score candidates (remove bad fits).</p>
            </div>
            
            {/* Delivery */}
            <div className="text-center relative">
              <div className="bg-supernova rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-3 relative z-10 border-2 border-shadowforce">
              </div>
              <h4 className="font-anton text-white-knight mb-1 text-lg">DELIVERY</h4>
              <p className="text-guardian font-jakarta text-xs">Get high-quality candidates sent straight to your email.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-lg font-jakarta font-semibold text-supernova">
          Your candidates will be emailed to you shortly!
        </p>
      </div>
      
      <Button onClick={onReset} size="lg" className="glow-supernova">
        SUBMIT ANOTHER JOB REQUEST
      </Button>
    </div>
  );
};