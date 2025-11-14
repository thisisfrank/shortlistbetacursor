import React from 'react';
import { CandidateProfile } from '../../services/candidateProfileService';
import { MapPin, Briefcase, Award, Layers } from 'lucide-react';

interface ProfileCardProps {
  profile: CandidateProfile;
  isSelected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  isSelected,
  onToggle,
  disabled = false
}) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`w-full p-5 rounded-xl border-2 transition-all duration-200 text-left ${
        isSelected
          ? 'border-supernova bg-supernova/10'
          : 'border-guardian/30 bg-shadowforce/50 hover:border-guardian/50'
      } ${disabled && !isSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {/* Header with checkbox */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="text-lg font-jakarta font-bold text-white-knight">
            {profile.name}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <MapPin size={14} className="text-guardian" />
            <span className="text-sm text-guardian font-jakarta">
              {profile.location}
            </span>
          </div>
        </div>
        
        {/* Custom checkbox */}
        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 ${
          isSelected
            ? 'border-supernova bg-supernova'
            : 'border-guardian/50'
        }`}>
          {isSelected && (
            <svg
              className="w-4 h-4 text-shadowforce"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M5 13l4 4L19 7"></path>
            </svg>
          )}
        </div>
      </div>

      {/* Years of Experience */}
      <div className="flex items-center gap-2 mb-3">
        <Award size={14} className="text-supernova" />
        <span className="text-sm font-jakarta font-semibold text-supernova">
          {profile.yearsOfExperience} {profile.yearsOfExperience === 1 ? 'year' : 'years'} of experience
        </span>
      </div>

      {/* Previous Work Experience */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <Briefcase size={14} className="text-supernova" />
          <span className="text-xs font-jakarta font-semibold text-supernova uppercase tracking-wide">
            Previous Experience
          </span>
        </div>
        <div className="space-y-1 ml-5">
          {profile.previousWorkExperience.map((exp, index) => (
            <p key={index} className="text-sm text-white-knight font-jakarta">
              • {exp}
            </p>
          ))}
        </div>
      </div>

      {/* Key Projects */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <Layers size={14} className="text-supernova" />
          <span className="text-xs font-jakarta font-semibold text-supernova uppercase tracking-wide">
            Key Projects
          </span>
        </div>
        <div className="space-y-1 ml-5">
          {profile.keyProjects.map((project, index) => (
            <p key={index} className="text-sm text-white-knight font-jakarta">
              • {project}
            </p>
          ))}
        </div>
      </div>

      {/* Skills */}
      <div>
        <span className="text-xs font-jakarta font-semibold text-supernova uppercase tracking-wide block mb-2">
          Relevant Skills
        </span>
        <div className="flex flex-wrap gap-2">
          {profile.relevantSkills.map((skill, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-supernova/20 border border-supernova/40 rounded text-xs font-jakarta text-white-knight"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
};

