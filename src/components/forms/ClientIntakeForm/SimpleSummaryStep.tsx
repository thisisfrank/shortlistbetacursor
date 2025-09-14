import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Users } from 'lucide-react';

interface SimpleSummaryStepProps {
  formData: {
    companyName: string;
    title: string;
    description: string;
    industry: string;
    seniorityLevel: string;
    city: string;
    state: string;
    isRemote: boolean;
    salaryRangeMin: string;
    salaryRangeMax: string;
    mustHaveSkills: string[];
    candidatesRequested: string;
  };
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  errors?: Record<string, string>;
}

export const SimpleSummaryStep: React.FC<SimpleSummaryStepProps> = ({
  formData,
  onChange,
  onSubmit,
  onBack,
  isSubmitting
}) => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  // Helper function to extract numeric value from formatted currency
  const extractNumericValue = (formattedValue: string): number => {
    const numericString = formattedValue.replace(/[$,]/g, '');
    return parseInt(numericString) || 0;
  };
  
  // Get user's actual available credits
  const userAvailableCredits = userProfile?.availableCredits || 0;
  const candidatesRequested = parseInt(formData.candidatesRequested) || 1;
  
  // Handle slider changes with continuous values
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
  };
  
  // Check if request exceeds user's available credits
  const exceedsCredits = candidatesRequested > userAvailableCredits;
  
  return (
    <div className="space-y-8 animate-fadeIn">
     
      {/* Candidate Credit System */}
      <div className="bg-shadowforce border border-guardian/30 p-8 rounded-xl text-center">
        <div className="flex items-center justify-center mb-6">
          <Users className="text-supernova mr-3" size={32} />
          <h3 className="text-2xl font-anton text-white uppercase tracking-wide">How many candidates are you looking for?</h3>
        </div>
        
        <div className="mb-6">
          <p className="text-white-knight font-jakarta text-sm mb-4">
            <strong>Choose the number of candidates you want - each comes with a full profile, LinkedIn, and summary</strong>
      
          </p>
        </div>
        
        <div className="mb-6">
          <div className="relative">
            <style>{`
              .diamond-slider {
                background: transparent;
              }
              .diamond-slider::-webkit-slider-thumb {
                appearance: none;
                width: 28px;
                height: 28px;
                background: #FFCF00;
                cursor: pointer;
                border: 0;
                box-shadow: 0 6px 20px rgba(255, 207, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3);
                transform: rotate(45deg);
                border-radius: 4px;
                position: relative;
                z-index: 10;
                margin-top: -8px;
              }
              .diamond-slider::-moz-range-thumb {
                width: 28px;
                height: 28px;
                background: #FFCF00;
                cursor: pointer;
                border: 0;
                border-radius: 4px;
                transform: rotate(45deg);
                box-shadow: 0 6px 20px rgba(255, 207, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3);
                position: relative;
              }
              .diamond-slider::-webkit-slider-track {
                width: 100%;
                height: 12px;
                background: transparent;
                border-radius: 6px;
              }
              .diamond-slider::-moz-range-track {
                width: 100%;
                height: 12px;
                background: transparent;
                border-radius: 6px;
                border: none;
              }
            `}</style>
            <div className="relative">
              {/* Custom track background */}
              <div 
                className="absolute top-1/2 transform -translate-y-1/2 w-full h-3 bg-shadowforce rounded-full"
                style={{
                  background: `linear-gradient(to right, #FFCF00 0%, #FFCF00 ${((candidatesRequested - 1) / 99) * 100}%, #111111 ${((candidatesRequested - 1) / 99) * 100}%, #111111 100%)`
                }}
              />
              <input
                type="range"
                name="candidatesRequested"
                min="1"
                max="100"
                step="1"
                value={candidatesRequested}
                onChange={handleSliderChange}
                className="diamond-slider relative w-full h-3 appearance-none cursor-pointer bg-transparent"
              />
            </div>
            <div className="relative mt-2">
              <div className="absolute text-xs text-guardian font-jakarta transform -translate-x-1/2" style={{left: 'calc(0% + 14px)'}}>1</div>
              <div className="absolute text-xs text-guardian font-jakarta transform -translate-x-1/2" style={{left: 'calc(25% + 7px)'}}>20</div>
              <div className="absolute text-xs text-guardian font-jakarta transform -translate-x-1/2" style={{left: '50%'}}>40</div>
              <div className="absolute text-xs text-guardian font-jakarta transform -translate-x-1/2" style={{left: 'calc(75% - 7px)'}}>60</div>
              <div className="absolute text-xs text-guardian font-jakarta transform -translate-x-1/2" style={{left: 'calc(100% - 14px)'}}>100</div>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <div className="flex items-center justify-center gap-3">
              <input
                type="number"
                name="candidatesRequested"
                min="1"
                max="999"
                value={candidatesRequested}
                onChange={onChange}
                className="w-24 px-3 py-2 bg-shadowforce border border-guardian/30 rounded-lg text-white-knight font-jakarta text-center text-xl font-bold focus:border-supernova focus:outline-none"
                placeholder="#"
              />
              <span className="text-guardian font-jakarta">/ {userAvailableCredits} credits available</span>
            </div>
          </div>
          
          {exceedsCredits && (
            <div className="mt-4 space-y-4">
              <p className="text-red-400 font-jakarta font-semibold">
                You've requested {candidatesRequested} candidates but only have {userAvailableCredits} credits available. <br/>
                Please reduce your request or upgrade to a paid tier for more credits.
              </p>
              <div className="text-center">
                <Button
                  type="button"
                  onClick={() => navigate('/subscription')}
                  className="bg-supernova hover:bg-supernova/90 text-shadowforce font-anton px-6 py-2"
                  size="sm"
                >
                  GET MORE CREDITS
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-shadowforce border border-guardian/30 p-8 rounded-xl">
        <h3 className="text-xl font-anton text-supernova mb-6 uppercase tracking-wide">Details</h3>
        <div className="space-y-6">
          <div>
            <p className="text-sm font-jakarta font-semibold text-supernova uppercase tracking-wide">Position Title</p>
            <p className="text-2xl font-anton text-white-knight">{formData.title}</p>
          </div>
          
          <div>
            <p className="text-sm font-jakarta font-semibold text-supernova uppercase tracking-wide">Company</p>
            <p className="text-lg text-white-knight font-jakarta font-medium">{formData.companyName}</p>
          </div>
          
          <div>
            <p className="text-sm font-jakarta font-semibold text-supernova uppercase tracking-wide">Description</p>
            <p className="text-white-knight font-jakarta leading-relaxed whitespace-pre-line">{formData.description}</p>
          </div>
          
          {formData.industry && (
            <div>
              <p className="text-sm font-jakarta font-semibold text-supernova uppercase tracking-wide">Industry</p>
              <p className="text-lg text-white-knight font-jakarta font-medium">{formData.industry}</p>
            </div>
          )}
          
          <div>
            <p className="text-sm font-jakarta font-semibold text-supernova uppercase tracking-wide">Experience Level</p>
            <p className="text-lg text-white-knight font-jakarta font-medium">{formData.seniorityLevel}</p>
          </div>
          
          <div>
            <p className="text-sm font-jakarta font-semibold text-supernova uppercase tracking-wide">Location</p>
            <p className="text-lg text-white-knight font-jakarta font-medium">{formData.isRemote ? 'Remote' : `${formData.city}, ${formData.state}`}</p>
          </div>
          
          <div>
            <p className="text-sm font-jakarta font-semibold text-supernova uppercase tracking-wide">Key Skills</p>
            <ul className="space-y-2 mt-2">
              {formData.mustHaveSkills.map((point, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-supernova mr-3 font-bold">•</span>
                  <span className="text-white-knight font-jakarta">{point}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <p className="text-sm font-jakarta font-semibold text-supernova uppercase tracking-wide">Salary Range</p>
            <p className="text-xl font-jakarta font-bold text-white-knight">
              ${extractNumericValue(formData.salaryRangeMin).toLocaleString()} - ${extractNumericValue(formData.salaryRangeMax).toLocaleString()} USD
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex pt-8 gap-6">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onBack}
          className="flex-1"
          disabled={isSubmitting}
          size="lg"
        >
          EDIT JOB
        </Button>
        
        <Button 
          type="button"
          onClick={onSubmit}
          disabled={exceedsCredits}
          className="flex-1"
          isLoading={isSubmitting}
          size="lg"
        >
          {isSubmitting ? 'PROCESSING...' : 
           exceedsCredits ? 'INSUFFICIENT CREDITS' : 
           'SUBMIT FOR CANDIDATE SOURCING'}
        </Button>
      </div>
    </div>
  );
};