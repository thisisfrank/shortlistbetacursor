import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useSearchParams, Navigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, Copy, Edit, Check, User, Sparkles, AlertCircle, CheckCircle, Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Tooltip } from '../components/ui/Tooltip';
import { reviewMessageGrammar, GrammarReviewResult } from '../services/anthropicService';
import { useMarketplaceUnlock } from '../hooks/useMarketplaceUnlock';

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

interface CustomTemplate {
  id: string;
  name: string;
  template: string;
  messageType: 'linkedin' | 'email';
  createdAt: Date;
}

export const AIMessageGeneratorPage: React.FC = () => {
  const { user, userProfile } = useAuth();
  const dataContext = useData();
  const [searchParams] = useSearchParams();
  const { isAIGeneratorUnlocked, isDataLoading } = useMarketplaceUnlock();
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
  const [reviewResult, setReviewResult] = useState<GrammarReviewResult | null>(null);
  const [showVariationModal, setShowVariationModal] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [showCustomTemplateModal, setShowCustomTemplateModal] = useState(false);
  const [editingCustomTemplate, setEditingCustomTemplate] = useState<CustomTemplate | null>(null);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateContent, setNewTemplateContent] = useState('');
  const [selectedCustomTemplate, setSelectedCustomTemplate] = useState<string | null>(null);

  // Character limits
  const LINKEDIN_CHAR_LIMIT = 300;
  const EMAIL_CHAR_LIMIT = 2000; // Reasonable email limit
  const currentLimit = messageType === 'linkedin' ? LINKEDIN_CHAR_LIMIT : EMAIL_CHAR_LIMIT;
  const characterCount = bodyText.length;
  const isOverLimit = characterCount > currentLimit;
  const isNearLimit = characterCount > currentLimit * 0.9; // 90% of limit

  // Load custom templates from localStorage on mount
  React.useEffect(() => {
    const savedTemplates = localStorage.getItem(`customTemplates_${user?.id}`);
    if (savedTemplates) {
      try {
        const parsed = JSON.parse(savedTemplates).map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt)
        }));
        setCustomTemplates(parsed);
      } catch (error) {
        console.error('Error loading custom templates:', error);
      }
    }
  }, [user?.id]);

  // Save custom templates to localStorage
  const saveCustomTemplates = (templates: CustomTemplate[]) => {
    localStorage.setItem(`customTemplates_${user?.id}`, JSON.stringify(templates));
    setCustomTemplates(templates);
  };

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

Saw your LinkedIn, looks like you've done some great work at {{current_company}}.

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
        name: "Email 4 – Short and sweet",
        template: `Subject: salary bump

Hi {{firstname}},

Saw your LinkedIn today – super solid background.

We have a {{job_opening}} role open right now you look great for.

The salary is around $\{{salary}}k base + benefits.

Is that in your range to consider a move?

Let me know and I can share the full job description.

Thank you,
Alex`
      }
    }
  };

  // Fill template with candidate and job data
  const getMessageTemplate = (templateId: number = selectedTemplate, candidate?: Candidate, job?: Job) => {
    // If a custom template is selected, use it instead
    if (selectedCustomTemplate) {
      const customTemplate = customTemplates.find(t => t.id === selectedCustomTemplate);
      if (customTemplate) {
        return fillTemplateVariables(customTemplate.template, candidate, job);
      }
    }
    
    const templateGroup = templates[messageType];
    const template = templateGroup[templateId as keyof typeof templateGroup];
    if (!template) return '';
    
    return fillTemplateVariables(template.template, candidate, job);
  };

  // Custom template management functions
  const handleSaveCustomTemplate = () => {
    if (!newTemplateName.trim() || !newTemplateContent.trim()) return;
    
    const newTemplate: CustomTemplate = {
      id: Date.now().toString(),
      name: newTemplateName,
      template: newTemplateContent,
      messageType,
      createdAt: new Date()
    };
    
    const updatedTemplates = [...customTemplates, newTemplate];
    saveCustomTemplates(updatedTemplates);
    
    setNewTemplateName('');
    setNewTemplateContent('');
    setShowCustomTemplateModal(false);
  };

  const handleEditCustomTemplate = (template: CustomTemplate) => {
    setEditingCustomTemplate(template);
    setNewTemplateName(template.name);
    setNewTemplateContent(template.template);
    setShowCustomTemplateModal(true);
  };

  const handleUpdateCustomTemplate = () => {
    if (!editingCustomTemplate || !newTemplateName.trim() || !newTemplateContent.trim()) return;
    
    const updatedTemplates = customTemplates.map(t => 
      t.id === editingCustomTemplate.id 
        ? { ...t, name: newTemplateName, template: newTemplateContent }
        : t
    );
    
    saveCustomTemplates(updatedTemplates);
    
    setEditingCustomTemplate(null);
    setNewTemplateName('');
    setNewTemplateContent('');
    setShowCustomTemplateModal(false);
  };

  const handleDeleteCustomTemplate = (templateId: string) => {
    const updatedTemplates = customTemplates.filter(t => t.id !== templateId);
    saveCustomTemplates(updatedTemplates);
    
    if (selectedCustomTemplate === templateId) {
      setSelectedCustomTemplate(null);
    }
  };

  const handleSelectCustomTemplate = (template: CustomTemplate) => {
    setSelectedCustomTemplate(template.id);
    setSelectedTemplate(0); // Reset predefined template selection
    const candidate = prefilledCandidate || selectedCandidate || undefined;
    const job = prefilledJob || selectedJob || undefined;
    const filledTemplate = fillTemplateVariables(template.template, candidate, job);
    setBodyText(filledTemplate);
    setEditingBody(false);
  };

  const handleSaveCurrentAsTemplate = () => {
    setNewTemplateContent(bodyText);
    setShowCustomTemplateModal(true);
  };

  const fillTemplateVariables = (templateText: string, candidate?: Candidate, job?: Job) => {
    const candidateFirstName = candidate ? candidate.firstName : '{{firstname}}';
    const currentRole = candidate?.headline || candidate?.experience?.[0]?.title || '{{current_role}}';
    const currentCompany = candidate?.experience?.[0]?.company || '{{current_company}}';
    const jobTitle = job ? job.title : '{{job_opening}}';
    const companyName = job ? job.companyName : '{{company_name}}';
    // Use job's must-have skills instead of candidate's skills
    const skillOne = job?.mustHaveSkills?.[0] || '{{skillone}}';
    const skillTwo = job?.mustHaveSkills?.[1] || '{{skilltwo}}';
    const skillThree = job?.mustHaveSkills?.[2] || '{{skillthree}}';
    const userName = userProfile?.name || '{{your_name}}';
    const salary = '{{salary}}'; // Placeholder for user to fill in

    return templateText
      .replace(/\{\{firstname\}\}/g, candidateFirstName)
      .replace(/\{\{current_role\}\}/g, currentRole)
      .replace(/\{\{current_company\}\}/g, currentCompany)
      .replace(/\{\{job_opening\}\}/g, jobTitle)
      .replace(/\{\{company_name\}\}/g, companyName)
      .replace(/\{\{skillone\}\}/g, skillOne)
      .replace(/\{\{skilltwo\}\}/g, skillTwo)
      .replace(/\{\{skillthree\}\}/g, skillThree)
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
    setSelectedCustomTemplate(null); // Reset custom template selection
    const candidate = prefilledCandidate || selectedCandidate || undefined;
    const job = prefilledJob || selectedJob || undefined;
    const message = getMessageTemplate(templateId, candidate, job);
    setBodyText(message);
    setEditingBody(false);
  };

  const handleMessageTypeChange = (type: 'linkedin' | 'email') => {
    setMessageType(type);
    setSelectedCustomTemplate(null); // Reset custom template when changing message type
    const candidate = prefilledCandidate || selectedCandidate || undefined;
    const job = prefilledJob || selectedJob || undefined;
    const message = getMessageTemplate(selectedTemplate, candidate, job);
    setBodyText(message);
    setEditingBody(false);
  };

  // =====================================
  // Validation System (Step 4)
  // =====================================
  
  const FORBIDDEN_COMPANY = /(mission|funding|investor|series [a-e]|ipo|customers?|client(s)?|award(s)?|press|hq|headquarters|office(s)?|location(s)?|culture|values|perk(s)?|unlimited pto|equity|stock|rsu|bonus|visa|relocation|remote policy|platform|initiatives?)/i;
  const FORBIDDEN_CANDIDATE = /(leader|leadership|expert|seasoned|rockstar|ninja|guru|innovative|visionary|world[- ]class|award[- ]winning|impressive)/i;
  const EXTRA_PLACEHOLDER = /{{(?!firstname|job_opening|company_name|skillone|skilltwo|skillthree|salary|your_name|current_role|current_company)[^}]+}}/i;
  const ANY_PLACEHOLDER = /{{(firstname|job_opening|company_name|skillone|skilltwo|skillthree|salary|your_name|current_role|current_company)}}/g;
  const EM_DASH = /\u2014/; // em dash (—)
  const EMOJI = /[\p{Extended_Pictographic}]/u;
  const HASHTAG = /#/;

  // Normalize spacing and formatting
  const normalizeFormatting = (text: string): string => {
    let normalized = text
      .replace(/\r\n/g, '\n')           // Normalize line endings
      .replace(/\r/g, '\n')             // Convert any remaining \r to \n
      .replace(/[ \t]+\n/g, '\n')       // Remove trailing spaces/tabs before newlines
      .replace(/\n{3,}/g, '\n\n')       // Max 2 consecutive newlines (one blank line)
      .replace(/^\n+/, '')              // Remove leading newlines
      .replace(/\n+$/, '')              // Remove trailing newlines
      .trim();
    
    // Ensure line break after greeting patterns
    // Matches: "Hi Name,", "Hey Name,", "Hello Name," etc. followed by text on same line
    normalized = normalized.replace(/(^(?:Hi|Hey|Hello)\s+\{\{firstname\}\},)\s*([^\n])/i, '$1\n\n$2');
    
    return normalized;
  };

  const validateMessage = (text: string, channel: 'linkedin' | 'email'): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // 1. Check for em dashes
    if (EM_DASH.test(text)) {
      errors.push('Contains em dashes (—)');
    }
    
    // 2. Check for emojis or hashtags
    if (EMOJI.test(text)) {
      errors.push('Contains emojis');
    }
    if (HASHTAG.test(text)) {
      errors.push('Contains hashtags');
    }
    
    // 3. Check for extra/invalid placeholders
    if (EXTRA_PLACEHOLDER.test(text)) {
      errors.push('Contains invalid placeholders');
    }
    
    // 4. Check length caps
    const maxLen = channel === 'linkedin' ? 300 : 700;
    const charCount = [...text].length; // Unicode-safe
    if (charCount > maxLen) {
      errors.push(`Exceeds ${maxLen} character limit (${charCount} chars)`);
    }
    
    // 5. Check forbidden content - with detailed logging for debugging
    if (FORBIDDEN_COMPANY.test(text)) {
      const match = text.match(FORBIDDEN_COMPANY);
      errors.push(`Contains forbidden company details: "${match?.[0]}"`);
    }
    if (FORBIDDEN_CANDIDATE.test(text)) {
      const match = text.match(FORBIDDEN_CANDIDATE);
      errors.push(`Contains forbidden candidate traits: "${match?.[0]}"`);
    }
    
    // 6. Must contain a question mark (more lenient - just needs to have one)
    const trimmed = text.trim();
    if (!trimmed.includes('?')) {
      errors.push('Does not contain a question mark');
    }
    
    // 7. Channel-specific required keywords
    if (channel === 'linkedin') {
      if (!/(salary|range)/i.test(trimmed)) {
        errors.push('Missing required salary/range keyword');
      }
    } else {
      if (!/(salary|range|jd|job description|details|spec)/i.test(trimmed)) {
        errors.push('Missing required closing keyword');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const generateAIVariation = async (variationType: string) => {
    if (!bodyText.trim()) return;
    
    setIsGeneratingVariation(true);
    setShowVariationModal(false);
    
    // Store base template for fallback
    const baseTemplate = getMessageTemplate(
      selectedTemplate, 
      prefilledCandidate || selectedCandidate || undefined,
      prefilledJob || selectedJob || undefined
    );
    
    try {
      let specificPrompt = '';
      
      switch (variationType) {
        case 'longer':
          specificPrompt = `Make this ${messageType} recruitment message longer and more detailed while keeping it professional. Add more context about the role scope or impact (NOT company or candidate specifics). Maintain the core message and salary question.`;
          break;
        case 'shorter':
          specificPrompt = `Make this ${messageType} recruitment message shorter and more concise while keeping all essential information. Remove any unnecessary words but maintain the professional tone and salary question.`;
          break;
        case 'more_casual':
          specificPrompt = `Make this ${messageType} recruitment message more casual and friendly while keeping it professional. Use light contractions and conversational cadence. No slang or emojis.`;
          break;
        case 'more_formal':
          specificPrompt = `Make this ${messageType} recruitment message more formal and professional while keeping it engaging. Use more business-like language and balanced sentences.`;
          break;
        case 'different_approach':
          specificPrompt = `Rewrite this ${messageType} recruitment message using a completely different approach. Try reordering to: candidate → role → closing question. Do not add new information.`;
          break;
        default:
          specificPrompt = `Create a professional variation of this ${messageType} recruitment message that ${messageType === 'linkedin' ? 'stays under 300 characters' : 'is concise and professional'} and maintains the same structure and intent.`;
      }

      const fullPrompt = `${specificPrompt}

${bodyText}

CRITICAL REQUIREMENTS:
- ${messageType === 'linkedin' ? 'Output MUST be ≤300 characters' : 'Output MUST be ≤700 characters'} (count carefully!)
- Preserve ALL placeholders EXACTLY ({{firstname}}, {{job_opening}}, {{company_name}}, {{skillone}}, {{skilltwo}}, {{salary}}, {{your_name}}, etc.)
- FORMATTING: Start with greeting "Hi {{firstname}}," or "Hey {{firstname}}," on its own line, then blank line, then body text
- End with ONE question containing "${messageType === 'linkedin' ? 'salary or range' : 'salary, range, JD, job description, details, or spec'}"
- DO NOT add signatures, sign-offs, or sender names at the end (the template handles this)
- NO em dashes (—), use hyphens (-) or commas instead
- NO emojis, hashtags, or links
- DO NOT use words like: platform, initiatives, mission, funding, culture, perks, office, headquarters, values, equity, stock, bonus, relocation
- DO NOT use words like: impressive, leader, expert, seasoned, rockstar, innovative, visionary, world-class, award-winning
- Keep professional and direct
- NO fluff at the start (skip "I hope this message finds you well")
- Put the candidate as the hero
- Natural rhythm with varied sentence length
- The message should END with the question mark - nothing after it

Output ONLY the final message text with NO signature or closing.`;

      // Attempt 1: Generate variation
      const result = await reviewMessageGrammar(fullPrompt);
      let generatedText = result.correctedMessage || '';
      
      // Clean up em dashes and normalize formatting
      generatedText = generatedText.replace(/\u2014/g, '-');
      generatedText = normalizeFormatting(generatedText);
      
      // Validate first attempt
      const validation = validateMessage(generatedText, messageType);
      
      if (validation.isValid) {
        console.log('✅ Variation validated successfully');
        setBodyText(generatedText);
        return;
      }
      
      // First validation failed - log errors and retry once
      console.warn('❌ First attempt failed validation:');
      console.warn('Errors:', validation.errors);
      console.warn('Generated text:', generatedText);
      console.warn('Character count:', [...generatedText].length);
      
      // Attempt 2: Regenerate
      const retryResult = await reviewMessageGrammar(fullPrompt);
      let retryText = retryResult.correctedMessage || '';
      retryText = retryText.replace(/\u2014/g, '-');
      retryText = normalizeFormatting(retryText);
      
      const retryValidation = validateMessage(retryText, messageType);
      
      if (retryValidation.isValid) {
        console.log('✅ Retry validated successfully');
        setBodyText(retryText);
        return;
      }
      
      // Both attempts failed - revert to base template
      console.warn('❌ Retry also failed validation:');
      console.warn('Errors:', retryValidation.errors);
      console.warn('Retry text:', retryText);
      console.warn('Character count:', [...retryText].length);
      console.log('↩️ Reverting to base template');
      setBodyText(baseTemplate);
      
    } catch (error) {
      console.error('AI variation generation error:', error);
      // On error, revert to base template
      console.log('↩️ Reverting to base template due to error');
      setBodyText(baseTemplate);
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
    const candidate = prefilledCandidate || selectedCandidate || undefined;
    const job = prefilledJob || selectedJob || undefined;
    
    const message = getMessageTemplate(selectedTemplate, candidate, job);
    setBodyText(message);
  }, [selectedJob, selectedCandidate, prefilledCandidate, prefilledJob, selectedTemplate, messageType, userProfile]);

  // Auto-resize textarea when bodyText changes
  React.useEffect(() => {
    if (editingBody) {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      }
    }
  }, [bodyText, editingBody]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedBody(true);
      setTimeout(() => setCopiedBody(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
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

  // Show loading state if data is still loading
  if (isDataLoading()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-shadowforce via-shadowforce-light to-shadowforce flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-supernova mx-auto mb-4"></div>
          <p className="text-guardian font-jakarta">Loading your data...</p>
        </div>
      </div>
    );
  }

  // Redirect to marketplace if AI Generator is locked for client users
  if (userProfile.role === 'client' && !isAIGeneratorUnlocked()) {
    return <Navigate to="/marketplace" replace />;
  }

  return (
         <div className="min-h-screen bg-gradient-to-br from-shadowforce via-shadowforce-light to-shadowforce">
       <div className="flex flex-col md:flex-row min-h-screen">
         {/* Left Panel - Jobs List */}
         <div className="w-full md:w-1/3 bg-shadowforce-light/30 md:border-r border-guardian/20 p-4 md:p-6 md:overflow-y-auto md:max-h-none">
          <div className="mb-4 md:mb-6">
            <h1 className="text-xl md:text-2xl font-bold text-white-knight font-jakarta mb-2">
              Message Generator
            </h1>
          </div>

          {/* Message Type Toggle */}
          <div className="mb-4">
            <h3 className="text-base md:text-lg font-semibold text-white-knight font-jakarta mb-2">Message Type</h3>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => handleMessageTypeChange('linkedin')}
                className={`border border-supernova ${
                  messageType === 'linkedin'
                    ? 'bg-supernova text-shadowforce'
                    : 'bg-transparent text-white-knight hover:bg-supernova hover:text-shadowforce'
                }`}
                size="sm"
              >
                📱 LinkedIn
              </Button>
              <Button
                onClick={() => handleMessageTypeChange('email')}
                className={`border border-supernova ${
                  messageType === 'email'
                    ? 'bg-supernova text-shadowforce'
                    : 'bg-transparent text-white-knight hover:bg-supernova hover:text-shadowforce'
                }`}
                size="sm"
              >
                ✉️ Email
              </Button>
            </div>
          </div>

          {/* Template Selector */}
          <div className="mb-4 md:mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base md:text-lg font-semibold text-white-knight font-jakarta">
                {messageType === 'linkedin' ? 'LinkedIn' : 'Email'} Templates
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(templates[messageType]).map(([id, template]) => (
                <Button
                  key={id}
                  onClick={() => handleTemplateChange(Number(id))}
                  className={`text-xs border border-supernova ${
                    selectedTemplate === Number(id)
                      ? 'bg-supernova text-shadowforce'
                      : 'bg-transparent text-white-knight hover:bg-supernova hover:text-shadowforce'
                  }`}
                  size="sm"
                >
                  {template.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Templates Section */}
          <div className="mb-4 md:mb-6">
            <h3 className="text-base md:text-lg font-semibold text-white-knight font-jakarta mb-2">
              Custom Templates
            </h3>
            <Button
              onClick={() => {
                setEditingCustomTemplate(null);
                setNewTemplateName('');
                setNewTemplateContent('');
                setShowCustomTemplateModal(true);
              }}
              className="bg-supernova hover:bg-supernova/90 text-shadowforce flex items-center gap-1 mb-4"
              size="sm"
            >
              <Plus size={14} />
              Add New
            </Button>
            
            {/* Custom Templates List */}
            <div className="space-y-2">
              {customTemplates
                .filter(template => template.messageType === messageType)
                .map((template) => (
                  <div key={template.id} className="flex items-center gap-2">
                    <Button
                      onClick={() => handleSelectCustomTemplate(template)}
                      className={`flex-1 text-left text-xs border border-purple-500 ${
                        selectedCustomTemplate === template.id
                          ? 'bg-purple-500 text-white'
                          : 'bg-transparent text-white-knight hover:bg-purple-500 hover:text-white'
                      }`}
                      size="sm"
                    >
                      {template.name}
                    </Button>
                    <Button
                      onClick={() => handleEditCustomTemplate(template)}
                      className="bg-guardian/30 hover:bg-guardian/50 text-black"
                      size="sm"
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      onClick={() => handleDeleteCustomTemplate(template.id)}
                      className="bg-red-500/30 hover:bg-red-500/50 text-red-200"
                      size="sm"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              
            </div>
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
                        <h3 className="text-white-knight text-sm mb-1 uppercase">
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
         <div className="flex-1 p-4 md:p-6 flex flex-col">
           <div className="flex-1 flex flex-col">

                {/* Message Body */}
                <Card className="p-4 md:p-6 flex flex-col">
                  
                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 md:gap-3 pb-4 mb-4 border-b border-guardian/20">
                     <Tooltip content="Generate an AI variation of the current message">
                       <Button
                         onClick={() => setShowVariationModal(true)}
                         disabled={isGeneratingVariation || !bodyText.trim()}
                         className="bg-purple-600 hover:bg-purple-700 text-black disabled:opacity-50 flex items-center gap-1 md:gap-2 text-xs md:text-sm"
                         size="sm"
                       >
                         {isGeneratingVariation ? (
                           <>
                             <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-white"></div>
                             <span className="hidden sm:inline">Generating...</span>
                             <span className="sm:hidden">Gen...</span>
                           </>
                         ) : (
                           <>
                             <Sparkles size={14} className="md:w-4 md:h-4" />
                             <span className="hidden sm:inline">AI Variation</span>
                             <span className="sm:hidden">AI</span>
                           </>
                         )}
                       </Button>
                     </Tooltip>

                     <Tooltip content="Directly edit the message to fine tune your message">
                       <Button
                         onClick={() => setEditingBody(!editingBody)}
                         className="bg-guardian/30 hover:bg-guardian/50 text-black flex items-center gap-1 md:gap-2 text-xs md:text-sm"
                         size="sm"
                       >
                         <Edit size={14} className="md:w-4 md:h-4" />
                         <span className="hidden sm:inline">{editingBody ? 'Save' : 'Edit Manually'}</span>
                         <span className="sm:hidden">Edit</span>
                       </Button>
                     </Tooltip>

                     <Tooltip content="Save current message as a custom template">
                       <Button
                         onClick={handleSaveCurrentAsTemplate}
                         disabled={!bodyText.trim()}
                         className="bg-green-600 hover:bg-green-700 text-black disabled:opacity-50 flex items-center gap-1 md:gap-2 text-xs md:text-sm"
                         size="sm"
                       >
                         <Save size={14} className="md:w-4 md:h-4" />
                         <span className="hidden sm:inline">Save as Template</span>
                         <span className="sm:hidden">Save</span>
                       </Button>
                     </Tooltip>
                     
                    <Tooltip content={isOverLimit ? `Message exceeds ${messageType === 'linkedin' ? 'LinkedIn' : 'email'} character limit` : `Copy the message to use in ${messageType === 'linkedin' ? 'LinkedIn' : 'email'} to contact your candidate`}>
                      <Button
                        onClick={() => copyToClipboard(bodyText)}
                        disabled={messageType === 'linkedin' && isOverLimit}
                        className={`flex items-center gap-1 md:gap-2 text-xs md:text-sm ${
                          messageType === 'linkedin' && isOverLimit
                            ? 'bg-gray-500 cursor-not-allowed opacity-50 text-white' 
                            : 'bg-supernova hover:bg-supernova/90 text-shadowforce'
                        }`}
                        size="sm"
                      >
                        {copiedBody ? (
                          <>
                            <Check size={14} className="md:w-4 md:h-4" />
                            <span className="hidden sm:inline">Copied!</span>
                            <span className="sm:hidden">✓</span>
                          </>
                      ) : (
                          <>
                            <Copy size={14} className="md:w-4 md:h-4" />
                            <span className="hidden sm:inline">{messageType === 'linkedin' && isOverLimit ? 'Exceeds Limit' : 'Copy Message'}</span>
                            <span className="sm:hidden">Copy</span>
                          </>
                        )}
                      </Button>
                    </Tooltip>

                    {/* LinkedIn Profile Button - Only show when candidate is selected */}
                    {(selectedCandidate || prefilledCandidate) && (selectedCandidate?.linkedinUrl || prefilledCandidate?.linkedinUrl) && (
                      <Tooltip content="Open candidate's LinkedIn profile">
                        <Button
                          onClick={() => {
                            const linkedinUrl = (prefilledCandidate || selectedCandidate)?.linkedinUrl;
                            if (linkedinUrl) {
                              window.open(linkedinUrl, '_blank', 'noopener,noreferrer');
                            }
                          }}
                          className="bg-[#0077B5] hover:bg-[#006399] text-white flex items-center gap-1 md:gap-2 text-xs md:text-sm"
                          size="sm"
                        >
                          <User size={14} className="md:w-4 md:h-4" />
                          <span className="hidden sm:inline">View LinkedIn</span>
                          <span className="sm:hidden">LinkedIn</span>
                        </Button>
                      </Tooltip>
                    )}
                  </div>
                  
                  {editingBody ? (
                   <div className="flex flex-col">
                     <textarea
                       value={bodyText}
                       onChange={(e) => {
                         setBodyText(e.target.value);
                         e.target.style.height = 'auto';
                         e.target.style.height = e.target.scrollHeight + 'px';
                       }}
                       onFocus={(e) => {
                         e.target.style.height = 'auto';
                         e.target.style.height = e.target.scrollHeight + 'px';
                       }}
                        className={`w-full p-3 bg-shadowforce border-2 rounded-lg text-white-knight resize-none mb-2 min-h-[200px] ${
                         isOverLimit 
                           ? 'border-red-500' 
                           : isNearLimit 
                             ? 'border-yellow-500' 
                             : 'border-guardian/30'
                       }`}
                       placeholder="Your personalized message will appear here..."
                     />
                     {/* Character Counter */}
                     <div className="flex justify-end items-center mb-4">
                       <div className={`text-xs md:text-sm font-medium ${
                         isOverLimit 
                           ? 'text-red-400' 
                           : isNearLimit 
                             ? 'text-yellow-400' 
                             : 'text-guardian'
                       }`}>
                         {characterCount}/{currentLimit} characters
                         {isOverLimit && (
                           <span className="ml-2">⚠️ Message exceeds {messageType === 'linkedin' ? 'LinkedIn' : 'email'} character limit</span>
                         )}
                         {isNearLimit && !isOverLimit && (
                           <span className="ml-2">⚠️ Approaching character limit</span>
                         )}
                       </div>
                     </div>
                    </div>
                  ) : (
                   <div className="flex flex-col">
                      <div className={`p-3 bg-shadowforce/50 border-2 rounded-lg text-white-knight whitespace-pre-wrap mb-2 min-h-[200px] ${
                       isOverLimit 
                         ? 'border-red-500' 
                         : isNearLimit 
                           ? 'border-yellow-500' 
                           : 'border-transparent'
                     }`}>
                       {bodyText}
                     </div>
                     {/* Character Counter in view mode */}
                     <div className="flex justify-end items-center mb-4">
                       <div className={`text-xs md:text-sm font-medium ${
                         isOverLimit 
                           ? 'text-red-400' 
                           : isNearLimit 
                             ? 'text-yellow-400' 
                             : 'text-guardian'
                       }`}>
                         {characterCount}/{currentLimit} characters
                         {isOverLimit && (
                           <span className="ml-2">⚠️ Message exceeds {messageType === 'linkedin' ? 'LinkedIn' : 'email'} character limit</span>
                         )}
                         {isNearLimit && !isOverLimit && (
                           <span className="ml-2">⚠️ Approaching character limit</span>
                         )}
                       </div>
                     </div>
                    </div>
                  )}

                </Card>

                                 {/* Grammar Review Results */}
                 {showReviewResults && reviewResult && (
                   <Card className="p-4 md:p-6 border-l-4 border-l-supernova mt-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2 md:gap-3">
                        {reviewResult.hasIssues ? (
                          <AlertCircle size={16} className="text-yellow-500 md:w-5 md:h-5" />
                        ) : (
                          <CheckCircle size={16} className="text-green-500 md:w-5 md:h-5" />
                        )}
                        <div>
                          <h3 className="text-base md:text-lg font-semibold text-white-knight">Grammar Review</h3>
                          <p className="text-guardian text-xs md:text-sm">
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
                        <h4 className="text-white-knight text-sm md:text-base font-medium mb-2">Suggestions:</h4>
                        <ul className="space-y-1">
                          {reviewResult.suggestions.map((suggestion, index) => (
                            <li key={index} className="text-guardian text-xs md:text-sm flex items-start gap-2">
                              <span className="text-supernova">•</span>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {reviewResult.correctedMessage && (
                      <div className="mt-4 p-3 md:p-4 bg-shadowforce rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white-knight text-sm md:text-base font-medium">Suggested Correction:</h4>
                          <Button
                            onClick={applyCorrectedMessage}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white text-xs md:text-sm"
                          >
                            Apply
                          </Button>
                        </div>
                        <div className="text-guardian text-xs md:text-sm whitespace-pre-wrap">
                          {reviewResult.correctedMessage}
                        </div>
                      </div>
                    )}
                  </Card>
                )}
            </div>
        </div>
      </div>

      {/* AI Variation Modal */}
      {showVariationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowVariationModal(false)}>
          <div className="bg-shadowforce border border-guardian/30 rounded-lg p-4 md:p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg md:text-xl font-semibold text-white-knight font-jakarta mb-3 md:mb-4">
              Choose AI Variation Type
            </h3>
            <p className="text-guardian text-xs md:text-sm mb-4 md:mb-6">
              How would you like to modify your message?
            </p>
            
            <div className="space-y-2 md:space-y-3">
              <Button
                onClick={() => generateAIVariation('longer')}
                className="w-full text-left justify-start bg-shadowforce-light hover:bg-supernova hover:text-black text-black border border-guardian/30 text-xs md:text-sm"
              >
                📝 Make it longer and more detailed
              </Button>
              
              <Button
                onClick={() => generateAIVariation('shorter')}
                className="w-full text-left justify-start bg-shadowforce-light hover:bg-supernova hover:text-black text-black border border-guardian/30 text-xs md:text-sm"
              >
                ✂️ Make it shorter/more concise
              </Button>
              
              <Button
                onClick={() => generateAIVariation('more_casual')}
                className="w-full text-left justify-start bg-shadowforce-light hover:bg-supernova hover:text-black text-black border border-guardian/30 text-xs md:text-sm"
              >
                😊 Make it more casual and friendly
              </Button>
              
              <Button
                onClick={() => generateAIVariation('more_formal')}
                className="w-full text-left justify-start bg-shadowforce-light hover:bg-supernova hover:text-black text-black border border-guardian/30 text-xs md:text-sm"
              >
                🎩 Make it more formal and professional
              </Button>
              
              <Button
                onClick={() => generateAIVariation('different_approach')}
                className="w-full text-left justify-start bg-shadowforce-light hover:bg-supernova hover:text-black text-black border border-guardian/30 text-xs md:text-sm"
              >
                🔄 Try a completely different approach
              </Button>
            </div>
            
            <div className="flex gap-2 md:gap-3 mt-4 md:mt-6">
              <Button
                onClick={() => setShowVariationModal(false)}
                variant="outline"
                className="flex-1 text-guardian border-guardian/30 hover:bg-guardian/10 text-xs md:text-sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Template Modal */}
      {showCustomTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowCustomTemplateModal(false)}>
          <div className="bg-shadowforce border border-guardian/30 rounded-lg p-4 md:p-6 max-w-2xl w-full my-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg md:text-xl font-semibold text-white-knight font-jakarta mb-3 md:mb-4">
              {editingCustomTemplate ? 'Edit Custom Template' : 'Create Custom Template'}
            </h3>
            
            <div className="space-y-3 md:space-y-4">
              <div>
                <label className="block text-white-knight text-xs md:text-sm font-medium mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="w-full p-2 md:p-3 bg-shadowforce-light border border-guardian/30 rounded-lg text-white-knight text-sm"
                  placeholder="Enter template name (e.g., 'My LinkedIn Template')"
                />
              </div>
              
              <div>
                <label className="block text-white-knight text-xs md:text-sm font-medium mb-2">
                  Template Content
                </label>
                <textarea
                  value={newTemplateContent}
                  onChange={(e) => setNewTemplateContent(e.target.value)}
                  className="w-full h-32 md:h-40 p-2 md:p-3 bg-shadowforce-light border border-guardian/30 rounded-lg text-white-knight resize-none text-sm"
                  placeholder="Enter your template content. You can use variables like {{firstname}}, {{current_company}}, {{company_name}}, {{job_opening}}, {{skillone}}, {{skilltwo}}, {{skillthree}}, {{your_name}}, and {{salary}}"
                />
                <p className="text-guardian text-xs mt-1">
                  Available variables: {'{'}firstname{'}'}, {'{'}current_company{'}'}, {'{'}company_name{'}'}, {'{'}job_opening{'}'}, {'{'}skillone{'}'}, {'{'}skilltwo{'}'}, {'{'}skillthree{'}'}, {'{'}your_name{'}'}, {'{'}salary{'}'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 md:gap-3 mt-4 md:mt-6">
              <Button
                onClick={() => setShowCustomTemplateModal(false)}
                variant="outline"
                className="flex-1 text-guardian border-guardian/30 hover:bg-guardian/10 text-xs md:text-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={editingCustomTemplate ? handleUpdateCustomTemplate : handleSaveCustomTemplate}
                disabled={!newTemplateName.trim() || !newTemplateContent.trim()}
                className="flex-1 bg-supernova hover:bg-supernova/90 text-shadowforce disabled:opacity-50 text-xs md:text-sm"
              >
                {editingCustomTemplate ? 'Update Template' : 'Save Template'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};