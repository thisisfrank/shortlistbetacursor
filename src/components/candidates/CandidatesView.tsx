import React, { useState } from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { AlertModal } from '../ui/AlertModal';
import { ShortlistModal } from '../ui/ShortlistModal';
import { generateJobMatchScore } from '../../services/anthropicService';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Search, Users, ExternalLink, Calendar, Briefcase, Zap, User, ChevronDown, ChevronRight, Target, CreditCard, Crown, MapPin, Download, List, Edit2, Trash2, Save, X, MessageSquare, CheckCircle } from 'lucide-react';

// Helper function to calculate total years of experience
const calculateYearsOfExperience = (experience?: Array<{ title: string; company: string; duration: string }>): number => {
  if (!experience || experience.length === 0) return 0;
  
  let totalMonths = 0;
  
  for (const exp of experience) {
    const duration = exp.duration?.toLowerCase() || '';
    
    // Handle different duration formats
    if (duration.includes('yr') || duration.includes('year')) {
      const yearMatch = duration.match(/(\d+)\s*(yr|year)/);
      if (yearMatch) {
        totalMonths += parseInt(yearMatch[1]) * 12;
      }
    }
    
    if (duration.includes('mo') || duration.includes('month')) {
      const monthMatch = duration.match(/(\d+)\s*(mo|month)/);
      if (monthMatch) {
        totalMonths += parseInt(monthMatch[1]);
      }
    }
    
    // Handle date ranges like "Jan 2020 - Dec 2022"
    if (duration.includes('-') && !duration.includes('yr') && !duration.includes('mo')) {
      const dateRangeMatch = duration.match(/(\w{3})\s*(\d{4})\s*-\s*(\w{3})\s*(\d{4})/);
      if (dateRangeMatch) {
        const startYear = parseInt(dateRangeMatch[2]);
        const endYear = parseInt(dateRangeMatch[4]);
        const months = Math.max(1, (endYear - startYear) * 12);
        totalMonths += months;
      }
    }
    
    // Handle single years like "2020 - 2022"
    if (duration.includes('-')) {
      const yearRangeMatch = duration.match(/(\d{4})\s*-\s*(\d{4})/);
      if (yearRangeMatch) {
        const startYear = parseInt(yearRangeMatch[1]);
        const endYear = parseInt(yearRangeMatch[2]);
        const months = Math.max(1, (endYear - startYear) * 12);
        totalMonths += months;
      }
    }
    
    // If no specific format matches, assume 1 year minimum per role
    if (totalMonths === 0 && duration && duration !== 'n/a' && duration !== 'N/A') {
      totalMonths += 12;
    }
  }
  
  return Math.round(totalMonths / 12 * 10) / 10; // Round to 1 decimal place
};

export const CandidatesView: React.FC = () => {
  const { 
    jobs, 
    candidates, 
    getCandidatesByJob, 
    getJobById, 
    getShortlistsByUser, 
    getCandidatesByShortlist,
    updateShortlist,
    deleteShortlist
  } = useData();
  const { user } = useAuth();
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
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());
  const [matchScores, setMatchScores] = useState<Record<string, { score: number; reasoning: string; loading: boolean }>>({});
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'warning' | 'error' | 'upgrade';
    actionLabel?: string;
    onAction?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: ''
  });
  const matchScoresRef = useRef(matchScores);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [isShortlistModalOpen, setIsShortlistModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'all' | 'shortlist'>('all');
  const [selectedShortlistId, setSelectedShortlistId] = useState<string>('');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [editingShortlistId, setEditingShortlistId] = useState<string | null>(null);
  const [editShortlistName, setEditShortlistName] = useState('');
  const [editShortlistDescription, setEditShortlistDescription] = useState('');
  const [isShortlistLoading, setIsShortlistLoading] = useState(false);
  
  // Define currentJobCandidates at component level with shortlist filtering
  const allJobCandidates = selectedJobId ? getCandidatesByJob(selectedJobId) : [];
  const currentJobCandidates = currentView === 'shortlist' && selectedShortlistId
    ? getCandidatesByShortlist(selectedShortlistId).filter(candidate => 
        allJobCandidates.some(jobCandidate => jobCandidate.id === candidate.id)
      )
    : allJobCandidates;
  
  // Get user's shortlists
  const userShortlists = user?.id ? getShortlistsByUser(user.id) : [];
  
  // Sort candidates by match score (highest first), with unscored candidates at the bottom
  const sortedCurrentJobCandidates = [...currentJobCandidates].sort((a, b) => {
    const scoreA = matchScores[a.id]?.score || 0;
    const scoreB = matchScores[b.id]?.score || 0;
    
    // If both have scores, sort by score (highest first)
    if (scoreA > 0 && scoreB > 0) {
      return scoreB - scoreA;
    }
    
    // If only one has a score, prioritize the one with score
    if (scoreA > 0 && scoreB === 0) return -1;
    if (scoreB > 0 && scoreA === 0) return 1;
    
    // If neither has a score, maintain original order
    return 0;
  });
  
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

  const toggleJobExpansion = (jobId: string) => {
    const newExpanded = new Set(expandedJobs);
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId);
    } else {
      newExpanded.add(jobId);
    }
    setExpandedJobs(newExpanded);
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
                  keySkills: job.mustHaveSkills, // Using must-have skills as key skills
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
      setAlertModal({
        isOpen: true,
        title: 'Navigation Error',
        message: error instanceof Error ? error.message : 'Failed to navigate to subscription page',
        type: 'error'
      });
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
    const allCandidateIds = new Set(sortedCurrentJobCandidates.map(c => c.id));
    setSelectedCandidates(allCandidateIds);
  };

  const clearSelection = () => {
    setSelectedCandidates(new Set());
  };

  const exportSelectedCandidates = async () => {
    if (selectedCandidates.size === 0) {
      setAlertModal({
        isOpen: true,
        title: 'No Candidates Selected',
        message: 'Please select at least one candidate to export',
        type: 'warning'
      });
      return;
    }

    setIsExporting(true);

    try {
      const selectedJob = selectedJobId ? getJobById(selectedJobId) : null;
      const selectedCandidateData = sortedCurrentJobCandidates.filter(candidate => 
        selectedCandidates.has(candidate.id)
      );

      // Prepare CSV data
      const csvHeaders = [
        'Name',
        'LinkedIn URL',
        'Current Role',
        'Location',
        'Years of Experience',
        'Match Score',
        'AI Summary',
        'Experience',
        'Education',
        'Skills'
      ];

      const csvRows = selectedCandidateData.map(candidate => {
        const matchScore = matchScores[candidate.id]?.score || 'N/A';
        const yearsOfExperience = calculateYearsOfExperience(candidate.experience);
        
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
          `"${yearsOfExperience} years"`,
          `"${matchScore}${typeof matchScore === 'number' ? '%' : ''}"`,
          `"${(candidate.summary || 'N/A').replace(/"/g, '""')}"`,
          `"${experienceText.replace(/"/g, '""')}"`,
          `"${educationText.replace(/"/g, '""')}"`,
          `"${skillsText.replace(/"/g, '""')}""`
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
      setAlertModal({
        isOpen: true,
        title: 'Export Error',
        message: 'Error exporting candidates. Please try again.',
        type: 'error'
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Shortlist management functions
  const handleEditShortlist = (shortlist: any) => {
    setEditingShortlistId(shortlist.id);
    setEditShortlistName(shortlist.name);
    setEditShortlistDescription(shortlist.description || '');
  };

  const handleSaveShortlistEdit = async () => {
    if (!editingShortlistId || !editShortlistName.trim()) return;
    
    setIsShortlistLoading(true);
    try {
      await updateShortlist(editingShortlistId, {
        name: editShortlistName.trim(),
        description: editShortlistDescription.trim() || undefined
      });
      setEditingShortlistId(null);
      setEditShortlistName('');
      setEditShortlistDescription('');
    } catch (error) {
      console.error('Error updating shortlist:', error);
      setAlertModal({
        isOpen: true,
        title: 'Update Error',
        message: 'Failed to update shortlist. Please try again.',
        type: 'error'
      });
    } finally {
      setIsShortlistLoading(false);
    }
  };

  const handleCancelShortlistEdit = () => {
    setEditingShortlistId(null);
    setEditShortlistName('');
    setEditShortlistDescription('');
  };

  const handleDeleteShortlist = async (shortlistId: string, shortlistName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${shortlistName}"? This action cannot be undone.`)) {
      return;
    }
    
    setIsShortlistLoading(true);
    try {
      await deleteShortlist(shortlistId);
      
      // If we're viewing the deleted shortlist, switch back to all candidates
      if (selectedShortlistId === shortlistId) {
        setCurrentView('all');
        setSelectedShortlistId('');
      }
      
      setAlertModal({
        isOpen: true,
        title: 'Shortlist Deleted',
        message: `"${shortlistName}" has been successfully deleted.`,
        type: 'warning'
      });
    } catch (error) {
      console.error('Error deleting shortlist:', error);
      setAlertModal({
        isOpen: true,
        title: 'Delete Error',
        message: 'Failed to delete shortlist. Please try again.',
        type: 'error'
      });
    } finally {
      setIsShortlistLoading(false);
    }
  };

  // If a job is selected, show candidates for that job
  if (selectedJobId) {
    const selectedJob = getJobById(selectedJobId);
    const companyName = selectedJob?.companyName || 'Unknown Company';
    
    // Only show candidates if job is completed
    if (selectedJob?.status !== 'Completed') {
      setSelectedJobId(null);
      return null;
    }
    
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
              onClick={() => {
                setSelectedJobId(null);
                setIsShortlistModalOpen(false); // Close modal when navigating back
                setSelectedCandidates(new Set()); // Clear selections when navigating back
              }}
              className="flex items-center gap-2"
            >
              ← BACK TO JOBS
            </Button>
          </div>

          {/* Shortlist Filtering Controls */}
          {userShortlists.length > 0 && (
            <div className="mb-8">
              <Card className="bg-gradient-to-r from-supernova/20 to-supernova/10 border-supernova/30">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <List className="text-supernova" size={20} />
                      <span className="text-white-knight font-jakarta font-semibold">
                        Views:
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant={currentView === 'all' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setCurrentView('all');
                          setSelectedShortlistId('');
                        }}
                      >
                        All Candidates ({allJobCandidates.length})
                      </Button>
                      
                      {userShortlists.map((shortlist) => {
                        const shortlistCandidateCount = getCandidatesByShortlist(shortlist.id)
                          .filter(candidate => 
                            allJobCandidates.some(jobCandidate => jobCandidate.id === candidate.id)
                          ).length;
                        const isActive = currentView === 'shortlist' && selectedShortlistId === shortlist.id;
                        
                        return (
                          <Button
                            key={shortlist.id}
                            variant={isActive ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => {
                              setCurrentView('shortlist');
                              setSelectedShortlistId(shortlist.id);
                            }}
                            disabled={shortlistCandidateCount === 0}
                          >
                            {shortlist.name} ({shortlistCandidateCount})
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
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
                        onClick={() => setIsShortlistModalOpen(true)}
                        disabled={selectedCandidates.size === 0}
                        className="flex items-center gap-2"
                      >
                        <List size={16} />
                        ADD TO SHORTLIST
                      </Button>
                      <Button
                        variant="outline"
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
                  <h3 className="font-anton text-2xl text-guardian mb-2">
                    {currentView === 'shortlist' ? 'NO CANDIDATES IN THIS SHORTLIST' : 'NO CANDIDATES YET'}
                  </h3>
                  <p className="text-guardian/80 font-jakarta">
                    {currentView === 'shortlist' 
                      ? `No candidates from this job are in the selected shortlist yet. Add candidates to "${userShortlists.find(sl => sl.id === selectedShortlistId)?.name || 'this shortlist'}" to see them here.`
                      : 'No candidates have been submitted for this job yet. Once a sourcer completes this job, candidates will appear here.'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-anton text-white-knight uppercase tracking-wide">
                    {currentView === 'shortlist' && selectedShortlistId
                      ? userShortlists.find(sl => sl.id === selectedShortlistId)?.name || 'Shortlist'
                      : 'All Candidates'
                    }
                  </h3>
                  
                  {/* Edit/Delete buttons for shortlist view */}
                  {currentView === 'shortlist' && selectedShortlistId && (
                    <div className="flex items-center gap-3">
                      {editingShortlistId === selectedShortlistId ? (
                        <div className="flex items-center gap-2 bg-shadowforce/50 border border-guardian/30 rounded-lg p-2">
                          <input
                            type="text"
                            value={editShortlistName}
                            onChange={(e) => setEditShortlistName(e.target.value)}
                            className="px-2 py-1 bg-shadowforce text-white-knight border border-guardian/30 rounded text-sm font-jakarta"
                            placeholder="Shortlist name"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSaveShortlistEdit}
                            disabled={!editShortlistName.trim() || isShortlistLoading}
                            className="p-1"
                          >
                            <Save size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelShortlistEdit}
                            className="p-1"
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="text-guardian font-jakarta text-sm">
                            {currentJobCandidates.length} candidate{currentJobCandidates.length !== 1 ? 's' : ''}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const shortlist = userShortlists.find(sl => sl.id === selectedShortlistId);
                              if (shortlist) handleEditShortlist(shortlist);
                            }}
                            className="p-2"
                            title="Edit shortlist"
                          >
                            <Edit2 size={16} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const shortlist = userShortlists.find(sl => sl.id === selectedShortlistId);
                              if (shortlist) handleDeleteShortlist(shortlist.id, shortlist.name);
                            }}
                            className="p-2 text-red-400 hover:text-red-300"
                            title="Delete shortlist"
                            disabled={isShortlistLoading}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                  
                  {/* Show candidate count for all candidates view */}
                  {currentView === 'all' && (
                    <span className="text-guardian font-jakarta text-sm">
                      {currentJobCandidates.length} candidate{currentJobCandidates.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                
                <div className="space-y-6">
                  {sortedCurrentJobCandidates.map(candidate => (
                    <Card key={candidate.id} className="hover:shadow-2xl transition-all duration-300 border-l-4 border-l-supernova">
                      <CardContent className="p-8">
                        {/* Main candidate info row - always visible */}
                        <div className="grid grid-cols-7 gap-6 items-center mb-6">
                          {/* AI Match Score */}
                          <div className="col-span-1 flex items-center justify-center h-full">
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
                          {/* Name and basic info */}
                          <div className="col-span-2 flex items-center h-full">
                            <h4 className="text-3xl font-anton text-white-knight mb-0 uppercase tracking-wide">
                              {candidate.firstName === 'N/A' && candidate.lastName === 'N/A' 
                                ? 'N/A' 
                                : `${candidate.firstName} ${candidate.lastName}`}
                            </h4>
                          </div>
                          {/* Spacer to push controls to the right */}
                          <div className="col-span-3"></div>
                          {/* Actions and Selection Checkbox - right edge */}
                          <div className="col-span-1 flex justify-end items-center gap-4 w-full h-full">
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
                            <input
                              type="checkbox"
                              checked={selectedCandidates.has(candidate.id)}
                              onChange={() => toggleCandidateSelection(candidate.id)}
                              className="w-5 h-5 text-supernova bg-gray-700 border-gray-600 rounded focus:ring-0 focus:outline-none"
                            />
                          </div>
                        </div>
                        
                        {/* Match Score Reasoning */}
                        {matchScores[candidate.id] && !matchScores[candidate.id].loading && (
                          <div className="mb-6 p-4 bg-supernova/10 border border-supernova/30 rounded-lg">
                            <div className="flex items-center mb-1">
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
                                  <Briefcase size={16} className="text-supernova mr-2" />
                                  <span className="text-sm font-jakarta font-semibold text-supernova uppercase tracking-wide">Experience</span>
                                </div>
                                <p className="text-white-knight font-jakarta font-medium">
                                  {calculateYearsOfExperience(candidate.experience)} years
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
                                      <div className="text-white-knight font-jakarta text-sm leading-relaxed whitespace-pre-line">
                                        {candidate.summary}
                                      </div>
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
                                          {skill}
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
                                
                                {/* Action Buttons - Moved here after Key Skills */}
                                <div className="mt-6 pt-6 border-t border-guardian/20">
                                  <div className="flex flex-col gap-3">
                                    <Button 
                                      variant="primary" 
                                      size="lg" 
                                      className="w-full flex items-center justify-center gap-2 glow-supernova"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(candidate.linkedinUrl, '_blank');
                                      }}
                                    >
                                      <ExternalLink size={16} />
                                      VIEW LINKEDIN PROFILE
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="lg" 
                                      className="w-full flex items-center justify-center gap-2"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const candidateData = encodeURIComponent(JSON.stringify({
                                          id: candidate.id,
                                          firstName: candidate.firstName,
                                          lastName: candidate.lastName,
                                          headline: candidate.headline,
                                          location: candidate.location,
                                          skills: candidate.skills,
                                          experience: candidate.experience,
                                          linkedinUrl: candidate.linkedinUrl,
                                          jobId: candidate.jobId
                                        }));
                                        navigate(`/ai-message-generator?candidate=${candidateData}`);
                                      }}
                                    >
                                      <MessageSquare size={16} />
                                      GENERATE MESSAGE
                                    </Button>
                                  </div>
                                </div>
                              </div>
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
          
          {/* ShortlistModal - only show when in candidates view */}
          <ShortlistModal
            isOpen={isShortlistModalOpen}
            onClose={() => setIsShortlistModalOpen(false)}
            selectedCandidateIds={Array.from(selectedCandidates)}
            onCandidatesAddedToShortlist={() => {
              setSelectedCandidates(new Set());
              setIsShortlistModalOpen(false);
            }}
          />
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
            MY OPEN JOBS
          </h1>
          <p className="text-xl text-guardian text-center font-jakarta max-w-2xl mx-auto">
            Select a job to view your verified candidates
          </p>
        </header>
        

        
        {/* Search and Job List */}
        <Card className="mb-12">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <h2 className="text-2xl font-anton text-white-knight uppercase tracking-wide">
                Select Job to View Candidates
                {jobs && jobs.length > 0 && (
                  <span className="block text-base font-jakarta text-supernova mt-2 md:mt-0 md:ml-4 normal-case font-normal">
                    
                  </span>
                )}
              </h2>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-guardian" />
                </div>
                <input
                  type="text"
                  placeholder=""
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
              <div className="grid grid-cols-1 gap-6">
                {sortedJobs.map(job => {
                  const isCompleted = job.status === 'Completed';
                  const clientStatus = isCompleted ? 'COMPLETED' : 'IN PROGRESS';
                  const isExpanded = expandedJobs.has(job.id);
                  
                  return (
                    <Card 
                      key={job.id} 
                      className={`hover:shadow-2xl transition-all duration-300 transform hover:scale-105 ${isCompleted ? 'cursor-pointer' : 'cursor-default opacity-75'}`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-anton text-white-knight mb-2 uppercase tracking-wide line-clamp-2">
                              {job.title}
                            </h3>
                            <Badge 
                              variant={isCompleted ? 'success' : 'warning'}
                              className="mb-3"
                            >
                              {clientStatus}
                            </Badge>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleJobExpansion(job.id);
                            }}
                            className="flex items-center gap-2"
                          >
                            {isExpanded ? (
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
                        
                        <div className="mb-4 p-3 bg-supernova/10 border border-supernova/30 rounded-lg">
                          <p className="text-sm font-jakarta font-semibold text-supernova">Company</p>
                          <p className="text-white-knight font-jakarta font-bold">{job.companyName}</p>
                        </div>
                        
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center text-sm text-guardian">
                            <Calendar size={14} className="mr-3 text-supernova" />
                            <span className="font-jakarta">Posted {formatDate(job.createdAt)}</span>
                          </div>
                          <div className="flex items-center text-sm font-jakarta text-supernova">
                            <Users size={16} className="mr-2" />
                            <span>Requested Candidates: {job.candidatesRequested}</span>
                          </div>
                        </div>
                        
                        {/* Expanded Job Details */}
                        {isExpanded && (
                          <div className="border-t border-guardian/20 pt-6 space-y-6 mb-6">
                            {/* Job Description - Full Width */}
                            <div>
                              <div className="flex items-center mb-3">
                                <Briefcase size={16} className="text-supernova mr-2" />
                                <span className="text-sm font-jakarta font-semibold text-supernova uppercase tracking-wide">Job Description</span>
                              </div>
                              <div className="bg-gradient-to-br from-supernova/10 to-supernova/5 border border-supernova/20 p-4 rounded-lg">
                                <p className="text-white-knight font-jakarta text-sm leading-relaxed">
                                  {job.description || 'No description provided'}
                                </p>
                              </div>
                            </div>
                            
                            {/* 3-Column Section: Seniority, Skills, Location */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* Seniority Level */}
                              <div>
                                <div className="flex items-center mb-3">
                                  <Target size={16} className="text-green-400 mr-2" />
                                  <span className="text-sm font-jakarta font-semibold text-green-400 uppercase tracking-wide">Seniority Level</span>
                                </div>
                                <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 p-4 rounded-lg">
                                  <p className="text-white-knight font-jakarta font-semibold">
                                    {job.seniorityLevel === 'Junior' ? 'Junior (1-3 years)' :
                                     job.seniorityLevel === 'Mid' ? 'Mid (4-6 years)' :
                                     job.seniorityLevel === 'Senior' ? 'Senior (7-10 years)' :
                                     job.seniorityLevel === 'Super Senior' ? 'Super Senior (10+ years)' :
                                     job.seniorityLevel || 'Not specified'}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Must-Have Skills */}
                              <div>
                                <div className="flex items-center mb-3">
                                  <Zap size={16} className="text-orange-400 mr-2" />
                                  <span className="text-sm font-jakarta font-semibold text-orange-400 uppercase tracking-wide">Must-Have Skills</span>
                                </div>
                                <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 p-4 rounded-lg min-h-[60px] flex items-center">
                                  {job.mustHaveSkills && job.mustHaveSkills.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {job.mustHaveSkills.map((skill, index) => (
                                        <span 
                                          key={index}
                                          className="px-2 py-1 bg-gradient-to-r from-orange-500/30 to-orange-500/20 border border-orange-500/40 text-orange-300 text-xs rounded-full font-jakarta font-medium"
                                        >
                                          {skill}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-white-knight font-jakarta font-semibold">Not specified</p>
                                  )}
                                </div>
                              </div>
                              
                              {/* Location */}
                              <div>
                                <div className="flex items-center mb-3">
                                  <MapPin size={16} className="text-purple-400 mr-2" />
                                  <span className="text-sm font-jakarta font-semibold text-purple-400 uppercase tracking-wide">Location</span>
                                </div>
                                <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 p-4 rounded-lg">
                                  <p className="text-white-knight font-jakarta font-semibold">
                                    {job.location || 'Not specified'}
                                  </p>
                                  {job.workArrangement && (
                                    <p className="text-purple-300 font-jakarta text-sm mt-1">
                                      {job.workArrangement}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          fullWidth
                          disabled={!isCompleted}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isCompleted) {
                              setSelectedJobId(job.id);
                            }
                          }}
                          className="flex items-center justify-center gap-2"
                        >
                          {isCompleted ? 'SEE CANDIDATES' : 'PENDING COMPLETION'}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Candidate Accelerator Program */}
        <div className="mt-12">
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-yellow-500/20 to-yellow-500/10 border-yellow-500/30">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="relative">
                    <Crown size={48} className="text-yellow-400 fill-current" />
                    <div className="absolute inset-0 bg-yellow-400/30 blur-xl rounded-full"></div>
                  </div>
                </div>
                <h3 className="text-3xl font-anton text-white-knight mb-4 uppercase tracking-wide">
                CANDIDATE ACCELERATOR PROGRAM
                </h3>
                <p className="text-xl text-yellow-300 font-jakarta mb-6">
                  We build and manage your outbound candidate pipeline so you're not stuck relying on referrals or job boards to make great hires.
                </p>
              </div>

              <div className="text-center mb-8">
                <h4 className="text-xl font-anton text-white-knight uppercase tracking-wide mb-6">
                  What's Included:
                </h4>
                <div className="space-y-4 max-w-2xl mx-auto">
                  <div className="flex items-center justify-center">
                    <CheckCircle className="text-yellow-400 mr-4 flex-shrink-0" size={20} />
                    <span className="text-guardian font-jakarta text-left">
                      Your personal Super Recruiter
                    </span>
                  </div>
                  <div className="flex items-center justify-center">
                    <CheckCircle className="text-yellow-400 mr-4 flex-shrink-0" size={20} />
                    <span className="text-guardian font-jakarta text-left">
                      High-quality candidate sourcing for every role
                    </span>
                  </div>
                  <div className="flex items-center justify-center">
                    <CheckCircle className="text-yellow-400 mr-4 flex-shrink-0" size={20} />
                    <span className="text-guardian font-jakarta text-left">
                      Create and manage your outbound candidate pipelines
                    </span>
                  </div>
                  <div className="flex items-center justify-center">
                    <CheckCircle className="text-yellow-400 mr-4 flex-shrink-0" size={20} />
                    <span className="text-guardian font-jakarta text-left">
                      Weekly reports with actionable recruiting insights
                    </span>
                  </div>
                  <div className="flex items-center justify-center">
                    <CheckCircle className="text-yellow-400 mr-4 flex-shrink-0" size={20} />
                    <span className="text-guardian font-jakarta text-left">
                      A/B message testing to maximize candidate conversions
                    </span>
                  </div>
                  <div className="flex items-center justify-center">
                    <CheckCircle className="text-yellow-400 mr-4 flex-shrink-0" size={20} />
                    <span className="text-guardian font-jakarta text-left">
                      Custom candidate pitch deck to sell your company
                    </span>
                  </div>
                  <div className="flex items-center justify-center">
                    <CheckCircle className="text-yellow-400 mr-4 flex-shrink-0" size={20} />
                    <span className="text-guardian font-jakarta text-left">
                      100% ownership of all candidate data
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-center mb-8">
                <div className="text-4xl font-anton text-yellow-300 mb-6">
                  STARTING AT $999<span className="text-lg">/month</span>
                </div>
                
                <Button 
                  onClick={() => window.open('https://calendly.com/superrecruiter/outboundcandidatepipelines', '_blank')}
                  variant="primary"
                  size="lg"
                  className="bg-black hover:bg-gray-800 text-white font-anton uppercase tracking-wide px-8 py-4"
                >
                  BOOK DISCOVERY CALL
                </Button>
                <p className="text-guardian font-jakarta text-sm mt-2">
                Lower your cost per hire by over 30% in 90 days or pay nothing
                </p>
              </div>

              <div className="text-center border-t border-yellow-500/20 pt-6">
                <p className="text-guardian font-jakarta">
                  <strong className="text-white-knight">Perfect for:</strong> Hiring managers, recruiters, and founders who want high-quality candidates delivered straight to their calendars - without lifting a finger.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Screenshots Section */}
        <div className="mt-12">
          {/* Headlines */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-anton text-white-knight mb-4 uppercase tracking-wide">
              You're in Good Hands
            </h2>
            <p className="text-xl text-guardian font-jakarta max-w-2xl mx-auto">
          
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-shadowforce border border-guardian/30 rounded-lg overflow-hidden hover:border-supernova/50 transition-all duration-300 cursor-pointer">
              <img 
                src="/screenshots/screenshot1.png"
                alt="Client testimonial screenshot 1" 
                className="w-full h-auto object-cover"
                onClick={() => setZoomedImage("/screenshots/screenshot1.png")}
              />
            </div>
            <div className="bg-shadowforce border border-guardian/30 rounded-lg overflow-hidden hover:border-supernova/50 transition-all duration-300 cursor-pointer">
              <img 
                src="/screenshots/screenshot2.png"
                alt="Client testimonial screenshot 2" 
                className="w-full h-auto object-cover"
                onClick={() => setZoomedImage("/screenshots/screenshot2.png")}
              />
            </div>
            <div className="bg-shadowforce border border-guardian/30 rounded-lg overflow-hidden hover:border-supernova/50 transition-all duration-300 cursor-pointer">
              <img 
                src="/screenshots/screenshot3.png"
                alt="Client testimonial screenshot 3" 
                className="w-full h-auto object-cover"
                onClick={() => setZoomedImage("/screenshots/screenshot3.png")}
              />
            </div>
            <div className="bg-shadowforce border border-guardian/30 rounded-lg overflow-hidden hover:border-supernova/50 transition-all duration-300 cursor-pointer">
              <img 
                src="/screenshots/screenshot4.png"
                alt="Client testimonial screenshot 4" 
                className="w-full h-auto object-cover"
                onClick={() => setZoomedImage("/screenshots/screenshot4.png")}
              />
            </div>
          </div>
        </div>
        

        
        {/* Upgrade CTA */}
        <div className="mt-12">
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
      </div>

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        actionLabel={alertModal.actionLabel}
        onAction={alertModal.onAction}
      />

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-5xl max-h-full">
            <img 
              src={zoomedImage} 
              alt="Zoomed client testimonial" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 bg-shadowforce/80 hover:bg-shadowforce text-white-knight rounded-full p-2 hover:text-supernova transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};