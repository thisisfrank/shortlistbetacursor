import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { ChevronDown, ChevronRight, Copy, Edit, Check, User, Briefcase } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

interface Candidate {
  id: string;
  name: string;
  title?: string;
  company?: string;
  skills?: string[];
}

interface Job {
  id: string;
  title: string;
  company_name: string;
  location?: string;
  candidates?: Candidate[];
}

export const AIMessageGeneratorPage: React.FC = () => {
  const { user, userProfile } = useAuth();
  const dataContext = useData();
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [editingSubject, setEditingSubject] = useState(false);
  const [editingBody, setEditingBody] = useState(false);
  const [subjectLine, setSubjectLine] = useState('');
  const [bodyText, setBodyText] = useState('');

  // Sample template - will be replaced with your templates
  const getMessageTemplate = (candidate?: Candidate, job?: Job) => {
    const subject = candidate && job 
      ? `Exciting ${job.title} opportunity at ${job.company_name}`
      : `Exciting {job_title} opportunity at {company_name}`;
      
    const body = candidate && job
      ? `Hi ${candidate.name},

I hope this message finds you well! I came across your profile and was impressed by your background in ${candidate.skills?.[0] || 'your field'}.

We have an exciting ${job.title} position at ${job.company_name} that I think would be a perfect fit for your expertise. ${job.location ? `The role is based in ${job.location}.` : ''}

Would you be open to a brief conversation about this opportunity? I'd love to share more details about the role and learn about your career goals.

Best regards,
${userProfile?.name || 'Your Name'}`
      : `Hi {candidate_name},

I hope this message finds you well! I came across your profile and was impressed by your background in {candidate_skills}.

We have an exciting {job_title} position at {company_name} that I think would be a perfect fit for your expertise. The role is based in {job_location}.

Would you be open to a brief conversation about this opportunity? I'd love to share more details about the role and learn about your career goals.

Best regards,
{your_name}`;

    return { subject, body };
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
      setExpandedJobId(job.id);
      setSelectedJob(job);
      setSelectedCandidate(null);
    }
  };

  const handleCandidateClick = (candidate: Candidate) => {
    if (selectedJob) {
      setSelectedCandidate(candidate);
      const message = getMessageTemplate(candidate, selectedJob);
      setSubjectLine(message.subject);
      setBodyText(message.body);
      setEditingSubject(false);
      setEditingBody(false);
    }
  };

  // Initialize template - always show template
  React.useEffect(() => {
    if (selectedJob && selectedCandidate) {
      // Job + candidate selected: filled template
      const message = getMessageTemplate(selectedCandidate, selectedJob);
      setSubjectLine(message.subject);
      setBodyText(message.body);
    } else {
      // No job or no candidate: show unfilled template
      const message = getMessageTemplate();
      setSubjectLine(message.subject);
      setBodyText(message.body);
    }
  }, [selectedJob, selectedCandidate]);

  // Initialize template on page load
  React.useEffect(() => {
    const message = getMessageTemplate();
    setSubjectLine(message.subject);
    setBodyText(message.body);
  }, []);

  const copyToClipboard = async (text: string, type: 'subject' | 'body') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'subject') {
        setCopiedSubject(true);
        setTimeout(() => setCopiedSubject(false), 2000);
      } else {
        setCopiedBody(true);
        setTimeout(() => setCopiedBody(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
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
      <div className="flex h-screen">
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
                          {job.company_name} • {job.candidates?.length || 0} candidates
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
                          onClick={() => handleCandidateClick(candidate)}
                        >
                          <div className="flex items-center gap-3">
                            <User size={16} className="text-supernova" />
                            <div>
                              <p className="text-white-knight text-sm font-medium">
                                {candidate.name}
                              </p>
                              {candidate.title && (
                                <p className="text-guardian text-xs">
                                  {candidate.title}
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
            {selectedCandidate && selectedJob && (
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white-knight font-jakarta mb-2">
                  LinkedIn Message for {selectedCandidate.name}
                </h2>
                <p className="text-guardian text-sm">
                  {selectedJob.title} at {selectedJob.company_name}
                </p>
              </div>
            )}

              <div className="space-y-6">
                {/* Subject Line */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white-knight">Subject Line</h3>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setEditingSubject(!editingSubject)}
                        className="bg-guardian/30 hover:bg-guardian/50 text-white-knight"
                        size="sm"
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        onClick={() => copyToClipboard(subjectLine, 'subject')}
                        className="bg-supernova hover:bg-supernova/90 text-shadowforce"
                        size="sm"
                      >
                        {copiedSubject ? <Check size={14} /> : <Copy size={14} />}
                      </Button>
                    </div>
                  </div>
                  
                  {editingSubject ? (
                    <textarea
                      value={subjectLine}
                      onChange={(e) => setSubjectLine(e.target.value)}
                      className="w-full p-3 bg-shadowforce border border-guardian/30 rounded-lg text-white-knight resize-none"
                      rows={2}
                    />
                  ) : (
                    <div className="p-3 bg-shadowforce/50 rounded-lg text-white-knight">
                      {subjectLine}
                    </div>
                  )}
                </Card>

                {/* Body Copy */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white-knight">Message Body</h3>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setEditingBody(!editingBody)}
                        className="bg-guardian/30 hover:bg-guardian/50 text-white-knight"
                        size="sm"
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        onClick={() => copyToClipboard(bodyText, 'body')}
                        className="bg-supernova hover:bg-supernova/90 text-shadowforce"
                        size="sm"
                      >
                        {copiedBody ? <Check size={14} /> : <Copy size={14} />}
                      </Button>
                    </div>
                  </div>
                  
                  {editingBody ? (
                    <textarea
                      value={bodyText}
                      onChange={(e) => setBodyText(e.target.value)}
                      className="w-full p-3 bg-shadowforce border border-guardian/30 rounded-lg text-white-knight resize-none"
                      rows={12}
                    />
                  ) : (
                    <div className="p-3 bg-shadowforce/50 rounded-lg text-white-knight whitespace-pre-wrap">
                      {bodyText}
                    </div>
                  )}
                </Card>
              </div>
            </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="bg-shadowforce-light/30 border-t border-guardian/20 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white-knight font-jakarta mb-4">
              Our messaging brings client results like these
            </h2>
          </div>
          
          <div className="grid grid-cols-2 gap-6 max-w-6xl mx-auto">
            {[
              {
                index: 1,
                caption: "👉 In just 8 months, Super Recruiter helped Peak Activity make 27 hires - with a 58% candidate submit-to-hire ratio."
              },
              {
                index: 2,
                caption: "👉 With an average open rate of double industry average, Super Recruiter delivered the critical talent Phalcon USA needed to scale in the fast-moving data center sector."
              },
              {
                index: 3,
                caption: "👉 Super Recruiter helped Forterra cut their cost per hire by over 70% compared to their previous hiring solutions."
              },
              {
                index: 4,
                caption: "👉 Over 10 months, Super Recruiter saved Credo more than $300K in forecasted hiring spend while achieving a 62% candidate submit-to-hire ratio."
              }
            ].map((item) => (
              <div key={item.index} className="group">
                <div className="bg-shadowforce rounded-lg p-4 transition-transform hover:scale-105 h-full flex flex-col">
                  <div className="mb-4">
                    <p className="text-white-knight text-sm leading-relaxed">
                      {item.caption}
                    </p>
                  </div>
                  <div className="flex-1">
                    <img
                      src={`/screenshots/instantly results ${item.index}.png`}
                      alt={`Client result example ${item.index}`}
                      className="w-full h-full object-cover rounded-lg shadow-lg"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
