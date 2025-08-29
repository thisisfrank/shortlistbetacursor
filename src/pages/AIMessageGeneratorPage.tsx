import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronRight, Copy, Edit, Check, User, Sparkles } from 'lucide-react';
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
  const [showReviewResults, setShowReviewResults] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number>(1);
  const [isGeneratingVariation, setIsGeneratingVariation] = useState(false);
  const [messageType, setMessageType] = useState<'linkedin' | 'email'>('linkedin');

  // Character limits
  const LINKEDIN_CHAR_LIMIT = 300;
  const EMAIL_CHAR_LIMIT = 2000; // Reasonable email limit
  const currentLimit = messageType === 'linkedin' ? LINKEDIN_CHAR_LIMIT : EMAIL_CHAR_LIMIT;
  const characterCount = bodyText.length;
  const isOverLimit = characterCount > currentLimit;
  const isNearLimit = characterCount > currentLimit * 0.9; // 90% of limit

  // Predefined templates
  const templates = {
    linkedin: {
      1: {
        name: "Template 1 - Direct & Professional",
        template: `Super impressive background, {{firstname}}.

We're hiring a {{job_opening}} to join {{company_name}} - you look like a great fit.

Curious, what salary would you target to consider a move?

Thank you,

{{your_name}}`
      },
      2: {
        name: "Template 2 - Skills Focused",
        template: `Hey {{firstname}}, 

We're hiring a {{job_opening}} at {{company_name}} - your {{skillone}} and {{skilltwo}} background looks like a great match.

Mind if I ask what your target salary is to consider a move?`
      },
      3: {
        name: "Template 3 - Casual & Engaging",
        template: `Hi {{firstname}},

Love your background with {{skillone}} and {{skilltwo}}.

Mind if I ask what your target salary is to consider a move?

We have a {{job_opening}} I'd love to share with you.

{{your_name}}`
      }
    },
    email: {
      1: {
        name: "Email 1 - High-Paying Opening",
        template: `Subject: (high-paying) {{job_opening}} opening

Hi {{firstname}},

Saw your LinkedIn, looks like you've done some great work at {{company_name}}.

We're looking for a {{job_opening}} like you - with a strong background in {{skilltwo}} and {{skillone}}.

You can look forward to:

- Perk 1
- Perk 2
- Perk 3

The {{job_opening}} offers a (flexible) salary of $\{{salary}}K with excellent benefits.

Want to see a full job description?

Let me know!

Thank you,
{{your_name}}`
      },
      2: {
        name: "Email 2 - Nice LinkedIn",
        template: `Subject: Nice LinkedIn, {{firstname}}

Hey {{firstname}},

Great background - I saw your LinkedIn today.

You look perfect for our {{job_opening}} opening at {{company_name}}.

We [1-line description of what you do] - example: *AV systems for commercial and defense applications*.

- Perk 1
- Perk 2
- Perk 3

The {{job_opening}} offers a flexible salary of ~$\{{salary}}K with excellent benefits.

Open to checking out the job description?

All the best,

{{your_name}}`
      },
      3: {
        name: "Email 3 - Salary Focused",
        template: `Subject: {{job_opening}} opportunity - $\{{salary}}K+

Hi {{firstname}},

Your experience with {{skillone}} and {{skilltwo}} caught my attention on LinkedIn.

We have an exciting {{job_opening}} role at {{company_name}} that matches your background perfectly.

What you'll get:

- [Benefit 1]
- [Benefit 2]
- [Benefit 3]

Compensation: $\{{salary}}K base + benefits package

Interested in checking out the full job description?

Best,
{{your_name}}`
      },
      4: {
        name: "Email 4 - LinkedIn Follow Up",
        template: `Subject: Linkedin follow up

Hey {{firstname}},

Hope you're doing well!

Just checked out your LinkedIn - really solid background in {{skillone}} and {{skilltwo}}.

We've got this {{job_opening}} position that seems right up your alley.

We have a great team at {{company_name}} and we're looking for someone exactly like you.

Here's some addition perks about the company:

- [Perk 1]
- [Perk 2]
- [Perk 3]

Compensation: $\{{salary}}K base + benefits package

Interested in checking out the full job description?

Cheers,
{{your_name}}`
      }
    }
  };

  // Fill template with candidate and job data
  const getMessageTemplate = (templateId: number = selectedTemplate, candidate?: Candidate, job?: Job) => {
    const templateGroup = templates[messageType];
    const template = templateGroup[templateId as keyof typeof templateGroup];
    if (!template) return '';

    const candidateFirstName = candidate ? candidate.firstName : '{{firstname}}';
    const currentRole = candidate?.headline || candidate?.experience?.[0]?.title || '{{current_role}}';
    const jobTitle = job ? job.title : '{{job_opening}}';
    const companyName = job ? job.companyName : '{{company_name}}';
    const skillOne = candidate?.skills?.[0] || '{{skillone}}';
    const skillTwo = candidate?.skills?.[1] || '{{skilltwo}}';
    const userName = userProfile?.name || '{{your_name}}';
    const salary = '{{salary}}'; // Placeholder for user to fill in

    return template.template
      .replace(/\{\{firstname\}\}/g, candidateFirstName)
      .replace(/\{\{current_role\}\}/g, currentRole)
      .replace(/\{\{job_opening\}\}/g, jobTitle)
      .replace(/\{\{company_name\}\}/g, companyName)
      .replace(/\{\{skillone\}\}/g, skillOne)
      .replace(/\{\{skilltwo\}\}/g, skillTwo)
      .replace(/\{\{your_name\}\}/g, userName)
      .replace(/\\\{\{salary\}\}/g, salary);
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
      const message = getMessageTemplate(selectedTemplate, candidate, job);
      setBodyText(message);
      setEditingBody(false);
    }
  };

  const handleTemplateChange = (templateId: number) => {
    setSelectedTemplate(templateId);
    const candidate = prefilledCandidate || selectedCandidate;
    const job = prefilledJob || selectedJob;
    const message = getMessageTemplate(templateId, candidate, job);
    setBodyText(message);
    setEditingBody(false);
  };

  const handleMessageTypeChange = (type: 'linkedin' | 'email') => {
    setMessageType(type);
    const candidate = prefilledCandidate || selectedCandidate;
    const job = prefilledJob || selectedJob;
    const message = getMessageTemplate(selectedTemplate, candidate, job);
    setBodyText(message);
    setEditingBody(false);
  };

  const generateAIVariation = async () => {
    if (!bodyText.trim()) return;
    
    setIsGeneratingVariation(true);
    
    try {
      // Use the anthropic service to generate a variation
      const prompt = `Create a professional variation of this ${messageType} recruitment message that ${messageType === 'linkedin' ? 'stays under 300 characters' : 'is concise and professional'} and maintains the same structure and intent:

${bodyText}

Requirements:
- Keep it professional and direct
- Maintain the salary question element
${messageType === 'linkedin' ? '- Stay under 300 characters' : '- Keep it concise but can be longer than LinkedIn'}
- Use slightly different wording while keeping the same meaning
- Keep the same overall tone
- NO fluff at the start (skip "I hope this message finds you well" or "hope you're having a good day" - get straight to the point)
- Be concise and to the point
- Put the candidate as the hero of the message
- Use one sentence per line for better readability
- Each sentence should stand on its own`;

      const result = await reviewMessageGrammar(prompt);
      if (result.correctedMessage) {
        setBodyText(result.correctedMessage);
      } else {
        // Fallback: simple word variations
        const variations = bodyText
          .replace(/Super impressive/gi, 'Really impressive')
          .replace(/Hey /gi, 'Hi ')
          .replace(/Mind if I ask/gi, 'Could I ask')
          .replace(/Curious,/gi, 'Quick question,')
          .replace(/Love your/gi, 'Impressed by your');
        setBodyText(variations);
      }
    } catch (error) {
      console.error('AI variation generation failed:', error);
      // Fallback: simple word variations
      const variations = bodyText
        .replace(/Super impressive/gi, 'Really impressive')
        .replace(/Hey /gi, 'Hi ')
        .replace(/Mind if I ask/gi, 'Could I ask')
        .replace(/Curious,/gi, 'Quick question,')
        .replace(/Love your/gi, 'Impressed by your');
      setBodyText(variations);
    } finally {
      setIsGeneratingVariation(false);
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
    
    const message = getMessageTemplate(selectedTemplate, candidate, job);
    setBodyText(message);
  }, [selectedJob, selectedCandidate, prefilledCandidate, prefilledJob, selectedTemplate, messageType, userProfile]);

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
                {/* Message Type Toggle */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white-knight">Message Type</h3>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleMessageTypeChange('linkedin')}
                      className={`${
                        messageType === 'linkedin'
                          ? 'bg-supernova text-shadowforce'
                          : 'bg-shadowforce/30 text-guardian hover:bg-shadowforce/50'
                      }`}
                      size="sm"
                    >
                      📱 LinkedIn
                    </Button>
                    <Button
                      onClick={() => handleMessageTypeChange('email')}
                      className={`${
                        messageType === 'email'
                          ? 'bg-supernova text-shadowforce'
                          : 'bg-shadowforce/30 text-guardian hover:bg-shadowforce/50'
                      }`}
                      size="sm"
                    >
                      ✉️ Email
                    </Button>
                  </div>
                </Card>

                {/* Template Selector */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white-knight">
                      {messageType === 'linkedin' ? 'LinkedIn' : 'Email'} Templates
                    </h3>
                    <div className="text-sm text-guardian">
                      {messageType === 'linkedin' ? 'LinkedIn' : 'Email'} Character Limit: {currentLimit.toLocaleString()}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(templates[messageType]).map(([id, template]) => (
                      <Button
                        key={id}
                        onClick={() => handleTemplateChange(Number(id))}
                        className={`text-xs ${
                          selectedTemplate === Number(id)
                            ? 'bg-supernova text-shadowforce'
                            : 'bg-shadowforce/30 text-guardian hover:bg-shadowforce/50'
                        }`}
                        size="sm"
                      >
                        {template.name}
                      </Button>
                    ))}
                  </div>
                </Card>

                {/* Message Body */}
                <Card className="p-6">
                  
                  {editingBody ? (
                    <div>
                      <textarea
                        value={bodyText}
                        onChange={(e) => setBodyText(e.target.value)}
                        className={`w-full p-3 bg-shadowforce border rounded-lg text-white-knight resize-none mb-2 ${
                          isOverLimit 
                            ? 'border-red-500 border-2' 
                            : isNearLimit 
                              ? 'border-yellow-500 border-2' 
                              : 'border-guardian/30'
                        }`}
                        rows={12}
                        placeholder="Your personalized message will appear here..."
                      />
                      {/* Character Counter */}
                      <div className="flex justify-between items-center mb-4">
                        <div className={`text-sm font-medium ${
                          isOverLimit 
                            ? 'text-red-400' 
                            : isNearLimit 
                              ? 'text-yellow-400' 
                              : 'text-guardian'
                        }`}>
                          {characterCount}/{currentLimit} characters
                        </div>
                        {isOverLimit && (
                          <div className="text-red-400 text-xs">
                            ⚠️ Message exceeds {messageType === 'linkedin' ? 'LinkedIn' : 'email'} character limit
                          </div>
                        )}
                        {isNearLimit && !isOverLimit && (
                          <div className="text-yellow-400 text-xs">
                            ⚠️ Approaching character limit
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className={`p-3 bg-shadowforce/50 rounded-lg text-white-knight whitespace-pre-wrap mb-2 ${
                        isOverLimit ? 'border-l-4 border-red-500' : isNearLimit ? 'border-l-4 border-yellow-500' : ''
                      }`}>
                        {bodyText}
                      </div>
                      {/* Character Counter in view mode */}
                      <div className="flex justify-between items-center mb-4">
                        <div className={`text-sm font-medium ${
                          isOverLimit 
                            ? 'text-red-400' 
                            : isNearLimit 
                              ? 'text-yellow-400' 
                              : 'text-guardian'
                        }`}>
                          {characterCount}/{currentLimit} characters
                        </div>
                        {isOverLimit && (
                          <div className="text-red-400 text-xs">
                            ⚠️ Message exceeds {messageType === 'linkedin' ? 'LinkedIn' : 'email'} character limit
                          </div>
                        )}
                        {isNearLimit && !isOverLimit && (
                          <div className="text-yellow-400 text-xs">
                            ⚠️ Approaching character limit
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-guardian/20">
                     <Tooltip content="Generate an AI variation of the current message">
                       <Button
                         onClick={generateAIVariation}
                         disabled={isGeneratingVariation || !bodyText.trim()}
                         className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 flex items-center gap-2"
                         size="sm"
                       >
                         {isGeneratingVariation ? (
                           <>
                             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                             Generating...
                           </>
                         ) : (
                           <>
                             <Sparkles size={16} />
                             AI Variation
                           </>
                         )}
                       </Button>
                     </Tooltip>

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
                     
                     <Tooltip content={isOverLimit ? `Message exceeds ${messageType === 'linkedin' ? 'LinkedIn' : 'email'} character limit` : `Copy the message to use in ${messageType === 'linkedin' ? 'LinkedIn' : 'email'} to contact your candidate`}>
                       <Button
                         onClick={() => copyToClipboard(bodyText)}
                         disabled={messageType === 'linkedin' && isOverLimit}
                         className={`flex items-center gap-2 ${
                           messageType === 'linkedin' && isOverLimit
                             ? 'bg-gray-500 cursor-not-allowed opacity-50 text-white' 
                             : 'bg-supernova hover:bg-supernova/90 text-shadowforce'
                         }`}
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
                             {messageType === 'linkedin' && isOverLimit ? 'Exceeds Limit' : 'Copy Message'}
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

