import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Users } from 'lucide-react';
import { FREE_TIER_ID } from '../../../config/tiers.config';
import { CandidateProfile } from '../../../types';

interface SimpleSummaryStepProps {
  formData: {
    companyName: string;
    title: string;
    description: string;
    industry: string;
    seniorityLevel: string;
    country: string;
    city: string;
    state: string;
    isRemote: boolean;
    salaryRangeMin: string;
    salaryRangeMax: string;
    mustHaveSkills: string[];
    candidatesRequested: string;
    selectedProfileTemplate?: string;
  };
  selectedProfile?: CandidateProfile;
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
  selectedProfile,
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
  
  // Set default based on user tier - all users get 50 by default
  const isFreeUser = userProfile?.tierId === FREE_TIER_ID;
  const defaultCandidates = 50;
  const candidatesRequested = parseInt(formData.candidatesRequested) || defaultCandidates;
  
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
        
        <div className="mb-6 px-4">
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
                   background: `linear-gradient(to right, #FFCF00 0%, #FFCF00 ${((candidatesRequested - 20) / (200 - 20)) * 100}%, #111111 ${((candidatesRequested - 20) / (200 - 20)) * 100}%, #111111 100%)`
                 }}
               />
               <input
                 type="range"
                 name="candidatesRequested"
                 min="20"
                 max="200"
                 step="10"
                 value={candidatesRequested}
                 onChange={handleSliderChange}
                 className="diamond-slider relative w-full h-3 appearance-none cursor-pointer bg-transparent"
               />
            </div>
            <div className="relative mt-4">
              {/* Helper function to calculate thumb position accounting for slider offset */}
              {(() => {
                const thumbWidth = 28; // Diamond thumb is 28px
                const getThumbPosition = (value: number) => {
                  const percent = (value - 20) / (200 - 20);
                  // Calculate pixel offset: thumb center shifts from left edge
                  // At 0%, thumb is at thumbWidth/2, at 100%, thumb is at width - thumbWidth/2
                  // So we need to shift by: thumbWidth/2 - (percent * thumbWidth)
                  const pixelOffset = (thumbWidth / 2) - (percent * thumbWidth);
                  return `calc(${percent * 100}% + ${pixelOffset}px)`;
                };
                
                return (
                  <>
                    <div className="absolute text-xs text-guardian font-jakarta text-center" style={{left: getThumbPosition(20), transform: 'translateX(-50%)'}}>20</div>
                    <div className="absolute text-xs text-guardian font-jakarta" style={{left: getThumbPosition(50), transform: 'translateX(-50%)'}}>
                      <div className="flex flex-col items-center">
                        <span>50</span>
                        <span className="text-supernova text-[10px] mt-1 whitespace-nowrap">Most Requested</span>
                      </div>
                    </div>
                    <div className="absolute text-xs text-guardian font-jakarta text-center" style={{left: getThumbPosition(80), transform: 'translateX(-50%)'}}>80</div>
                    <div className="absolute text-xs text-guardian font-jakarta text-center" style={{left: getThumbPosition(110), transform: 'translateX(-50%)'}}>110</div>
                    <div className="absolute text-xs text-guardian font-jakarta text-center" style={{left: getThumbPosition(140), transform: 'translateX(-50%)'}}>140</div>
                    <div className="absolute text-xs text-guardian font-jakarta text-center" style={{left: getThumbPosition(170), transform: 'translateX(-50%)'}}>170</div>
                    <div className="absolute text-xs text-guardian font-jakarta text-center" style={{left: getThumbPosition(200), transform: 'translateX(-50%)'}}>200</div>
                  </>
                );
              })()}
            </div>
          </div>
          
          <div className="text-center mt-16">
            <div className="flex items-center justify-center gap-3">
              <input
                type="number"
                name="candidatesRequested"
                min="20"
                max="999"
                value={candidatesRequested}
                onChange={onChange}
                className="w-24 px-3 py-2 bg-shadowforce border border-guardian/30 rounded-lg text-white-knight font-jakarta text-center text-xl font-bold focus:border-supernova focus:outline-none"
                placeholder="#"
              />
              <span className="text-guardian font-jakarta">candidates</span>
            </div>
          </div>
          
          {exceedsCredits && (
            <div className="mt-4 space-y-4">
              <p className="text-red-400 font-jakarta font-semibold text-sm">
                You've requested {candidatesRequested} candidates but only have {userAvailableCredits} credits available. <br/>
                {userProfile?.tierId === FREE_TIER_ID
                  ? 'Free tier credits are one-time only - upgrade to a paid plan for monthly credits.'
                  : 'Please reduce your request or upgrade to a paid tier for more credits.'
                }
              </p>
              <div className="text-center">
                <Button
                  type="button"
                  onClick={() => navigate('/subscription')}
                  className="bg-supernova hover:bg-supernova/90 text-shadowforce font-anton px-6 py-2"
                  size="sm"
                >
                  {userProfile?.tierId === FREE_TIER_ID ? 'UPGRADE PLAN' : 'GET MORE CREDITS'}
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
            <p className="text-lg text-white-knight font-jakarta font-medium">
              {formData.isRemote ? 'Remote' : (() => {
                const countryLabels: { [key: string]: string } = {
                  'US': 'USA',
                  'CA': 'Canada',
                  'GB': 'United Kingdom',
                  'AU': 'Australia',
                  'DE': 'Germany',
                  'FR': 'France',
                  'IN': 'India',
                  'MX': 'Mexico',
                  'BR': 'Brazil',
                  'JP': 'Japan',
                  'SG': 'Singapore',
                  'NL': 'Netherlands',
                  'SE': 'Sweden',
                  'CH': 'Switzerland',
                  'IE': 'Ireland',
                  'NZ': 'New Zealand',
                  'ES': 'Spain',
                  'IT': 'Italy',
                  'PT': 'Portugal',
                  'PL': 'Poland',
                  'OTHER': 'Other'
                };
                const countryName = countryLabels[formData.country] || formData.country;
                if (formData.country === 'US' && formData.state) {
                  return `${formData.city}, ${formData.state}, ${countryName}`;
                } else if (formData.state && formData.state.trim()) {
                  return `${formData.city}, ${formData.state}, ${countryName}`;
                } else {
                  return `${formData.city}, ${countryName}`;
                }
              })()}
            </p>
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

          {/* Profile Template Section */}
          {selectedProfile && (
            <div className="pt-4 border-t border-guardian/30">
              <p className="text-sm font-jakarta font-semibold text-supernova uppercase tracking-wide mb-3">
                Selected Ideal Candidate Profile
              </p>
              <div className="bg-supernova/10 border border-supernova/30 rounded-lg p-4 space-y-3">
                <div className="flex items-baseline justify-between">
                  <p className="text-lg font-jakarta font-bold text-white-knight">
                    {selectedProfile.name}
                  </p>
                  <p className="text-xs text-guardian">
                    {selectedProfile.location} • {selectedProfile.yearsOfExperience} years
                  </p>
                </div>
                
                {selectedProfile.previousWorkExperience.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-supernova mb-1 uppercase tracking-wide">Previous Experience</p>
                    <ul className="space-y-1">
                      {selectedProfile.previousWorkExperience.slice(0, 2).map((exp, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-supernova mr-2 text-xs">•</span>
                          <span className="text-white-knight font-jakarta text-xs">{exp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {selectedProfile.relevantSkills.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-supernova mb-1 uppercase tracking-wide">Relevant Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedProfile.relevantSkills.slice(0, 5).map((skill, i) => (
                        <span 
                          key={i}
                          className="px-2 py-0.5 bg-supernova/20 text-white-knight font-jakarta text-xs rounded-full border border-supernova/40"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
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
           'SUBMIT'}
        </Button>
      </div>
    </div>
  );
};