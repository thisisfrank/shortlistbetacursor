import React from 'react';
import { Job } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { JobTimer } from '../ui/JobTimer';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { X, Users } from 'lucide-react';

interface ViewJobDetailsModalProps {
  job: Job;
  onClose: () => void;
  onClaim?: (jobId: string) => void;
}

export const ViewJobDetailsModal: React.FC<ViewJobDetailsModalProps> = ({
  job,
  onClose,
  onClaim
}) => {
  const { userProfile } = useAuth();
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-shadowforce-light rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] flex flex-col overflow-hidden border border-guardian/20">
        <div className="flex justify-between items-center border-b border-guardian/20 p-4 md:p-6 flex-shrink-0">
          <h2 className="text-lg md:text-2xl font-anton text-white-knight uppercase tracking-wide">Job Details</h2>
          <button 
            onClick={onClose}
            className="text-guardian hover:text-supernova transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X size={24} className="md:w-7 md:h-7" />
          </button>
        </div>
        
        <div className="overflow-y-auto p-4 md:p-8 flex-1">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4 md:mb-8 gap-3 md:gap-4">
            <div className="flex-1 space-y-2 md:space-y-1">
              <h3 className="text-xl md:text-3xl font-anton text-white-knight uppercase tracking-tight md:tracking-wide break-words leading-snug md:leading-normal">{job.title}</h3>
              <p className="text-lg md:text-xl text-supernova font-jakarta font-semibold break-words leading-snug md:leading-normal">{job.companyName}</p>
              <p className="flex items-center text-sm md:text-base font-jakarta text-supernova leading-normal">
                <Users size={16} className="mr-2 flex-shrink-0 md:w-[18px] md:h-[18px]" />
                <span>Requested Candidates: {job.candidatesRequested}</span>
              </p>
              <p className="text-xs md:text-sm text-guardian font-jakarta break-words leading-normal">
                <span className="font-semibold">Submitted by:</span>
                {job.userEmail ? (
                  <> {job.userEmail}</>
                ) : (
                  <span className="text-guardian/60"> Unknown</span>
                )}
              </p>
            </div>
            <div className="flex flex-row md:flex-col items-center md:items-end gap-2 md:gap-3">
              <Badge 
                variant={
                  job.status === 'Unclaimed' 
                    ? 'warning' 
                    : job.status === 'Completed' 
                      ? 'success' 
                      : 'default'
                }
                className="text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2 h-auto flex items-center whitespace-nowrap"
              >
                {job.status}
              </Badge>
              {(job.status === 'Unclaimed' || job.status === 'Claimed') && (
                <JobTimer jobCreatedAt={job.createdAt} size="lg" />
              )}
            </div>
          </div>
          
          <div className="mb-3 md:mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 md:gap-6 mb-3 md:mb-6">
              <div>
                <p className="text-xs md:text-sm font-jakarta font-semibold text-guardian uppercase tracking-tight md:tracking-wide mb-0.5 md:mb-1 leading-tight">Seniority Level</p>
                <p className="text-base md:text-lg text-supernova font-jakarta font-bold break-words leading-tight md:leading-normal">{job.seniorityLevel}</p>
              </div>
              <div>
                <p className="text-xs md:text-sm font-jakarta font-semibold text-guardian uppercase tracking-tight md:tracking-wide mb-0.5 md:mb-1 leading-tight">Work Arrangement</p>
                <p className="text-base md:text-lg text-supernova font-jakarta font-bold break-words leading-tight md:leading-normal">{job.workArrangement}</p>
              </div>
              <div>
                <p className="text-xs md:text-sm font-jakarta font-semibold text-guardian uppercase tracking-tight md:tracking-wide mb-0.5 md:mb-1 leading-tight">Location</p>
                <p className="text-base md:text-lg text-supernova font-jakarta font-bold break-words leading-tight md:leading-normal">{job.location}</p>
              </div>
              <div>
                <p className="text-xs md:text-sm font-jakarta font-semibold text-guardian uppercase tracking-tight md:tracking-wide mb-0.5 md:mb-1 leading-tight">Salary Range</p>
                <p className="text-base md:text-lg text-supernova font-jakarta font-bold break-words leading-tight md:leading-normal">${job.salaryRangeMin.toLocaleString()} - ${job.salaryRangeMax.toLocaleString()}</p>
              </div>
            </div>

            <div className="mb-3 md:mb-6">
              <p className="text-xs md:text-sm font-jakarta font-semibold text-guardian uppercase tracking-tight md:tracking-wide mb-1 md:mb-3">Job Description</p>
              <p className="whitespace-pre-line text-white-knight font-jakarta leading-normal md:leading-relaxed text-sm md:text-base break-words">{job.description}</p>
            </div>

            <div className="mb-3 md:mb-6">
              <p className="text-xs md:text-sm font-jakarta font-semibold text-guardian uppercase tracking-tight md:tracking-wide mb-1 md:mb-3">Key Skills</p>
              <ul className="grid grid-cols-1 gap-1.5 md:gap-2">
                {job.mustHaveSkills.map((skill, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-supernova mr-2 font-bold flex-shrink-0">•</span>
                    <span className="text-white-knight font-jakarta text-sm md:text-base break-words leading-snug md:leading-normal">{skill}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Profile Template Section */}
            {job.selectedProfileTemplate && (
              <div className="bg-supernova/10 border border-supernova/30 rounded-lg p-4 md:p-6 mb-3 md:mb-6">
                <p className="text-xs md:text-sm font-jakarta font-semibold text-supernova uppercase tracking-tight md:tracking-wide mb-1.5 md:mb-4 leading-tight">
                  Ideal Candidate Profile
                </p>
                <div className="space-y-2 md:space-y-4">
                  <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-0.5 md:gap-2">
                    <p className="text-base md:text-lg font-jakarta font-bold text-white-knight break-words leading-tight md:leading-normal">
                      {job.selectedProfileTemplate.name}
                    </p>
                    <p className="text-xs md:text-sm text-guardian whitespace-normal md:whitespace-nowrap leading-tight md:leading-normal">
                      {job.selectedProfileTemplate.location} • {job.selectedProfileTemplate.yearsOfExperience} years experience
                    </p>
                  </div>
                  
                  {job.selectedProfileTemplate.previousWorkExperience.length > 0 && (
                    <div>
                      <p className="text-xs md:text-sm font-semibold text-supernova mb-0.5 md:mb-2 uppercase tracking-tight md:tracking-wide leading-tight">Previous Experience</p>
                      <ul className="space-y-0.5 md:space-y-1">
                        {job.selectedProfileTemplate.previousWorkExperience.map((exp, i) => (
                          <li key={i} className="flex items-start">
                            <span className="text-supernova mr-2 flex-shrink-0">•</span>
                            <span className="text-white-knight font-jakarta text-xs md:text-sm break-words leading-snug md:leading-normal">{exp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {job.selectedProfileTemplate.relevantSkills.length > 0 && (
                    <div>
                      <p className="text-xs md:text-sm font-semibold text-supernova mb-0.5 md:mb-2 uppercase tracking-tight md:tracking-wide leading-tight">Relevant Skills</p>
                      <div className="flex flex-wrap gap-1.5 md:gap-2">
                        {job.selectedProfileTemplate.relevantSkills.map((skill, i) => (
                          <span 
                            key={i}
                            className="px-2 md:px-3 py-0.5 md:py-1 bg-supernova/20 text-white-knight font-jakarta text-xs md:text-sm rounded-full border border-supernova/40 leading-tight"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {job.selectedProfileTemplate.keyProjects.length > 0 && (
                    <div>
                      <p className="text-xs md:text-sm font-semibold text-supernova mb-0.5 md:mb-2 uppercase tracking-tight md:tracking-wide leading-tight">Key Projects</p>
                      <ul className="space-y-0.5 md:space-y-1">
                        {job.selectedProfileTemplate.keyProjects.map((project, i) => (
                          <li key={i} className="flex items-start">
                            <span className="text-supernova mr-2 flex-shrink-0">•</span>
                            <span className="text-white-knight font-jakarta text-xs md:text-sm break-words leading-snug md:leading-normal">{project}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer with action buttons */}
        {job.status === 'Unclaimed' && onClaim && (
          <div className="border-t border-guardian/20 p-4 md:p-6 bg-shadowforce-light flex-shrink-0">
            <Button 
              size="lg"
              className="w-full glow-supernova"
              onClick={() => onClaim(job.id)}
            >
              CLAIM JOB
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};


