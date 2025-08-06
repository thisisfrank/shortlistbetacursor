import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Users } from 'lucide-react';

interface SimpleSummaryStepProps {
  formData: {
    companyName: string;
    contactName: string;
    email: string;
    phone: string;
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
  const { user } = useAuth();
  const { tiers } = useData();
  
  // Helper function to extract numeric value from formatted currency
  const extractNumericValue = (formattedValue: string): number => {
    const numericString = formattedValue.replace(/[$,]/g, '');
    return parseInt(numericString) || 0;
  };
  
  // Get free tier for displaying limits
  const freeTier = tiers.find(tier => tier.name === 'Free');
  const maxCandidates = freeTier?.monthlyCandidateAllotment || 20;
  const candidatesRequested = parseInt(formData.candidatesRequested) || 1;
  
  // Check if request exceeds available credits
  const exceedsCredits = candidatesRequested > maxCandidates;
  
  return (
    <div className="space-y-8 animate-fadeIn">
     
      {/* Candidate Credit System */}
      <div className="bg-shadowforce border border-guardian/30 p-8 rounded-xl text-center">
        <div className="flex items-center justify-center mb-6">
          <Users className="text-supernova mr-3" size={32} />
          <h3 className="text-2xl font-anton text-white uppercase tracking-wide">How Many Candidate Credits Do You Need for this Job?</h3>
        </div>
        
        <div className="mb-6">
          <p className="text-white-knight font-jakarta text-sm mb-4">
            <strong>How it works:</strong> You can use candidate credits to get a complete profile including their name, 
            LinkedIn URL, and a comprehensive info card with their experience, education, skills, and AI-generated summary.
          </p>
        </div>
        
        <div className="mb-6">
          <div className="relative">
            <input
              type="range"
              name="candidatesRequested"
              min="1"
              max={maxCandidates}
              value={candidatesRequested}
              onChange={onChange}
              className="w-full h-2 bg-shadowforce rounded-full appearance-none cursor-pointer 
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                [&::-webkit-slider-thumb]:bg-supernova [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:shadow-lg
                [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:bg-supernova 
                [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
              style={{
                background: `linear-gradient(to right, #FFCF00 0%, #FFCF00 ${((candidatesRequested - 1) / (maxCandidates - 1)) * 100}%, #111111 ${((candidatesRequested - 1) / (maxCandidates - 1)) * 100}%, #111111 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-guardian font-jakarta mt-2">
              <span>1</span>
              <span>{Math.floor((maxCandidates - 1) * 0.25) + 1}</span>
              <span>{Math.floor((maxCandidates - 1) * 0.5) + 1}</span>
              <span>{Math.floor((maxCandidates - 1) * 0.75) + 1}</span>
              <span>{maxCandidates}</span>
            </div>
          </div>
          
          <div className="text-center mt-4">
            <span className="text-2xl font-anton text-supernova">{candidatesRequested}</span>
            <span className="text-guardian font-jakarta ml-2">/ {maxCandidates} credits</span>
          </div>
          
          {exceedsCredits && (
            <div className="mt-4">
              <p className="text-red-400 font-jakarta font-semibold">
                ⚠️ You've requested {candidatesRequested} candidates but only have {maxCandidates} credits available. 
                Please reduce your request or upgrade to a paid tier for more credits.
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-shadowforce border border-guardian/30 p-8 rounded-xl">
        <h3 className="text-xl font-anton text-supernova mb-6 uppercase tracking-wide">Company Information</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-jakarta font-semibold text-guardian/80 uppercase tracking-wide">Company</p>
              <p className="text-lg text-white-knight font-jakarta font-medium">{formData.companyName}</p>
            </div>
            <div>
              <p className="text-sm font-jakarta font-semibold text-guardian/80 uppercase tracking-wide">Contact</p>
              <p className="text-lg text-white-knight font-jakarta font-medium">{formData.contactName}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-jakarta font-semibold text-guardian/80 uppercase tracking-wide">Email</p>
              <p className="text-lg text-white-knight font-jakarta font-medium">{formData.email}</p>
            </div>
            <div>
              <p className="text-sm font-jakarta font-semibold text-guardian/80 uppercase tracking-wide">Phone</p>
              <p className="text-lg text-white-knight font-jakarta font-medium">{formData.phone}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-shadowforce border border-guardian/30 p-8 rounded-xl">
        <h3 className="text-xl font-anton text-supernova mb-6 uppercase tracking-wide">Job Details</h3>
        <div className="space-y-6">
          <div>
            <p className="text-sm font-jakarta font-semibold text-guardian/80 uppercase tracking-wide">Title</p>
            <p className="text-2xl font-anton text-white-knight">{formData.title}</p>
          </div>
          
          <div>
            <p className="text-sm font-jakarta font-semibold text-guardian/80 uppercase tracking-wide">Description</p>
            <p className="text-white-knight font-jakarta leading-relaxed whitespace-pre-line">{formData.description}</p>
          </div>
          
          {formData.industry && (
            <div>
              <p className="text-sm font-jakarta font-semibold text-guardian/80 uppercase tracking-wide">Industry</p>
              <p className="text-lg text-white-knight font-jakarta font-medium">{formData.industry}</p>
            </div>
          )}
          
          <div className="flex gap-3">
            <Badge>{formData.seniorityLevel}</Badge>
            <Badge>{formData.isRemote ? 'Remote' : `${formData.city}, ${formData.state}`}</Badge>
          </div>
          
          <div>
            <p className="text-sm font-jakarta font-semibold text-guardian/80 uppercase tracking-wide">Salary Range</p>
            <p className="text-xl font-jakarta font-bold text-supernova">
              ${extractNumericValue(formData.salaryRangeMin).toLocaleString()} - ${extractNumericValue(formData.salaryRangeMax).toLocaleString()} USD
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-shadowforce border border-guardian/30 p-8 rounded-xl">
        <h3 className="text-xl font-anton text-supernova mb-6 uppercase tracking-wide">Key Selling Points</h3>
        <ul className="space-y-3">
          {formData.mustHaveSkills.map((point, index) => (
            <li key={index} className="flex items-start">
              <span className="text-supernova mr-3 font-bold">•</span>
              <span className="text-white-knight font-jakarta">{point}</span>
            </li>
          ))}
        </ul>
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
           'SUBMIT JOB REQUEST'}
        </Button>
      </div>
    </div>
  );
};