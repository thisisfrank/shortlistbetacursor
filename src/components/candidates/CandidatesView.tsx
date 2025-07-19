import React, { useState } from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { generateJobMatchScore } from '../../services/anthropicService';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Search, Users, ExternalLink, Calendar, Briefcase, Zap, User, ChevronDown, ChevronRight, Target, CreditCard, Crown, MapPin, Download } from 'lucide-react';

export const CandidatesView: React.FC = () => {
  const { jobs, candidates, getCandidatesByJob, getJobById } = useData();
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  
  // Add error boundary
  const [hasError, setHasError] = React.useState(false);
  
  React.useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('CandidatesView Error:', error);
      setHasError(true);
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  if (hasError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-shadowforce via-shadowforce-light to-shadowforce flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-anton text-white-knight mb-4">Something went wrong</h2>
          <p className="text-guardian font-jakarta mb-4">Please refresh the page and try again.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-supernova text-shadowforce rounded-lg font-jakarta font-bold"
          >
            REFRESH PAGE
          </button>
        </div>
      </div>
    );
  }
  const [search, setSearch] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [expandedCandidates, setExpandedCandidates] = useState<Set<string>>(new Set());
  const [matchScores, setMatchScores] = useState<Record<string, { score: number; reasoning: string; loading: boolean }>>({});
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const matchScoresRef = useRef(matchScores);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  
  // Define currentJobCandidates at component level
  const currentJobCandidates = selectedJobId ? getCandidatesByJob(selectedJobId) : [];
  
  // Update ref when state changes
  useEffect(() => {
    matchScoresRef.current = matchScores;
  }, [matchScores]);
  
  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };
  
  const toggleCandidateExpansion = (candidateId: string) => {
    const newExpanded = new Set(expandedCandidates);
    if (newExpanded.has(candidateId)) {
      newExpanded.delete(candidateId);
    } else {
      newExpanded.add(candidateId);
    }
    setExpandedCandidates(newExpanded);
  };
  
  const getMatchScore = useCallback(async (candidateId: string, jobId: string) => {
    if (matchScoresRef.current[candidateId]) return; // Already calculated or loading
    
    // Set loading state
    setMatchScores(prev => ({
      ...prev,
      [candidateId]: { score: 0, reasoning: '', loading: true }
    }));
    
    const job = getJobById(jobId);
    const candidate = candidates.find(c => c.id === candidateId);
    
    if (!job || !candidate) {
      setMatchScores(prev => ({
        ...prev,
        [candidateId]: { score: 0, reasoning: 'Unable to calculate match', loading: false }
      }));
      return;
    }
    
    try {
      const matchData = {
        jobTitle: job.title,
        jobDescription: job.description,
        seniorityLevel: job.seniorityLevel,
        keySkills: job.keySellingPoints, // Using selling points as key skills
        candidateData: {
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          headline: candidate.headline,
          location: candidate.location,
          experience: candidate.experience,
          education: candidate.education,
          skills: candidate.skills,
          about: candidate.summary
        }
      };
      
      const result = await generateJobMatchScore(matchData);
      
      setMatchScores(prev => ({
        ...prev,
        [candidateId]: { ...result, loading: false }
      }));
    } catch (error) {
      console.error('Error calculating match score:', error);
      setMatchScores(prev => ({
        ...prev,
        [candidateId]: { score: 50, reasoning: 'Error calculating match score', loading: false }
      }));
    }
  }, [getJobById, candidates]);
  
  // Calculate match scores for selected job candidates
  useEffect(() => {
    if (selectedJobId) {
      const selectedJob = getJobById(selectedJobId);
      const jobCandidates = getCandidatesByJob(selectedJobId);
      
      if (selectedJob && jobCandidates.length > 0) {
        jobCandidates.forEach(candidate => getMatchScore(candidate.id, selectedJob.id));
      }
    }
  }, [selectedJobId, getJobById, getCandidatesByJob, getMatchScore]);
  
  // Handle direct Stripe checkout
  const handleGetMoreCredits = async () => {
    setIsCreatingCheckout(true);

    try {
      console.log('Navigating to subscription from candidates view');
      console.log('Current location:', window.location.pathname);
      navigate('/subscription');
      console.log('Navigate called from candidates view');
    } catch (error) {
      console.error('Checkout error:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to navigate to subscription page'}`);
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  const toggleCandidateSelection = (candidateId: string) => {
    const newSelected = new Set(selectedCandidates);
    if (newSelected.has(candidateId)) {
      newSelected.delete(candidateId);
    } else {
      newSelected.add(candidateId);
    }
    setSelectedCandidates(newSelected);
  };

  const selectAllCandidates = () => {
    const allCandidateIds = new Set(currentJobCandidates.map(c => c.id));
    setSelectedCandidates(allCandidateIds);
  };

  const clearSelection = () => {
    setSelectedCandidates(new Set());
  };

  const exportSelectedCandidates = async () => {
    if (selectedCandidates.size === 0) {
      alert('Please select at least one candidate to export');
      return;
    }

    setIsExporting(true);

    try {
      const selectedJob = selectedJobId ? getJobById(selectedJobId) : null;
      const selectedCandidateData = currentJobCandidates.filter(candidate => 
        selectedCandidates.has(candidate.id)
      );

      // Prepare CSV data
      const csvHeaders = [
        'Name',
        'LinkedIn URL',
        'Current Role',
        'Location',
        'Match Score',
        'AI Summary',
        'Experience',
        'Education',
        'Skills',
        'Submitted Date'
      ];

      const csvRows = selectedCandidateData.map(candidate => {
        const matchScore = matchScores[candidate.id]?.score || 'N/A';
        
        // Format experience as text
        const experienceText = candidate.experience && candidate.experience.length > 0
          ? candidate.experience.map(exp => `${exp.title} at ${exp.company} (${exp.duration})`).join('; ')
          : 'N/A';

        // Format education as text
        const educationText = candidate.education && candidate.education.length > 0
          ? candidate.education.map(edu => `${edu.degree} from ${edu.school}`).join('; ')
          : 'N/A';

        // Format skills as text
        const skillsText = candidate.skills && candidate.skills.length > 0
          ? candidate.skills.join(', ')
          : 'N/A';

        return [
          `"${candidate.firstName} ${candidate.lastName}"`,
          `"${candidate.linkedinUrl}"`,
          `"${candidate.headline || 'N/A'}"`,
          `"${candidate.location || 'N/A'}"`,
          `"${matchScore}${typeof matchScore === 'number' ? '%' : ''}"`,
          `"${(candidate.summary || 'N/A').replace(/"/g, '""')}"`,
          `"${experienceText.replace(/"/g, '""')}"`,
          `"${educationText.replace(/"/g, '""')}"`,
          `"${skillsText.replace(/"/g, '""')}"`,
          `"${formatDate(candidate.submittedAt)}"`
        ];
      });

      // Create CSV content
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `candidates_${selectedJob?.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clear selection after export
      setSelectedCandidates(new Set());
      
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting candidates. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // If a job is selected, show candidates for that job
  if (selectedJobId) {
    const selectedJob = getJobById(selectedJobId);
    const companyName = selectedJob?.companyName || 'Unknown Company';
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-shadowforce via-shadowforce-light to-shadowforce">
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Header */}
          <header className="mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <Users size={60} className="text-supernova fill-current animate-pulse" />
                <div className="absolute inset-0 bg-supernova/30 blur-xl rounded-full"></div>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-anton text-white-knight mb-4 text-center uppercase tracking-wide">
              CANDIDATES FOR
            </h1>
            <h2 className="text-3xl md:text-4xl font-anton text-supernova mb-4 text-center uppercase tracking-wide">
              {selectedJob?.title}
            </h2>
            {selectedJob && (
              <p className="text-xl text-guardian text-center font-jakarta">
                {companyName}
              </p>
            )}
          </header>
          
          <div className="mb-8">
            <Button 
              variant="outline" 
              onClick={() => setSelectedJobId(null)}
              className="flex items-center gap-2"
            >
              ← BACK TO JOBS
            </Button>
          </div>
          
          {/* Candidate Selection and Export Controls */}
          {currentJobCandidates.length > 0 && (
            <div className="mb-8">
              <Card className="bg-gradient-to-r from-blue-500/20 to-blue-500/10 border-blue-500/30">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center">
                        <Users className="text-blue-400 mr-2" size={20} />
                        <span className="text-white-knight font-jakarta font-semibold">
                          {selectedCandidates.size} of {currentJobCandidates.length} candidates selected
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAllCandidates}
                        disabled={selectedCandidates.size === currentJobCandidates.length}
                      >
                        SELECT ALL
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearSelection}
                        disabled={selectedCandidates.size === 0}
                      >
                        CLEAR SELECTION
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={exportSelectedCandidates}
                        disabled={selectedCandidates.size === 0}
                        isLoading={isExporting}
                        className="flex items-center gap-2"
                      >
                        <Download size={16} />
                        {isExporting ? 'EXPORTING...' : 'EXPORT TO CSV'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {currentJobCandidates.length === 0 ? (
            <Card>
              <CardContent className="p-12">
                <div className="text-center">
                  <div className="mb-6">
                    <Users size={64} className="text-guardian/40 mx-auto" />
                  </div>
                  <h3 className="font-anton text-2xl text-guardian mb-2">NO CANDIDATES YET</h3>
                  <p className="text-guardian/80 font-jakarta">
                    No candidates have been submitted for this job yet. 
                    Once a sourcer completes this job, candidates will appear here.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8">
                <h3 className="text-2xl font-anton text-white-knight mb-8 uppercase tracking-wide">
                  {currentJobCandidates.length} Candidate{currentJobCandidates.length !== 1 ? 's' : ''} Submitted
                </h3>
                
                <div className="space-y-6">
                  {currentJobCandidates.map(candidate => (
                    <Card key={candidate.id} className="hover:shadow-2xl transition-all duration-300 border-l-4 border-l-supernova">
                      <CardContent className="p-8">
                        {/* Main candidate info row - always visible */}
                        <div className="grid grid-cols-7 gap-6 items-center mb-6">
                          {/* AI Match Score */}
                          <div className="col-span-1 text-center">
                            {matchScores[candidate.id]?.loading ? (
                              <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-supernova mr-2"></div>
                                <span className="text-guardian font-jakarta text-sm">Calculating...</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center">
                                <Target className="text-supernova mr-2" size={16} />
                                <div>
                                  <div className="text-2xl font-anton text-supernova">
                                    {matchScores[candidate.id]?.score || 0}%
                                  </div>
                                  <div className="text-xs text-guardian font-jakarta">MATCH</div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Selection Checkbox */}
                          <div className="col-span-1 flex justify-center">
                            <input
                              type="checkbox"
                              checked={selectedCandidates.has(candidate.id)}
                              onChange={() => toggleCandidateSelection(candidate.id)}
                              className="w-5 h-5 text-supernova bg-gray-700 border-gray-600 rounded focus:ring-supernova focus:ring-2"
                            />
                          </div>
                          
                          {/* Name and basic info */}
                          <div className="col-span-2">
                            <h4 className="text-xl font-anton text-white-knight mb-2 uppercase tracking-wide">
                              {candidate.firstName === 'N/A' && candidate.lastName === 'N/A' 
                                ? 'N/A' 
                                : `${candidate.firstName} ${candidate.lastName}`}
                            </h4>
                          </div>
                          
                          {/* Actions */}
                          <div className="col-span-2 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleCandidateExpansion(candidate.id)}
                              className="flex items-center gap-2"
                            >
                              {expandedCandidates.has(candidate.id) ? (
                                <>
                                  <ChevronDown size={16} />
                                  COLLAPSE
                                </>
                              ) : (
                                <>
                                  <ChevronRight size={16} />
                                  EXPAND
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        {/* Match Score Reasoning */}
                        {matchScores[candidate.id] && !matchScores[candidate.id].loading && (
                          <div className="mb-6 p-4 bg-supernova/10 border border-supernova/30 rounded-lg">
                            <div className="flex items-center mb-1">
                              <Target className="text-supernova mr-2" size={14} />
                              <span className="text-sm font-jakarta font-semibold text-supernova uppercase tracking-wide">Match Analysis</span>
                            </div>
                            <p className="text-white-knight font-jakarta text-sm">{matchScores[candidate.id].reasoning}</p>
                          </div>
                        )}
                        
                        {/* Expanded Details */}
                        {expandedCandidates.has(candidate.id) && (
                          <div className="border-t border-guardian/20 pt-6 space-y-6">
                            {/* Basic Info Row - Only shown when expanded */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 p-4 bg-shadowforce rounded-lg">
                              <div>
                                <div className="flex items-center mb-2">
                                  <Briefcase size={16} className="text-supernova mr-2" />
                                  <span className="text-sm font-jakarta font-semibold text-supernova uppercase tracking-wide">Current Role</span>
                                </div>
                                <p className="text-white-knight font-jakarta font-medium">
                                  {candidate.headline || 'N/A'}
                                </p>
                              </div>
                              
                              <div>
                                <div className="flex items-center mb-2">
                                  <MapPin size={16} className="text-supernova mr-2" />
                                  <span className="text-sm font-jakarta font-semibold text-supernova uppercase tracking-wide">Location</span>
                                </div>
                                <p className="text-white-knight font-jakarta font-medium">
                                  {candidate.location || 'N/A'}
                                </p>
                              </div>
                              
                              <div>
                                <div className="flex items-center mb-2">
                                  <Calendar size={16} className="text-supernova mr-2" />
                                  <span className="text-sm font-jakarta font-semibold text-supernova uppercase tracking-wide">Submitted</span>
                                </div>
                                <p className="text-white-knight font-jakarta font-medium">
                                  {formatDate(candidate.submittedAt)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Left Column */}
                              <div className="space-y-6">
                        
                                {candidate.summary && (
                                  <div>
                                    <div className="flex items-center mb-3">
                                      <Zap size={16} className="text-blue-400 mr-2" />
                                      <p className="text-sm font-jakarta font-semibold text-blue-400 uppercase tracking-wide">AI Summary</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 p-4 rounded-lg">
                                      <p className="text-white-knight font-jakarta text-sm leading-relaxed">
                                        {candidate.summary}
                                      </p>
                                    </div>
                                  </div>
                                )}
                        
                                {!candidate.summary && (
                                  <div>
                                    <div className="flex items-center mb-3">
                                      <Zap size={16} className="text-guardian/60 mr-2" />
                                      <p className="text-sm font-jakarta font-semibold text-guardian/60 uppercase tracking-wide">AI Summary</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-guardian/10 to-guardian/5 border border-guardian/20 p-4 rounded-lg">
                                      <p className="text-guardian font-jakarta text-sm leading-relaxed">
                                        N/A
                                      </p>
                                    </div>
                                  </div>
                                )}
                        
                                {candidate.experience && candidate.experience.length > 0 && (
                                  <div>
                                    <div className="flex items-center mb-3">
                                      <Briefcase size={16} className="text-green-400 mr-2" />
                                      <p className="text-sm font-jakarta font-semibold text-green-400 uppercase tracking-wide">Recent Experience</p>
                                    </div>
                                    <div className="space-y-2">
                                      {candidate.experience.slice(0, 3).map((exp, index) => (
                                        <div key={index} className="text-sm bg-green-500/5 border border-green-500/20 p-3 rounded-lg">
                                          <p className="text-white-knight font-jakarta font-semibold">{exp.title}</p>
                                          <p className="text-guardian font-jakarta">{exp.company}</p>
                                          {exp.duration && (
                                            <p className="text-guardian/80 font-jakarta text-xs">{exp.duration}</p>
                                          )}
                                        </div>
                                      ))}
                                      {candidate.experience.length > 3 && (
                                        <div className="text-center">
                                          <span className="text-xs text-guardian/60 font-jakarta">
                                            +{candidate.experience.length - 3} more positions
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                        
                                {(!candidate.experience || candidate.experience.length === 0) && (
                                  <div>
                                    <div className="flex items-center mb-3">
                                      <Briefcase size={16} className="text-guardian/60 mr-2" />
                                      <p className="text-sm font-jakarta font-semibold text-guardian/60 uppercase tracking-wide">Recent Experience</p>
                                    </div>
                                    <div className="text-sm bg-guardian/5 border border-guardian/20 p-3 rounded-lg">
                                      <p className="text-guardian font-jakarta">N/A</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {/* Right Column */}
                              <div className="space-y-6">
                        
                                {candidate.education && candidate.education.length > 0 && (
                                  <div>
                                    <div className="flex items-center mb-3">
                                      <User size={16} className="text-purple-400 mr-2" />
                                      <p className="text-sm font-jakarta font-semibold text-purple-400 uppercase tracking-wide">Education</p>
                                    </div>
                                    <div className="space-y-1">
                                      {candidate.education.slice(0, 2).map((edu, index) => (
                                        <div key={index} className="text-sm bg-purple-500/5 border border-purple-500/20 p-3 rounded-lg">
                                          <p className="text-white-knight font-jakarta font-semibold">{edu.degree}</p>
                                          <p className="text-guardian font-jakarta">{edu.school}</p>
                                        </div>
                                      ))}
                                      {candidate.education.length > 2 && (
                                        <div className="text-center">
                                          <span className="text-xs text-guardian/60 font-jakarta">
                                            +{candidate.education.length - 2} more
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                        
                                {(!candidate.education || candidate.education.length === 0) && (
                                  <div>
                                    <div className="flex items-center mb-3">
                                      <User size={16} className="text-guardian/60 mr-2" />
                                      <p className="text-sm font-jakarta font-semibold text-guardian/60 uppercase tracking-wide">Education</p>
                                    </div>
                                    <div className="text-sm bg-guardian/5 border border-guardian/20 p-3 rounded-lg">
                                      <p className="text-guardian font-jakarta">N/A</p>
                                    </div>
                                  </div>
                                )}
                        
                                {candidate.skills && candidate.skills.length > 0 && (
                                  <div>
                                    <div className="flex items-center mb-3">
                                      <Zap size={16} className="text-orange-400 mr-2" />
                                      <p className="text-sm font-jakarta font-semibold text-orange-400 uppercase tracking-wide">Key Skills</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {candidate.skills.slice(0, 8).map((skill, index) => (
                                        <span 
                                          key={index}
                                          className="px-3 py-1 bg-gradient-to-r from-orange-500/20 to-orange-500/10 border border-orange-500/30 text-orange-300 text-xs rounded-full font-jakarta font-medium"
                                        >
                                          {typeof skill === 'string' ? skill : (skill?.title || String(skill))}
                                        </span>
                                      ))}
                                      {candidate.skills.length > 8 && (
                                        <span className="px-3 py-1 bg-guardian/10 border border-guardian/20 text-guardian text-xs rounded-full font-jakarta">
                                          +{candidate.skills.length - 8} more
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                        
                                {(!candidate.skills || candidate.skills.length === 0) && (
                                  <div>
                                    <div className="flex items-center mb-3">
                                      <Zap size={16} className="text-guardian/60 mr-2" />
                                      <p className="text-sm font-jakarta font-semibold text-guardian/60 uppercase tracking-wide">Key Skills</p>
                                    </div>
                                    <div className="text-sm bg-guardian/5 border border-guardian/20 p-3 rounded-lg">
                                      <p className="text-guardian font-jakarta">N/A</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="mt-6 pt-6 border-t border-guardian/20">
                              <Button 
                                variant="primary" 
                                size="lg" 
                                fullWidth
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(candidate.linkedinUrl, '_blank');
                                }}
                                className="flex items-center justify-center gap-2 glow-supernova"
                              >
                                <ExternalLink size={16} />
                                VIEW FULL LINKEDIN PROFILE
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }
  
  // Show jobs list
  // Debug: Log current state
  console.log('🔍 CandidatesView Debug:', {
    user: user?.email,
    totalJobs: jobs?.length || 0,
    totalCandidates: candidates?.length || 0
  });

  // Ensure we have valid data arrays with fallbacks
  const safeJobs = jobs || [];
  const safeCandidates = candidates || [];

  // Filter jobs to only show those submitted by the current authenticated user
  const userJobs = safeJobs.filter(job => {
    if (!user || !job) return false; // No user or invalid job, no jobs
    
    // Jobs now reference user_id directly (new architecture)
    const matchesUser = job.userId === user.id;
    
    console.log(`Job ${job.id}: job userId ${job.userId}, user id ${user.id}, matches: ${matchesUser}`);
    
    return matchesUser;
  });

  console.log('👤 User jobs found:', userJobs.length);
  
  // Show loading state if data is still loading
  if (!jobs || !candidates) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-shadowforce via-shadowforce-light to-shadowforce flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-supernova mx-auto mb-4"></div>
          <p className="text-guardian font-jakarta">Loading your candidates...</p>
        </div>
      </div>
    );
  }
  
  const filteredJobs = userJobs.filter(job => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        job.title.toLowerCase().includes(searchLower) ||
        (job.companyName && job.companyName.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });
  
  // Sort jobs by date (newest first)
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-shadowforce via-shadowforce-light to-shadowforce">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <Briefcase size={60} className="text-supernova fill-current animate-pulse" />
              <div className="absolute inset-0 bg-supernova/30 blur-xl rounded-full"></div>
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-anton text-white-knight mb-4 text-center uppercase tracking-wide">
            JOB SUBMISSIONS
          </h1>
          <p className="text-xl text-guardian text-center font-jakarta max-w-2xl mx-auto">
            Select a job to view submitted candidates from our expert sourcing team
          </p>
        </header>
        
        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-gradient-to-br from-supernova/20 to-supernova/10 border-supernova/30 hover:border-supernova/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-anton text-lg text-supernova uppercase tracking-wide">Total Jobs</h3>
                  <p className="text-3xl font-anton text-white-knight">{userJobs.length}</p>
                </div>
                <Briefcase className="text-supernova" size={32} />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500/20 to-blue-500/10 border-blue-500/30 hover:border-blue-500/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-anton text-lg text-blue-400 uppercase tracking-wide">Total Candidates</h3>
                  <p className="text-3xl font-anton text-white-knight">
                    {userJobs.reduce((total, job) => total + getCandidatesByJob(job.id).length, 0)}
                  </p>
                </div>
                <Users className="text-blue-400" size={32} />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/20 to-green-500/10 border-green-500/30 hover:border-green-500/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-anton text-lg text-green-400 uppercase tracking-wide">Completed Jobs</h3>
                  <p className="text-3xl font-anton text-white-knight">
                    {userJobs.filter(job => job.status === 'Completed').length}
                  </p>
                </div>
                <Zap className="text-green-400" size={32} />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Upgrade CTA */}
        <div className="mb-12">
          <Card className="bg-gradient-to-r from-supernova/20 via-supernova/10 to-transparent border-supernova/30 hover:border-supernova/50 transition-all duration-300">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center">
                  <div className="bg-supernova/20 rounded-full p-4 mr-6">
                    <CreditCard className="text-supernova" size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-anton text-white-knight mb-2 uppercase tracking-wide">
                      Need More Candidate Credits?
                    </h3>
                    <p className="text-guardian font-jakarta">
                      Upgrade to unlock unlimited job submissions and candidate credits with our premium plans
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={handleGetMoreCredits}
                  size="lg"
                  className="glow-supernova flex items-center gap-3 whitespace-nowrap"
                  disabled={isCreatingCheckout}
                  isLoading={isCreatingCheckout}
                >
                  <Crown size={20} />
                  {isCreatingCheckout ? 'OPENING CHECKOUT...' : 'GET MORE CANDIDATE CREDITS'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Search and Job List */}
        <Card className="mb-12">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <h2 className="text-2xl font-anton text-white-knight uppercase tracking-wide">Select Job to View Candidates</h2>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-guardian" />
                </div>
                <input
                  type="text"
                  placeholder="Search jobs or companies"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 block w-full rounded-lg border-guardian/30 bg-shadowforce text-white-knight placeholder-guardian/60 focus:ring-supernova focus:border-supernova font-jakarta"
                />
              </div>
            </div>
            
            {sortedJobs.length === 0 ? (
              <div className="text-center py-16">
                <div className="mb-6">
                  <Briefcase size={64} className="text-guardian/40 mx-auto" />
                </div>
                <h3 className="font-anton text-2xl text-guardian mb-2">NO JOBS FOUND</h3>
                <p className="text-guardian/80 font-jakarta">No jobs match your current search criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {sortedJobs.map(job => {
                  const jobCandidates = getCandidatesByJob(job.id);
                  
                  return (
                    <Card 
                      key={job.id} 
                      className="hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
                      onClick={() => setSelectedJobId(job.id)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-anton text-white-knight mb-2 uppercase tracking-wide line-clamp-2">
                              {job.title}
                            </h3>
                            <Badge 
                              variant={
                                job.status === 'Unclaimed' 
                                  ? 'warning' 
                                  : job.status === 'In Progress'
                                    ? 'info'
                                    : job.status === 'Completed' 
                                    ? 'success' 
                                    : 'default'
                              }
                              className="mb-3"
                            >
                              {job.status === 'Unclaimed' ? 'AWAITING SOURCER' : 
                               job.status === 'In Progress' ? 'IN PROGRESS' :
                               job.status}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="mb-4 p-3 bg-supernova/10 border border-supernova/30 rounded-lg">
                          <p className="text-sm font-jakarta font-semibold text-supernova">Company</p>
                          <p className="text-white-knight font-jakarta font-bold">{job.companyName}</p>
                        </div>
                        
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center text-sm text-guardian">
                            <Users size={14} className="mr-3 text-supernova" />
                            <span className="font-jakarta font-bold text-supernova">
                              {jobCandidates.length} Candidate{jobCandidates.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          
                          <div className="flex items-center text-sm text-guardian">
                            <Calendar size={14} className="mr-3 text-supernova" />
                            <span className="font-jakarta">Posted {formatDate(job.createdAt)}</span>
                          </div>
                          
                          {job.sourcerName && (
                            <div className="flex items-center text-sm text-guardian">
                              <User size={14} className="mr-3 text-supernova" />
                              <span className="font-jakarta">Sourcer: {job.sourcerName}</span>
                            </div>
                          )}
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          fullWidth
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedJobId(job.id);
                          }}
                          className="flex items-center justify-center gap-2"
                        >
                          SEE CANDIDATES
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};