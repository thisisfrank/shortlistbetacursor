import React from 'react';
import { Button } from '../../ui/Button';
import { CheckCircle, Zap, Clock, Users } from 'lucide-react';

interface ConfirmationStepProps {
  onReset: () => void;
}

export const ConfirmationStep: React.FC<ConfirmationStepProps> = ({ onReset }) => {
  return (
    <div className="text-center py-12 animate-fadeIn">
      <div className="flex justify-center mb-8">
        <div className="relative">
          <CheckCircle size={80} className="text-supernova animate-pulse" />
          <div className="absolute inset-0 bg-supernova/30 blur-2xl rounded-full"></div>
        </div>
      </div>
      
      <h2 className="text-4xl font-anton text-white-knight mb-12 uppercase tracking-wide">
        REQUEST SUBMITTED SUCCESSFULLY!
      </h2>
      

      
      <div className="bg-supernova/10 border border-supernova/30 p-8 rounded-xl mb-12 max-w-3xl mx-auto">
        <div className="flex items-center justify-center mb-6">
          <h3 className="font-anton text-2xl text-supernova uppercase">What Happens Next</h3>
        </div>
        
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute top-4 left-0 right-0 h-1 bg-supernova/30 rounded-full"></div>
          <div className="absolute top-4 left-0 w-full h-1 bg-gradient-to-r from-supernova via-supernova to-supernova/30 rounded-full"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Hour 1 */}
            <div className="text-center relative">
              <div className="bg-supernova rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-4 relative z-10 border-2 border-shadowforce">
              </div>
              <h4 className="font-anton text-white-knight mb-2 text-lg">AI ANALYSIS</h4>
              <p className="text-guardian font-jakarta text-xs">Requirements processed and candidate profiles identified</p>
            </div>
            
            {/* Hour 6 */}
            <div className="text-center relative">
              <div className="bg-supernova rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-4 relative z-10 border-2 border-shadowforce">
              </div>
              <h4 className="font-anton text-white-knight mb-2 text-lg">SOURCING</h4>
              <p className="text-guardian font-jakarta text-xs">Expert sourcers begin candidate search and screening</p>
            </div>
            
            {/* Hour 18 */}
            <div className="text-center relative">
              <div className="bg-supernova rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-4 relative z-10 border-2 border-shadowforce">
              </div>
              <h4 className="font-anton text-white-knight mb-2 text-lg">CURATION</h4>
              <p className="text-guardian font-jakarta text-xs">Profiles reviewed and shortlist curated</p>
            </div>
            
            {/* Hour 24 */}
            <div className="text-center relative">
              <div className="bg-supernova rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-4 relative z-10 border-2 border-shadowforce">
              </div>
              <h4 className="font-anton text-white-knight mb-2 text-lg">DELIVERY</h4>
              <p className="text-guardian font-jakarta text-xs">Complete shortlist delivered to your inbox</p>
            </div>
          </div>
        </div>
      </div>
      
      <Button onClick={onReset} size="lg" className="glow-supernova">
        SUBMIT ANOTHER JOB REQUEST
      </Button>
    </div>
  );
};