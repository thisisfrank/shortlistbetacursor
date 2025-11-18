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
}

export const ViewJobDetailsModal: React.FC<ViewJobDetailsModalProps> = ({
  job,
  onClose
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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-shadowforce-light rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-guardian/20">
        <div className="flex justify-between items-center border-b border-guardian/20 p-6">
          <h2 className="text-2xl font-anton text-white-knight uppercase tracking-wide">Job Details</h2>
          <button 
            onClick={onClose}
            className="text-guardian hover:text-supernova transition-colors"
            aria-label="Close"
          >
            <X size={28} />
          </button>
        </div>
        
        <div className="overflow-y-auto p-8" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-3xl font-anton text-white-knight mb-2 uppercase tracking-wide">{job.title}</h3>
              <p className="text-xl text-supernova font-jakarta font-semibold">{job.companyName}</p>
              <p className="flex items-center text-base font-jakarta text-supernova mt-2">
                <Users size={18} className="mr-2" />
                <span>Requested Candidates: {job.candidatesRequested}</span>
              </p>
              <p className="text-sm text-guardian font-jakarta mt-2">
                <span className="font-semibold">Submitted by:</span>
                {job.userEmail ? (
                  <> {job.userEmail}</>
                ) : (
                  <span className="text-guardian/60"> Unknown</span>
                )}
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="flex items-center gap-3">
                <Badge 
                  variant={
                    job.status === 'Unclaimed' 
                      ? 'warning' 
                      : job.status === 'Completed' 
                        ? 'success' 
                        : 'default'
                  }
                  className="text-sm px-4 py-2 h-full flex items-center"
                >
                  {job.status}
                </Badge>
                {(job.status === 'Unclaimed' || job.status === 'Claimed') && (
                  <JobTimer jobCreatedAt={job.createdAt} size="lg" />
                )}
              </div>
            </div>
          </div>
          
          <div className="mb-8">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm font-jakarta font-semibold text-guardian uppercase tracking-wide">Seniority Level</p>
                <p className="text-lg text-supernova font-jakarta font-bold">{job.seniorityLevel}</p>
              </div>
              <div>
                <p className="text-sm font-jakarta font-semibold text-guardian uppercase tracking-wide">Work Arrangement</p>
                <p className="text-lg text-supernova font-jakarta font-bold">{job.workArrangement}</p>
              </div>
              <div>
                <p className="text-sm font-jakarta font-semibold text-guardian uppercase tracking-wide">Location</p>
                <p className="text-lg text-supernova font-jakarta font-bold">{job.location}</p>
              </div>
              <div>
                <p className="text-sm font-jakarta font-semibold text-guardian uppercase tracking-wide">Salary Range</p>
                <p className="text-lg text-supernova font-jakarta font-bold">${job.salaryRangeMin.toLocaleString()} - ${job.salaryRangeMax.toLocaleString()}</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm font-jakarta font-semibold text-guardian uppercase tracking-wide mb-3">Job Description</p>
              <p className="whitespace-pre-line text-white-knight font-jakarta leading-relaxed">{job.description}</p>
            </div>

            <div className="mb-6">
              <p className="text-sm font-jakarta font-semibold text-guardian uppercase tracking-wide mb-3">Key Selling Points</p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {job.mustHaveSkills.map((skill, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-supernova mr-2 font-bold">•</span>
                    <span className="text-white-knight font-jakarta">{skill}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Profile Template Section */}
            {job.selectedProfileTemplate && (
              <div className="bg-supernova/10 border border-supernova/30 rounded-lg p-6 mb-6">
                <p className="text-sm font-jakarta font-semibold text-supernova uppercase tracking-wide mb-4">
                  Ideal Candidate Profile
                </p>
                <div className="space-y-4">
                  <div className="flex items-baseline justify-between">
                    <p className="text-lg font-jakarta font-bold text-white-knight">
                      {job.selectedProfileTemplate.name}
                    </p>
                    <p className="text-sm text-guardian">
                      {job.selectedProfileTemplate.location} • {job.selectedProfileTemplate.yearsOfExperience} years experience
                    </p>
                  </div>
                  
                  {job.selectedProfileTemplate.previousWorkExperience.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-supernova mb-2 uppercase tracking-wide">Previous Experience</p>
                      <ul className="space-y-1">
                        {job.selectedProfileTemplate.previousWorkExperience.map((exp, i) => (
                          <li key={i} className="flex items-start">
                            <span className="text-supernova mr-2">•</span>
                            <span className="text-white-knight font-jakarta text-sm">{exp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {job.selectedProfileTemplate.relevantSkills.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-supernova mb-2 uppercase tracking-wide">Relevant Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {job.selectedProfileTemplate.relevantSkills.map((skill, i) => (
                          <span 
                            key={i}
                            className="px-3 py-1 bg-supernova/20 text-white-knight font-jakarta text-sm rounded-full border border-supernova/40"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {job.selectedProfileTemplate.keyProjects.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-supernova mb-2 uppercase tracking-wide">Key Projects</p>
                      <ul className="space-y-1">
                        {job.selectedProfileTemplate.keyProjects.map((project, i) => (
                          <li key={i} className="flex items-start">
                            <span className="text-supernova mr-2">•</span>
                            <span className="text-white-knight font-jakarta text-sm">{project}</span>
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
      </div>
    </div>
  );
};


