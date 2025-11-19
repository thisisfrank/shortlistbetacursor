import React, { useState, useEffect, useCallback } from 'react';
import { Job, Candidate } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { X, AlertCircle, Plus, Trash2, ExternalLink, Loader, Zap, HelpCircle, Check, CheckCircle } from 'lucide-react';
import {
  loadDraft,
  saveDraft,
  clearDraft,
  addToDraft,
  removeCandidateFromDraft,
  DraftCandidate,
  CandidateDraft
} from '../../utils/candidateDraftStorage';

interface AddCandidatesModalProps {
  job: Job;
  onClose: () => void;
  onComplete?: (jobId: string) => void;
}

type ProcessingStage = 'input' | 'processing' | 'review';

export const AddCandidatesModal: React.FC<AddCandidatesModalProps> = ({
  job,
  onClose,
  onComplete
}) => {
  const { processCandidatesForReview, saveFinalizedCandidates, getCandidatesByJob, deleteCandidate } = useData();
  const { userProfile } = useAuth();
  
  // UI State
  const [stage, setStage] = useState<ProcessingStage>('input');
  const [linkedinUrls, setLinkedinUrls] = useState(['']);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [submissionMethod, setSubmissionMethod] = useState<'urls' | 'csv'>('csv');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvError, setCsvError] = useState('');
  const [deletingCandidateId, setDeletingCandidateId] = useState<string | null>(null);
  
  // Draft State
  const [draft, setDraft] = useState<CandidateDraft | null>(null);
  
  // Saved candidates from database
  const [savedCandidates, setSavedCandidates] = useState<Candidate[]>([]);
  
  const MAX_CANDIDATES_PER_SUBMISSION = 200;
  
  // Load draft and saved candidates on mount
  useEffect(() => {
    const existingDraft = loadDraft(job.id);
    if (existingDraft) {
      setDraft(existingDraft);
      setStage('review'); // Go straight to review if draft exists
      console.log(`📂 Loaded existing draft: ${existingDraft.processedCandidates.length} candidates`);
    }
    
    const saved = getCandidatesByJob(job.id);
    setSavedCandidates(saved);
  }, [job.id, getCandidatesByJob]);
  
  // Auto-save draft whenever it changes
  useEffect(() => {
    if (draft && draft.processedCandidates.length > 0) {
      saveDraft(draft);
    }
  }, [draft]);
  
  // Parse CSV file
  const parseCsvFile = (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').map(line => line.trim()).filter(line => line);
          
          // Skip header row if it exists
          const startIndex = lines[0]?.toLowerCase().includes('linkedin') || lines[0]?.toLowerCase().includes('url') ? 1 : 0;
          
          const urls: string[] = [];
          
          for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i];
            const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));
            const linkedinUrl = columns.find(col => col.includes('linkedin.com')) || columns[0];
            
            if (linkedinUrl && linkedinUrl.includes('linkedin.com')) {
              urls.push(linkedinUrl);
            }
          }
          
          if (urls.length === 0) {
            reject(new Error('No valid LinkedIn URLs found in CSV file'));
            return;
          }
          
          if (urls.length > MAX_CANDIDATES_PER_SUBMISSION) {
            reject(new Error(`CSV contains ${urls.length} URLs, but maximum is ${MAX_CANDIDATES_PER_SUBMISSION} per submission`));
            return;
          }
          
          resolve(urls);
        } catch (error) {
          reject(new Error('Error parsing CSV file. Please check the format.'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsText(file);
    });
  };

  // Process candidates (scrape + score, don't save to DB yet)
  const handleProcessCandidates = async () => {
    if (!userProfile) {
      setError('User information is still loading. Please wait and try again.');
      return;
    }
    
    let validUrls: string[] = [];
    setSuccessMessage('');
    setError('');
    
    if (submissionMethod === 'csv') {
      if (!csvFile) {
        setError('Please upload a CSV file');
        return;
      }
      
      try {
        validUrls = await parseCsvFile(csvFile);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Error processing CSV file');
        return;
      }
    } else {
      validUrls = linkedinUrls.filter(url => url.trim());
    }
    
    if (validUrls.length === 0) {
      setError('Please add at least one LinkedIn URL');
      return;
    }
    
    if (validUrls.length > MAX_CANDIDATES_PER_SUBMISSION) {
      setError(`Cannot submit more than ${MAX_CANDIDATES_PER_SUBMISSION} candidates per job submission`);
      return;
    }
    
    const invalidUrls = validUrls.filter(url => !url.includes('linkedin.com'));
    if (invalidUrls.length > 0) {
      setError('Please ensure all LinkedIn URLs are valid');
      return;
    }
    
    setIsProcessing(true);
    setStage('processing');
    
    try {
      // Process candidates (scrape + score, but don't save to DB)
      const result = await processCandidatesForReview(job.id, validUrls);
      
      if (!result.success) {
        setError(result.error || 'Failed to process LinkedIn profiles');
        setIsProcessing(false);
        setStage('input');
        return;
      }
      
      console.log(`Candidates processed for review: Accepted: ${result.processedCandidates.length}, Rejected: ${result.rejectedCandidates.length}`);
      
      // Convert to draft format with temp IDs
      const draftCandidates: DraftCandidate[] = result.processedCandidates.map(pc => ({
        ...pc,
        tempId: `temp-${Date.now()}-${Math.random()}`
      }));
      
      // Add to draft (merges with existing if present)
      const success = addToDraft(
        job.id,
        draftCandidates,
        result.rejectedCandidates,
        result.failedScrapes
      );
      
      if (!success) {
        console.warn('⚠️ Failed to save draft to localStorage (might be full)');
        setError('Warning: Draft could not be saved. Please complete submission now or your work may be lost.');
      }
      
      // Reload draft from localStorage
      const updatedDraft = loadDraft(job.id);
      setDraft(updatedDraft);
      
      // Show success message
      let message = `✅ ${result.processedCandidates.length} candidate${result.processedCandidates.length === 1 ? '' : 's'} processed and ready for review!`;
      
      if (result.rejectedCandidates.length > 0) {
        message += ` (${result.rejectedCandidates.length} rejected due to low match scores)`;
      }
      
      if (result.failedScrapes > 0) {
        message += `\n\n⚠️ ${result.failedScrapes} profile${result.failedScrapes === 1 ? '' : 's'} could not be scraped (private/blocked).`;
      }
      
      setSuccessMessage(message);
      setError('');
      setLinkedinUrls(['']);
      setCsvFile(null);
      setIsProcessing(false);
      setStage('review');
    } catch (error) {
      console.error('Error processing candidates:', error);
      setError('Failed to process LinkedIn profiles. Please try again.');
      setIsProcessing(false);
      setStage('input');
    }
  };

  // Complete job (save to DB and mark complete)
  const handleCompleteJob = async () => {
    if (!draft || draft.processedCandidates.length === 0) {
      setError('No candidates to submit. Please process candidates first.');
      return;
    }
    
    // Check if we have enough accepted candidates
    const totalAccepted = savedCandidates.length + draft.processedCandidates.length;
    if (totalAccepted < job.candidatesRequested) {
      setError(`Not enough candidates to complete this job.`);
      return;
    }
    
    setIsCompleting(true);
    setError('');
    
    try {
      // Convert draft candidates to the format expected by saveFinalizedCandidates
      const candidatesToSave = draft.processedCandidates.map(dc => dc.candidate);
      
      // Save candidates to database
      const saveResult = await saveFinalizedCandidates(job.id, candidatesToSave);
      
      if (!saveResult.success) {
        setError(saveResult.error || 'Failed to save candidates. Please try again.');
        setIsCompleting(false);
        return;
      }
      
      console.log(`✅ Successfully saved ${saveResult.savedCount} candidates to database`);
      
      // Clear the draft from localStorage
      clearDraft(job.id);
      setDraft(null);
      
      // Call the onComplete callback to mark job as complete
      if (onComplete) {
        await onComplete(job.id);
      }
      
      // Show success and close modal
      setSuccessMessage(`🎉 Job completed! ${saveResult.savedCount} candidates submitted successfully.`);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error completing job:', error);
      setError('Failed to complete job. Your draft is still saved. Please try again.');
      setIsCompleting(false);
    }
  };

  // Delete a draft candidate
  const handleDeleteDraftCandidate = (tempId: string, candidateName: string) => {
    if (!confirm(`Remove ${candidateName} from draft?`)) {
      return;
    }
    
    const success = removeCandidateFromDraft(job.id, tempId);
    
    if (success) {
      const updatedDraft = loadDraft(job.id);
      setDraft(updatedDraft);
      setSuccessMessage(`✅ ${candidateName} removed from draft`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setError('Failed to remove candidate');
    }
  };

  // Delete a saved candidate (from database)
  const handleDeleteSavedCandidate = async (candidateId: string, candidateName: string) => {
    if (!confirm(`Are you sure you want to remove ${candidateName} from this job? This will delete them from the database.`)) {
      return;
    }
    
    setDeletingCandidateId(candidateId);
    
    try {
      const success = await deleteCandidate(candidateId);
      
      if (success) {
        setSavedCandidates(prev => prev.filter(c => c.id !== candidateId));
        setSuccessMessage(`✅ ${candidateName} removed successfully`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError('Failed to remove candidate. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting candidate:', error);
      setError('Failed to remove candidate. Please try again.');
    } finally {
      setDeletingCandidateId(null);
    }
  };

  const addUrlField = () => {
    if (linkedinUrls.length >= MAX_CANDIDATES_PER_SUBMISSION) {
      setError(`Cannot add more than ${MAX_CANDIDATES_PER_SUBMISSION} LinkedIn URLs`);
      return;
    }
    setLinkedinUrls([...linkedinUrls, '']);
  };

  const removeUrl = (index: number) => {
    if (linkedinUrls.length > 1) {
      const newUrls = linkedinUrls.filter((_, i) => i !== index);
      setLinkedinUrls(newUrls);
    }
  };

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...linkedinUrls];
    newUrls[index] = value;
    setLinkedinUrls(newUrls);
    setError('');
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setCsvError('Please upload a CSV file');
      setCsvFile(null);
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setCsvError('File size must be less than 5MB');
      setCsvFile(null);
      return;
    }
    
    setCsvFile(file);
    setCsvError('');
    setError('');
  };

  const handleBackToInput = () => {
    setStage('input');
    setError('');
    setSuccessMessage('');
  };

  // Calculate progress
  const totalProcessed = (draft?.processedCandidates.length || 0) + savedCandidates.length;
  const progressPercentage = Math.min((totalProcessed / job.candidatesRequested) * 100, 100);
  const canComplete = totalProcessed >= job.candidatesRequested;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-shadowforce-light rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-guardian/20">
        <div className="flex justify-between items-center border-b border-guardian/20 p-6">
          <div>
            <h2 className="text-2xl font-anton text-white-knight uppercase tracking-wide">Submit Candidates</h2>
            <p className="text-sm text-guardian font-jakarta mt-1">{job.title} • {job.companyName}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-guardian hover:text-supernova transition-colors"
            aria-label="Close"
          >
            <X size={28} />
          </button>
        </div>
        
        <div className="overflow-y-auto p-8" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-lg font-anton text-white-knight uppercase tracking-wide">
                Job Progress
              </h5>
              <span className={`text-sm font-jakarta flex items-center gap-2 ${canComplete ? 'text-green-400 font-semibold' : 'text-guardian'}`}>
                {canComplete && <CheckCircle size={16} />}
                {totalProcessed} / {job.candidatesRequested} candidates
              </span>
            </div>
            <div className="w-full bg-shadowforce rounded-full h-4 mb-2 border border-green-500/30">
              <div
                className="h-4 rounded-full bg-green-400 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* STAGE: INPUT */}
          {stage === 'input' && (
            <>
              {/* Submission Method Toggle */}
              <div className="mb-6">
                <h5 className="font-anton text-lg text-white-knight mb-4 uppercase tracking-wide">
                  Submission Method
                </h5>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setSubmissionMethod('csv')}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all duration-200 ${
                      submissionMethod === 'csv'
                        ? 'border-supernova bg-supernova/10 text-supernova'
                        : 'border-guardian/30 text-guardian hover:border-guardian/50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-jakarta font-semibold text-white text-sm mb-1">CSV Upload</div>
                      <div className="text-xs">Upload a CSV file with LinkedIn URLs</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubmissionMethod('urls')}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all duration-200 ${
                      submissionMethod === 'urls'
                        ? 'border-supernova bg-supernova/10 text-supernova'
                        : 'border-guardian/30 text-guardian hover:border-guardian/50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-jakarta font-semibold text-white text-sm mb-1">Manual Entry</div>
                      <div className="text-xs">Enter LinkedIn URLs individually</div>
                    </div>
                  </button>
                </div>
              </div>

              {submissionMethod === 'csv' ? (
                /* CSV Upload Section */
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <h5 className="font-anton text-lg text-white-knight uppercase tracking-wide">
                      Upload CSV File
                    </h5>
                    <div className="relative group">
                      <HelpCircle size={18} className="text-guardian hover:text-supernova cursor-help transition-colors" />
                      <div className="absolute left-0 top-8 hidden group-hover:block z-50 w-80 bg-shadowforce-light border border-supernova/30 rounded-lg p-4 shadow-2xl">
                        <h6 className="font-jakarta font-semibold text-supernova text-sm mb-2">CSV Format Requirements:</h6>
                        <ul className="text-guardian font-jakarta text-xs space-y-1 mb-3">
                          <li>• First column should contain LinkedIn URLs</li>
                          <li>• Header row is optional (will be automatically detected)</li>
                          <li>• Maximum {MAX_CANDIDATES_PER_SUBMISSION} URLs per file</li>
                          <li>• File size limit: 5MB</li>
                        </ul>
                        <div className="text-xs text-guardian/80">
                          <div className="text-sm text-supernova font-jakarta font-semibold mb-1">Example format:</div>
                          <code className="text-xs text-white-knight font-jakarta block bg-shadowforce p-2 rounded">
                            linkedin_url<br/>
                            https://linkedin.com/in/candidate1<br/>
                            https://linkedin.com/in/candidate2
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvUpload}
                      className="block w-full text-sm text-guardian
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-supernova file:text-shadowforce
                        hover:file:bg-supernova-light
                        file:cursor-pointer cursor-pointer"
                    />
                  </div>
                  {csvFile && (
                    <div className="mb-4 p-3 bg-supernova/10 border border-supernova/30 rounded-lg">
                      <p className="text-supernova font-jakarta font-semibold text-sm">
                        ✅ File uploaded: {csvFile.name}
                      </p>
                      <p className="text-guardian font-jakarta text-xs mt-1">
                        Size: {(csvFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  )}
                  {csvError && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-red-400 font-jakarta text-sm">{csvError}</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Manual URL Entry Section */
                <div>
                  <h5 className="font-anton text-lg text-white-knight uppercase tracking-wide mb-4">
                    Manual Entry
                  </h5>
                  {linkedinUrls.map((url, index) => (
                    <div key={index} className="mb-4">
                      <div className="flex gap-2 items-start">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={url}
                            onChange={(e) => updateUrl(index, e.target.value)}
                            placeholder="https://linkedin.com/in/candidate-profile"
                            className="block w-full rounded-lg border-guardian/30 bg-shadowforce text-white-knight placeholder-guardian/60 focus:ring-supernova focus:border-supernova font-jakarta py-3 px-4"
                          />
                        </div>
                        {linkedinUrls.length > 1 && (
                          <Button
                            variant="error"
                            size="sm"
                            onClick={() => removeUrl(index)}
                            className="flex items-center gap-2"
                          >
                            <Trash2 size={16} />
                            REMOVE
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={addUrlField}
                    disabled={linkedinUrls.length >= MAX_CANDIDATES_PER_SUBMISSION}
                    className="flex items-center gap-2"
                  >
                    <Plus size={18} />
                    {linkedinUrls.length >= MAX_CANDIDATES_PER_SUBMISSION 
                      ? `MAXIMUM ${MAX_CANDIDATES_PER_SUBMISSION} URLS REACHED`
                      : 'ADD ANOTHER URL'
                    }
                  </Button>
                </div>
              )}

              <Button 
                onClick={handleProcessCandidates} 
                fullWidth
                size="lg"
                disabled={isProcessing}
                className="flex items-center justify-center gap-2 glow-supernova mt-6"
              >
                {isProcessing ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    PROCESSING...
                  </>
                ) : (
                  <>
                    <Zap size={20} />
                    PROCESS CANDIDATES
                  </>
                )}
              </Button>
            </>
          )}

          {/* STAGE: PROCESSING */}
          {stage === 'processing' && (
            <div className="text-center py-12">
              <Loader className="animate-spin text-supernova mx-auto mb-4" size={64} />
              <h3 className="text-2xl font-anton text-white-knight mb-2">PROCESSING CANDIDATES</h3>
              <p className="text-guardian font-jakarta">
                Scraping LinkedIn profiles and calculating match scores...
              </p>
              <p className="text-guardian/60 font-jakarta text-sm mt-2">
                This may take a few minutes depending on the number of candidates.
              </p>
            </div>
          )}

          {/* STAGE: REVIEW */}
          {stage === 'review' && (
            <>
              {/* Draft Candidates Table */}
              {draft && draft.processedCandidates.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-xl font-anton text-white-knight uppercase tracking-wide">
                      Accepted Candidates
                    </h5>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed">
                      <thead>
                        <tr className="border-b border-guardian/20">
                          <th className="text-left py-3 px-4 text-sm font-anton font-normal text-guardian uppercase tracking-wide w-[40%]">Name</th>
                          <th className="text-center py-3 px-4 text-sm font-anton font-normal text-guardian uppercase tracking-wide w-[20%]">Score</th>
                          <th className="text-center py-3 px-4 text-sm font-anton font-normal text-guardian uppercase tracking-wide w-[20%]">LinkedIn</th>
                          <th className="text-center py-3 px-4 text-sm font-anton font-normal text-guardian uppercase tracking-wide w-[20%]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {draft.processedCandidates.map((dc) => (
                          <tr key={dc.tempId} className="border-b border-guardian/10 hover:bg-shadowforce/50 transition-colors">
                            <td className="py-3 px-4">
                              <span className="text-white-knight font-jakarta text-sm">
                                {dc.candidate.firstName} {dc.candidate.lastName}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="group cursor-help inline-block">
                                <span className="text-green-400 font-anton text-lg">{dc.score}%</span>
                                {dc.reasoning && (
                                  <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden group-hover:block z-[9999] w-[32rem] max-w-[90vw] bg-shadowforce-light border-2 border-supernova/50 rounded-lg p-6 shadow-2xl pointer-events-none">
                                    <h6 className="font-jakarta font-semibold text-supernova text-base mb-3">Match Score Reasoning:</h6>
                                    <p className="text-guardian font-jakarta text-sm leading-relaxed whitespace-pre-wrap break-words">
                                      {dc.reasoning}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <a 
                                href={dc.linkedinUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-supernova hover:text-supernova-light font-jakarta text-sm inline-flex items-center gap-1"
                              >
                                View <ExternalLink size={12} />
                              </a>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handleDeleteDraftCandidate(dc.tempId, `${dc.candidate.firstName} ${dc.candidate.lastName}`)}
                                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 transition-all mx-auto"
                                title="Remove from draft"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Rejected Candidates */}
              {draft && draft.rejectedCandidates.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-xl font-anton text-white-knight uppercase tracking-wide">
                      Rejected Candidates
                    </h5>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed">
                      <thead>
                        <tr className="border-b border-guardian/20">
                          <th className="text-left py-3 px-4 text-sm font-anton font-normal text-guardian uppercase tracking-wide w-[40%]">Name</th>
                          <th className="text-center py-3 px-4 text-sm font-anton font-normal text-guardian uppercase tracking-wide w-[20%]">Score</th>
                          <th className="text-center py-3 px-4 text-sm font-anton font-normal text-guardian uppercase tracking-wide w-[20%]">LinkedIn</th>
                          <th className="text-center py-3 px-4 text-sm font-anton font-normal text-guardian uppercase tracking-wide w-[20%]">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {draft.rejectedCandidates.map((rc, index) => (
                          <tr key={index} className="border-b border-guardian/10 hover:bg-shadowforce/50 transition-colors">
                            <td className="py-3 px-4">
                              <span className="text-white-knight font-jakarta text-sm opacity-60">
                                {rc.name}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="group cursor-help inline-block">
                                <span className="text-red-400 font-anton text-lg">{rc.score}%</span>
                                {rc.reasoning && (
                                  <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden group-hover:block z-[9999] w-[32rem] max-w-[90vw] bg-shadowforce-light border-2 border-supernova/50 rounded-lg p-6 shadow-2xl pointer-events-none">
                                    <h6 className="font-jakarta font-semibold text-supernova text-base mb-3">Rejection Reasoning:</h6>
                                    <p className="text-guardian font-jakarta text-sm leading-relaxed whitespace-pre-wrap break-words">
                                      {rc.reasoning}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <a 
                                href={rc.linkedinUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-supernova hover:text-supernova-light font-jakarta text-sm inline-flex items-center gap-1 opacity-60"
                              >
                                View <ExternalLink size={12} />
                              </a>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="text-red-400 font-jakarta text-xs italic">Auto-rejected</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Saved Candidates (Already in Database) */}
              {savedCandidates.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-xl font-anton text-white-knight uppercase tracking-wide">
                      Previously Saved Candidates
                    </h5>
                    <span className="text-sm font-jakarta text-green-400">
                      {savedCandidates.length} saved to database
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-guardian/20">
                          <th className="text-left py-3 px-4 text-sm font-anton font-normal text-guardian uppercase tracking-wide">Name</th>
                          <th className="text-center py-3 px-4 text-sm font-anton font-normal text-guardian uppercase tracking-wide">LinkedIn</th>
                          <th className="text-center py-3 px-4 text-sm font-anton font-normal text-guardian uppercase tracking-wide">Status</th>
                          <th className="text-center py-3 px-4 text-sm font-anton font-normal text-guardian uppercase tracking-wide">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {savedCandidates.map((candidate) => (
                          <tr key={candidate.id} className="border-b border-guardian/10 hover:bg-shadowforce/50 transition-colors">
                            <td className="py-3 px-4">
                              <span className="text-white-knight font-jakarta text-sm">
                                {candidate.firstName} {candidate.lastName}
                              </span>
                              {candidate.headline && (
                                <p className="text-guardian text-xs mt-1">{candidate.headline}</p>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <a 
                                href={candidate.linkedinUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-supernova hover:text-supernova-light font-jakarta text-sm inline-flex items-center gap-1"
                              >
                                View <ExternalLink size={12} />
                              </a>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <CheckCircle size={20} className="text-green-400 mx-auto" />
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handleDeleteSavedCandidate(candidate.id, `${candidate.firstName} ${candidate.lastName}`)}
                                disabled={deletingCandidateId === candidate.id}
                                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
                                title="Remove candidate (deletes from database)"
                              >
                                {deletingCandidateId === candidate.id ? (
                                  <Loader className="animate-spin" size={14} />
                                ) : (
                                  <Trash2 size={14} />
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={handleBackToInput}
                  className="flex-1 flex items-center justify-center gap-2"
                  disabled={isCompleting}
                >
                  <Plus size={18} />
                  ADD MORE CANDIDATES
                </Button>
                <Button
                  onClick={handleCompleteJob}
                  className={`flex-1 flex items-center justify-center gap-2 ${
                    canComplete ? 'glow-supernova' : 'opacity-50 cursor-not-allowed'
                  }`}
                  disabled={!canComplete || isCompleting}
                >
                  {isCompleting ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      COMPLETING JOB...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      CONFIRM & COMPLETE JOB
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {/* Error Messages */}
          {error && (
            <div className="mt-6 p-6 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-center mb-3">
                <AlertCircle className="text-red-400 mr-2" size={20} />
                <h5 className="font-anton text-lg text-red-400 uppercase tracking-wide">Error</h5>
              </div>
              <pre className="text-red-400 font-jakarta text-sm leading-relaxed whitespace-pre-wrap">{error}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
