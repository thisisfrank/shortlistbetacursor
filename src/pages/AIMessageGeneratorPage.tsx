import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronRight, Copy, Edit, Check, User, Briefcase, FileCheck, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Tooltip } from '../components/ui/Tooltip';
import { reviewMessageGrammar, GrammarReviewResult } from '../services/anthropicService';

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  headline?: string;
  location?: string;
  skills?: string[];
  experience?: Array<{
    title: string;
    company: string;
    duration: string;
  }>;
  linkedinUrl: string;
  jobId: string;
}

interface Job {
  id: string;
  title: string;
  companyName: string;
  location?: string;
  candidates?: Candidate[];
}

export const AIMessageGeneratorPage: React.FC = () => {
  const { user, userProfile } = useAuth();
  const dataContext = useData();
  const [searchParams] = useSearchParams();
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [copiedBody, setCopiedBody] = useState(false);
  const [editingBody, setEditingBody] = useState(false);
  const [bodyText, setBodyText] = useState('');
  const [prefilledCandidate, setPrefilledCandidate] = useState<Candidate | null>(null);
  const [prefilledJob, setPrefilledJob] = useState<Job | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<GrammarReviewResult | null>(null);
  const [showReviewResults, setShowReviewResults] = useState(false);

  // Enhanced template using detailed candidate information
  const getMessageTemplate = (candidate?: Candidate, job?: Job) => {
    const candidateFirstName = candidate ? candidate.firstName : '{first_name}';
    const currentRole = candidate?.headline || candidate?.experience?.[0]?.title || '{current_role}';
    const topSkills = candidate?.skills?.slice(0, 3).join(', ') || '{candidate_skills}';
    const recentCompany = candidate?.experience?.[0]?.company || '{recent_company}';
      
    const body = candidate && job
      ? `Hi ${candidateFirstName},

I hope this message finds you well! I came across your LinkedIn profile and was impressed by your background as ${currentRole}${recentCompany !== '{recent_company}' ? ` at ${recentCompany}` : ''}.

Your experience with ${topSkills} caught my attention, and I believe you'd be an excellent fit for an exciting ${job.title} position we have at ${job.companyName}. ${job.location ? `The role is based in ${job.location}.` : ''}

${candidate.experience && candidate.experience.length > 0 ? `Given your ${candidate.experience.length}+ years of experience in the industry, ` : ''}I think this opportunity would be a great next step in your career.

Would you be open to a brief conversation about this role? I'd love to share more details and learn about your career goals.

Best regards,
${userProfile?.name || 'Your Name'}`
      : `Hi {first_name},

I hope this message finds you well! I came across your LinkedIn profile and was impressed by your background as {current_role} at {recent_company}.

Your experience with {candidate_skills} caught my attention, and I believe you'd be an excellent fit for an exciting {job_title} position we have at {company_name}. The role is based in {job_location}.

Given your experience in the industry, I think this opportunity would be a great next step in your career.

Would you be open to a brief conversation about this role? I'd love to share more details and learn about your career goals.

Best regards,
{your_name}`;

    return body;
  };

  // Get user's jobs based on role
  const getUserJobs = (): Job[] => {
    if (!user || !userProfile) return [];
    
    if (userProfile.role === 'client') {
      // Clients see their own jobs
      return dataContext.jobs.filter(job => job.userId === user.id);
    } else if (userProfile.role === 'sourcer') {
      // Sourcers see jobs they've claimed
      return dataContext.jobs.filter(job => job.sourcerId === user.id);
    } else if (userProfile.role === 'admin') {
      // Admins see all jobs
      return dataContext.jobs;
    }
    return [];
  };

  const userJobs = getUserJobs();
  
  // Filter completed jobs (jobs with candidates)
  const completedJobs = userJobs.filter(job => {
    const candidates = dataContext.getCandidatesByJob(job.id);
    return candidates && candidates.length > 0;
  });

  // Add candidates to job objects for UI
  const completedJobsWithCandidates = completedJobs.map(job => ({
    ...job,
    candidates: dataContext.getCandidatesByJob(job.id)
  }));

  const handleJobClick = (job: Job) => {
    if (expandedJobId === job.id) {
      setExpandedJobId(null);
      setSelectedCandidate(null);
      setSelectedJob(null);
    } else {
      // Clear prefilled data when manually selecting a job
      setPrefilledCandidate(null);
      setPrefilledJob(null);
      
      setExpandedJobId(job.id);
      setSelectedJob(job);
      setSelectedCandidate(null);
    }
  };

  const handleCandidateClick = (candidate: Candidate) => {
    // Find the job this candidate belongs to
    const job = completedJobsWithCandidates.find(j => j.candidates?.some(c => c.id === candidate.id));
    if (job) {
      // Clear prefilled data when manually selecting a candidate
      setPrefilledCandidate(null);
      setPrefilledJob(null);
      
      setSelectedCandidate(candidate);
      setSelectedJob(job);
      const message = getMessageTemplate(candidate, job);
      setBodyText(message);
      setEditingBody(false);
    }
  };

  // Handle URL parameters for pre-filled candidate data
  React.useEffect(() => {
    const candidateParam = searchParams.get('candidate');
    if (candidateParam) {
      try {
        const candidateData = JSON.parse(decodeURIComponent(candidateParam));
        setPrefilledCandidate(candidateData);
        
        // Find the associated job
        const job = dataContext.jobs.find(j => j.id === candidateData.jobId);
        if (job) {
          setPrefilledJob(job);
          // Expand the job in the left panel and set selections
          setExpandedJobId(job.id);
          setSelectedJob(job);
          setSelectedCandidate(candidateData);
        }
      } catch (error) {
        console.error('Error parsing candidate data from URL:', error);
      }
    }
  }, [searchParams, dataContext.jobs]);

  // Initialize template - always show template
  React.useEffect(() => {
    // Prioritize prefilled data from URL params
    const candidate = prefilledCandidate || selectedCandidate;
    const job = prefilledJob || selectedJob;
    
    if (candidate && job) {
      // Job + candidate selected: filled template
      const message = getMessageTemplate(candidate, job);
      setBodyText(message);
    } else {
      // No job or no candidate: show unfilled template
      const message = getMessageTemplate();
      setBodyText(message);
    }
  }, [selectedJob, selectedCandidate, prefilledCandidate, prefilledJob]);

  // Initialize template on page load
  React.useEffect(() => {
    const message = getMessageTemplate();
    setBodyText(message);
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedBody(true);
      setTimeout(() => setCopiedBody(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleReviewMessage = async () => {
    if (!bodyText.trim()) return;
    
    setIsReviewing(true);
    setShowReviewResults(false);
    
    try {
      const result = await reviewMessageGrammar(bodyText);
      setReviewResult(result);
      setShowReviewResults(true);
    } catch (error) {
      console.error('Review failed:', error);
      setReviewResult({
        hasIssues: false,
        suggestions: ['Review service temporarily unavailable. Please check your message manually.'],
        score: 8
      });
      setShowReviewResults(true);
    } finally {
      setIsReviewing(false);
    }
  };

  const applyCorrectedMessage = () => {
    if (reviewResult?.correctedMessage) {
      setBodyText(reviewResult.correctedMessage);
      setShowReviewResults(false);
      setReviewResult(null);
    }
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-shadowforce via-shadowforce-light to-shadowforce flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-supernova mx-auto mb-4"></div>
          <p className="text-guardian font-jakarta">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
         <div className="min-h-screen bg-gradient-to-br from-shadowforce via-shadowforce-light to-shadowforce">
       <div className="flex min-h-screen">
         {/* Left Panel - Jobs List */}
         <div className="w-1/3 bg-shadowforce-light/30 border-r border-guardian/20 p-6 overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white-knight font-jakarta mb-2">
              LinkedIn Message Generator
            </h1>
            <p className="text-guardian text-sm">
              Select a completed job to generate personalized LinkedIn messages for candidates
            </p>
          </div>

          {completedJobsWithCandidates.length === 0 ? (
            <div></div>
          ) : (
            <div className="space-y-3">
              {completedJobsWithCandidates.map((job) => (
                <div key={job.id}>
                  <Card 
                    className={`p-4 cursor-pointer transition-all hover:bg-shadowforce/50 ${
                      expandedJobId === job.id ? 'bg-shadowforce/50 border-supernova/30' : 'bg-shadowforce/20'
                    }`}
                    onClick={() => handleJobClick(job)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white-knight text-sm mb-1">
                          {job.title}
                        </h3>
                                                 <p className="text-guardian text-xs">
                           {job.companyName} • {job.candidates?.length || 0} candidates
                         </p>
                      </div>
                      <div className="text-guardian">
                        {expandedJobId === job.id ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </div>
                    </div>
                  </Card>

                  {/* Expanded Candidates */}
                  {expandedJobId === job.id && job.candidates && (
                    <div className="ml-4 mt-2 space-y-2">
                      {job.candidates.map((candidate) => (
                        <Card
                          key={candidate.id}
                          className={`p-3 cursor-pointer transition-all hover:bg-supernova/10 ${
                            selectedCandidate?.id === candidate.id
                              ? 'bg-supernova/20 border-supernova/50' 
                              : 'bg-shadowforce/10'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCandidateClick(candidate);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <User size={16} className="text-supernova" />
                            <div>
                              <p className="text-white-knight text-sm font-medium">
                                {`${candidate.firstName} ${candidate.lastName}`}
                              </p>
                              {candidate.headline && (
                                <p className="text-guardian text-xs">
                                  {candidate.headline}
                                </p>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

                 {/* Right Panel - Message Template */}
         <div className="flex-1 p-6">
           <div className="max-w-4xl mx-auto">


              <div className="space-y-6">
                {/* Message Body */}
                <Card className="p-6">
                  
                  {editingBody ? (
                    <textarea
                      value={bodyText}
                      onChange={(e) => setBodyText(e.target.value)}
                      className="w-full p-3 bg-shadowforce border border-guardian/30 rounded-lg text-white-knight resize-none mb-4"
                      rows={12}
                      placeholder="Your personalized message will appear here..."
                    />
                  ) : (
                    <div className="p-3 bg-shadowforce/50 rounded-lg text-white-knight whitespace-pre-wrap mb-4">
                      {bodyText}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-guardian/20">
                                         <Tooltip content="Directly edit the message to fine tune your message">
                       <Button
                         onClick={() => setEditingBody(!editingBody)}
                         className="bg-guardian/30 hover:bg-guardian/50 text-black flex items-center gap-2"
                         size="sm"
                       >
                         <Edit size={16} />
                         {editingBody ? 'Save' : 'Edit Manually'}
                       </Button>
                     </Tooltip>
                     
                     <Tooltip content="Let AI offer suggestions that you can implement with one click">
                       <Button
                         onClick={handleReviewMessage}
                         disabled={isReviewing || !bodyText.trim()}
                         className="bg-guardian-600 hover:bg-blue-700 text-black disabled:opacity-50 flex items-center gap-2"
                         size="sm"
                       >
                         {isReviewing ? (
                           <>
                             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                             Reviewing...
                           </>
                         ) : (
                           <>
                             <FileCheck size={16} />
                             Edit with AI
                           </>
                         )}
                       </Button>
                     </Tooltip>
                     
                     <Tooltip content="Copy the message to use in LinkedIn or any other messenger to get in contact with your candidate">
                       <Button
                         onClick={() => copyToClipboard(bodyText)}
                         className="bg-supernova hover:bg-supernova/90 text-shadowforce flex items-center gap-2"
                         size="sm"
                       >
                         {copiedBody ? (
                           <>
                             <Check size={16} />
                             Copied!
                           </>
                       ) : (
                           <>
                             <Copy size={16} />
                             Copy Message
                           </>
                         )}
                       </Button>
                     </Tooltip>
                  </div>
                </Card>

                                 {/* Grammar Review Results */}
                 {showReviewResults && reviewResult && (
                   <Card className="p-6 border-l-4 border-l-supernova mb-8">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {reviewResult.hasIssues ? (
                          <AlertCircle size={20} className="text-yellow-500" />
                        ) : (
                          <CheckCircle size={20} className="text-green-500" />
                        )}
                        <div>
                          <h3 className="text-lg font-semibold text-white-knight">Grammar Review</h3>
                          <p className="text-guardian text-sm">
                            Quality Score: {reviewResult.score}/10
                          </p>
                        </div>
                      </div>
                                             <Button
                         onClick={() => setShowReviewResults(false)}
                         variant="outline"
                         size="sm"
                         className="text-guardian"
                       >
                         ×
                       </Button>
                    </div>

                    {reviewResult.suggestions.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-white-knight font-medium mb-2">Suggestions:</h4>
                        <ul className="space-y-1">
                          {reviewResult.suggestions.map((suggestion, index) => (
                            <li key={index} className="text-guardian text-sm flex items-start gap-2">
                              <span className="text-supernova">•</span>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {reviewResult.correctedMessage && (
                      <div className="mt-4 p-4 bg-shadowforce rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white-knight font-medium">Suggested Correction:</h4>
                          <Button
                            onClick={applyCorrectedMessage}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Apply Changes
                          </Button>
                        </div>
                        <div className="text-guardian text-sm whitespace-pre-wrap">
                          {reviewResult.correctedMessage}
                        </div>
                      </div>
                    )}
                  </Card>
                )}
              </div>
            </div>
        </div>
      </div>


    </div>
  );
};

