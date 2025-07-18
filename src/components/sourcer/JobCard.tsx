import React from 'react';
import { Job } from '../../types';
import { useData } from '../../context/DataContext';
import { JobTimer } from '../ui/JobTimer';
import { Card, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Calendar, MapPin, DollarSign, Users, Briefcase, Target } from 'lucide-react';

interface JobCardProps {
  job: Job;
  onView: (jobId: string) => void;
  onClaim?: (jobId: string) => void;
  onComplete?: (jobId: string) => void;
  showActions?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onView,
  onClaim,
  onComplete,
  showActions = true
}) => {
  const { getCandidatesByJob } = useData();
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  };

  // Calculate progress for claimed jobs
  const currentCandidates = getCandidatesByJob(job.id);
  const progressPercentage = job.candidatesRequested > 0 
    ? Math.round((currentCandidates.length / job.candidatesRequested) * 100)
    : 0;
  const isComplete = currentCandidates.length >= job.candidatesRequested;
  const getStatusBadgeVariant = () => {
    switch (job.status) {
      case 'Unclaimed':
        return 'warning';
      case 'Claimed':
        return 'default';
      case 'Completed':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusColor = () => {
    switch (job.status) {
      case 'Unclaimed':
        return 'border-supernova/50 hover:border-supernova';
      case 'Claimed':
        return 'border-blue-500/50 hover:border-blue-500';
      case 'Completed':
        return 'border-green-500/50 hover:border-green-500';
      default:
        return 'border-guardian/20 hover:border-supernova/30';
    }
  };

  return (
    <Card className={`h-full flex flex-col hover:shadow-2xl transition-all duration-300 transform hover:scale-105 ${getStatusColor()}`}>
      <CardContent className="flex-1 pt-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-anton text-white-knight mb-2 uppercase tracking-wide line-clamp-2">{job.title}</h3>
            <div className="flex items-center gap-3 mb-3">
              <Badge variant={getStatusBadgeVariant()}>{job.status}</Badge>
              {job.status === 'Unclaimed' && (
                <JobTimer jobCreatedAt={job.createdAt} size="sm" />
              )}
            </div>
          </div>
        </div>
        
        <p className="text-guardian font-jakarta text-sm mb-6 line-clamp-3 leading-relaxed">{job.description}</p>
        
        <div className="space-y-3 mb-6">
          <div className="flex items-center text-sm text-guardian">
            <Briefcase size={16} className="mr-3 text-supernova" />
            <span className="font-jakarta font-medium">{job.seniorityLevel} Level</span>
          </div>
          
          <div className="flex items-center text-sm text-guardian">
            <MapPin size={16} className="mr-3 text-supernova" />
            <span className="font-jakarta font-medium">{job.location} • {job.workArrangement}</span>
          </div>
          
          <div className="flex items-center text-sm text-guardian">
            <DollarSign size={16} className="mr-3 text-supernova" />
            <span className="font-jakarta font-bold text-supernova">
              ${job.salaryRangeMin.toLocaleString()} - ${job.salaryRangeMax.toLocaleString()}
            </span>
          </div>
          
          <div className="flex items-center text-sm text-guardian">
            <Calendar size={16} className="mr-3 text-supernova" />
            <span className="font-jakarta">Posted {formatDate(job.createdAt)}</span>
          </div>
          
          {/* Progress indicator for claimed jobs */}
          {job.status === 'Claimed' && (
            <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Target size={14} className="mr-2 text-blue-400" />
                  <span className="text-sm font-jakarta font-semibold text-blue-400">Progress</span>
                </div>
                <span className="text-sm font-anton text-white-knight">
                  {currentCandidates.length}/{job.candidatesRequested}
                </span>
              </div>
              <div className="w-full bg-shadowforce rounded-full h-2 mb-1">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isComplete ? 'bg-green-400' : 'bg-blue-400'
                  }`}
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-guardian font-jakarta">
                {isComplete ? 'Ready to complete!' : `${progressPercentage}% complete`}
              </div>
            </div>
          )}
        </div>
        
        {job.sourcerName && (
          <div className="bg-supernova/10 border border-supernova/30 p-3 rounded-lg text-sm mb-4">
            <span className="font-jakarta font-semibold text-supernova">Sourcer:</span>{' '}
            <span className="text-white-knight font-jakarta font-bold">{job.sourcerName}</span>
          </div>
        )}
      </CardContent>
      
      {showActions && (
        <CardFooter className="bg-shadowforce px-6 py-4 border-t border-guardian/20">
          <div className="w-full flex gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onView(job.id)}
            >
              VIEW DETAILS
            </Button>
            
            {job.status === 'Unclaimed' && onClaim && (
              <Button 
                size="sm" 
                className="flex-1 glow-supernova"
                onClick={() => onClaim(job.id)}
              >
                CLAIM JOB
              </Button>
            )}
            
            {job.status === 'Claimed' && job.sourcerName && onComplete && isComplete && (
              <Button 
                variant="success" 
                size="sm" 
                className="flex-1"
                onClick={() => onComplete(job.id)}
              >
                COMPLETE JOB
              </Button>
            )}
            
            {job.status === 'Claimed' && job.sourcerName && onComplete && !isComplete && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => onView(job.id)}
              >
                ADD CANDIDATES
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
};