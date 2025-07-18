import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Users, User } from 'lucide-react';

interface SimpleSummaryStepProps {
  formData: {
    companyName: string;
    contactName: string;
    email: string;
    phone: string;
    title: string;
    description: string;
    seniorityLevel: string;
    workArrangement: string;
    location: string;
    salaryRangeMin: string;
    salaryRangeMax: string;
    keySellingPoints: string[];
    candidatesRequested: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
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
  
  // Get free tier for displaying limits
  const freeTier = tiers.find(tier => tier.name === 'Free');
  const maxCandidates = freeTier?.monthlyCandidateAllotment || 20;
  const candidatesRequested = parseInt(formData.candidatesRequested) || 1;
  
  // Check if request exceeds available credits
  const exceedsCredits = candidatesRequested > maxCandidates;
  
  return (
    <div className="space-y-8 animate-fadeIn">
      <h2 className="text-3xl font-anton text-guardian mb-12 uppercase tracking-wide">Review Your Job Request</h2>
      
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
          
          <div className="flex gap-3">
            <Badge>{formData.seniorityLevel}</Badge>
            <Badge>{formData.workArrangement}</Badge>
            <Badge>{formData.location}</Badge>
          </div>
          
          <div>
            <p className="text-sm font-jakarta font-semibold text-guardian/80 uppercase tracking-wide">Salary Range</p>
            <p className="text-xl font-jakarta font-bold text-supernova">
              ${parseInt(formData.salaryRangeMin).toLocaleString()} - ${parseInt(formData.salaryRangeMax).toLocaleString()} USD
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-shadowforce border border-guardian/30 p-8 rounded-xl">
        <h3 className="text-xl font-anton text-supernova mb-6 uppercase tracking-wide">Key Selling Points</h3>
        <ul className="space-y-3">
          {formData.keySellingPoints.map((point, index) => (
            <li key={index} className="flex items-start">
              <span className="text-supernova mr-3 font-bold">•</span>
              <span className="text-white-knight font-jakarta">{point}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Candidate Credit System */}
      <div className="p-8">
        <div className="flex items-center mb-6">
          <Users className="text-supernova mr-3" size={32} />
          <h3 className="text-2xl font-anton text-supernova uppercase tracking-wide">Candidate Credits</h3>
        </div>
        
        <div className="mb-6">
          <p className="text-white-knight font-jakarta text-sm mb-4">
            <strong>How it works:</strong> Each candidate credit gives you a complete profile including their name, 
            LinkedIn URL, and a comprehensive info card with their experience, education, skills, and AI-generated summary.
          </p>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <label className="text-lg font-anton text-white-knight uppercase tracking-wide">
              Number of Candidates Requested
            </label>
            <div className="text-right">
              <span className="text-2xl font-anton text-supernova">{candidatesRequested}</span>
              <span className="text-guardian font-jakarta ml-2">/ {maxCandidates} credits</span>
            </div>
          </div>
          
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
                background: `linear-gradient(to right, #FFCF00 0%, #FFCF00 ${(candidatesRequested / maxCandidates) * 100}%, #111111 ${(candidatesRequested / maxCandidates) * 100}%, #111111 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-guardian font-jakarta mt-2">
              <span>1</span>
              <span>{Math.floor(maxCandidates / 4)}</span>
              <span>{Math.floor(maxCandidates / 2)}</span>
              <span>{Math.floor((maxCandidates * 3) / 4)}</span>
              <span>{maxCandidates}</span>
            </div>
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
      
      {/* User Info */}
      {user && (
        <div className="bg-supernova/10 border border-supernova/30 p-8 rounded-xl">
          <div className="flex items-center mb-4">
            <User className="text-supernova mr-3" size={32} />
            <h3 className="text-2xl font-anton text-supernova uppercase tracking-wide">
              Submitting As
            </h3>
          </div>
          <div className="bg-shadowforce border border-guardian/20 p-6 rounded-lg">
            <p className="text-supernova font-jakarta font-semibold mb-2">
              Logged in as: <span className="font-anton text-white-knight text-lg">{user.email}</span>
            </p>
            <p className="text-guardian font-jakarta text-sm">
              This job request will be linked to your account for easy tracking and candidate delivery.
            </p>
          </div>
        </div>
      )}
      
      <div className="flex pt-8 gap-6">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onBack}
          className="flex-1"
          disabled={isSubmitting}
          size="lg"
        >
          BACK
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