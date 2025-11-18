import React, { useState, useEffect, useCallback } from 'react';
import { Job } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { X, AlertCircle, Plus, Trash2, ExternalLink, Loader, Zap, HelpCircle, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { generateJobMatchScore } from '../../services/anthropicService';

interface AddCandidatesModalProps {
  job: Job;
  onClose: () => void;
  onComplete?: (jobId: string) => void;
}

export const AddCandidatesModal: React.FC<AddCandidatesModalProps> = ({
  job,
  onClose,
  onComplete
}) => {
  const { addCandidatesFromLinkedIn, getCandidatesByJob, loading, deleteCandidate } = useData();
  const { userProfile } = useAuth();
  
  const [linkedinUrls, setLinkedinUrls] = useState(['']);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [submissionMethod, setSubmissionMethod] = useState<'urls' | 'csv'>('csv');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvError, setCsvError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deletingCandidateId, setDeletingCandidateId] = useState<string | null>(null);
  const [matchScores, setMatchScores] = useState<Record<string, { score: number; reasoning: string; loading: boolean }>>({});
  
  const MAX_CANDIDATES_PER_SUBMISSION = 200;
  
  // Get accepted candidates for this job
  const [acceptedCandidates, setAcceptedCandidates] = useState(getCandidatesByJob(job.id));

  // Calculate match score for a candidate
  const getMatchScore = useCallback(async (candidate: any) => {
    if (matchScores[candidate.id]) return; // Already calculated or loading
    
    // Set loading state
    setMatchScores(prev => ({
      ...prev,
      [candidate.id]: { score: 0, reasoning: '', loading: true }
    }));
    
    try {
      const matchData = {
        jobTitle: job.title,
        jobDescription: job.description,
        seniorityLevel: job.seniorityLevel,
        keySkills: job.mustHaveSkills || [],
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
        [candidate.id]: { ...result, loading: false }
      }));
    } catch (error) {
      console.error('Error calculating match score:', error);
      setMatchScores(prev => ({
        ...prev,
        [candidate.id]: { score: 0, reasoning: 'Error calculating match score', loading: false }
      }));
    }
  }, [job, matchScores]);

  // Calculate match scores when candidates are available
  useEffect(() => {
    if (acceptedCandidates.length > 0) {
      acceptedCandidates.forEach(candidate => {
        getMatchScore(candidate);
      });
    }
  }, [acceptedCandidates, getMatchScore]);

  const handleDeleteCandidate = async (candidateId: string, candidateName: string) => {
    if (!confirm(`Are you sure you want to remove ${candidateName} from this job?`)) {
      return;
    }
    
    setDeletingCandidateId(candidateId);
    
    try {
      const success = await deleteCandidate(candidateId);
      
      if (success) {
        // Update local state to remove the candidate
        setAcceptedCandidates(prev => prev.filter(c => c.id !== candidateId));
        
        // Show success message
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

  const parseCsvFile = (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          console.log('📄 CSV file content:', text.substring(0, 500));
          
          const lines = text.split('\n').map(line => line.trim()).filter(line => line);
          console.log(`📄 CSV has ${lines.length} lines (including potential header)`);
          
          // Skip header row if it exists
          const startIndex = lines[0]?.toLowerCase().includes('linkedin') || lines[0]?.toLowerCase().includes('url') ? 1 : 0;
          console.log(`📄 Starting from line ${startIndex + 1} (${startIndex === 1 ? 'header detected' : 'no header'})`);
          
          const urls: string[] = [];
          
          for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i];
            console.log(`📄 Parsing line ${i + 1}: "${line}"`);
            
            // Handle CSV with commas - take the first column that looks like a LinkedIn URL
            const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));
            const linkedinUrl = columns.find(col => col.includes('linkedin.com')) || columns[0];
            
            console.log(`📄   Found ${columns.length} columns, LinkedIn URL: "${linkedinUrl}"`);
            
            if (linkedinUrl && linkedinUrl.includes('linkedin.com')) {
              urls.push(linkedinUrl);
              console.log(`✅   Added URL: ${linkedinUrl}`);
            } else {
              console.warn(`⚠️   Skipped (not a LinkedIn URL): ${linkedinUrl}`);
            }
          }
          
          console.log(`📄 CSV parsing complete: ${urls.length} valid LinkedIn URLs extracted`);
          urls.forEach((url, index) => {
            console.log(`  ${index + 1}. ${url}`);
          });
          
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

  const handleComplete = async () => {
    if (loading || !userProfile) {
      setError('User information is still loading. Please wait and try again.');
      return;
    }
    let validUrls: string[] = [];
    setSuccessMessage('');
    
    if (submissionMethod === 'csv') {
      // Handle CSV upload
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
      // Handle manual URL entry
      validUrls = linkedinUrls.filter(url => url.trim());
    }
    
    if (validUrls.length === 0) {
      setError('Please add at least one LinkedIn URL');
      return;
    }
    
    // Enforce 200-candidate limit
    if (validUrls.length > MAX_CANDIDATES_PER_SUBMISSION) {
      setError(`Cannot submit more than ${MAX_CANDIDATES_PER_SUBMISSION} candidates per job submission`);
      return;
    }
    
    // Validate that URLs are LinkedIn URLs
    const invalidUrls = validUrls.filter(url => 
      !url.includes('linkedin.com')
    );
    
    if (invalidUrls.length > 0) {
      setError('Please ensure all LinkedIn URLs are valid');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Scrape LinkedIn profiles and add candidates
      const result = await addCandidatesFromLinkedIn(job.id, validUrls);
      
      if (!result.success) {
        // Show detailed results (could be rejections or other failures)
        setError(result.error || 'Failed to process LinkedIn profiles');
        setIsSubmitting(false);
        return;
      }
      
      console.log(`Candidates submitted successfully for job: ${job.id}. Accepted: ${result.acceptedCount}, Rejected: ${result.rejectedCount}`);
      
      // Force reload of candidates from Supabase
      const { data: latestCandidates, error: candidatesError } = await supabase
        .from('candidates')
        .select('*')
        .eq('job_id', job.id);
      if (!candidatesError && latestCandidates) {
        setAcceptedCandidates(latestCandidates);
        
        // Check for N/A names (incomplete scraping data)
        const incompleteProfiles = latestCandidates.filter((c: any) => 
          c.first_name === 'N/A' || c.last_name === 'N/A' || 
          !c.first_name || !c.last_name
        ).length;
        
        if (incompleteProfiles > 0) {
          console.warn(`⚠️ ${incompleteProfiles} candidates have incomplete profile data from LinkedIn`);
        }
      }
      
      // Show a success message and reset form, do not close modal
      let message = `✅ ${result.acceptedCount} candidate${result.acceptedCount === 1 ? '' : 's'} submitted successfully!`;
      
      // Add rejection information if any candidates were rejected
      if (result.rejectedCount > 0) {
        message += ` (${result.rejectedCount} rejected - may include current employees of ${job.companyName})`;
      }
      
      // Add warning about profiles that couldn't be fully scraped
      const scrapingFailures = validUrls.length - result.acceptedCount - result.rejectedCount;
      if (scrapingFailures > 0) {
        message += `\n\n⚠️ ${scrapingFailures} LinkedIn profile${scrapingFailures === 1 ? '' : 's'} could not be scraped. This usually means the profile${scrapingFailures === 1 ? ' is' : 's are'} private, restricted, or blocked by LinkedIn.`;
      }
      
      setSuccessMessage(message);
      setError('');
      setLinkedinUrls(['']);
      setCsvFile(null);
      setIsSubmitting(false);
    } catch (error) {
      console.error('Error submitting candidates:', error);
      setError('Failed to process LinkedIn profiles. Please try again.');
      setIsSubmitting(false);
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
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setCsvError('Please upload a CSV file');
      setCsvFile(null);
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setCsvError('File size must be less than 5MB');
      setCsvFile(null);
      return;
    }
    
    setCsvFile(file);
    setCsvError('');
    setError('');
  };

  const handleTestUrl = async (url: string) => {
    if (!url.trim() || !url.includes('linkedin.com')) {
      setError('Please add at least one LinkedIn URL');
      return;
    }

    setIsTesting(true);
    setError('');

    try {
      // Import and use the scraping service
      const { scrapeLinkedInProfiles } = await import('../../services/scrapingDogService');
      
      // Scrape the profile
      console.log('🧪 Testing URL:', url);
      const scrapingResult = await scrapeLinkedInProfiles([url]);
      
      if (!scrapingResult.success || scrapingResult.profiles.length === 0) {
        setError(`Test failed: ${scrapingResult.error || 'Could not scrape profile'}`);
        setIsTesting(false);
        return;
      }
      
      const profile = scrapingResult.profiles[0];
      console.log('✅ Profile scraped:', profile.firstName, profile.lastName);
      
      // Calculate match score
      const matchData = {
        jobTitle: job.title,
        jobDescription: job.description,
        seniorityLevel: job.seniorityLevel,
        keySkills: job.mustHaveSkills || [],
        candidateData: {
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          headline: profile.headline || '',
          location: profile.location || '',
          experience: profile.experience,
          education: profile.education,
          skills: profile.skills,
          about: profile.summary || ''
        }
      };
      
      console.log('🤖 Calculating match score...');
      const scoreResult = await generateJobMatchScore(matchData);
      console.log('📊 Score:', scoreResult.score);
      
      // Create temporary candidate (not saved to DB)
      const tempCandidate = {
        id: `temp-${Date.now()}`, // Temporary ID
        jobId: job.id,
        firstName: profile.firstName || 'N/A',
        lastName: profile.lastName || 'N/A',
        linkedinUrl: url,
        headline: profile.headline || '',
        location: profile.location || '',
        experience: profile.experience,
        education: profile.education,
        skills: profile.skills,
        summary: profile.summary,
        submittedAt: new Date()
      };
      
      // Add to local state (not database)
      setAcceptedCandidates(prev => [...prev, tempCandidate]);
      
      // Add score to matchScores state
      setMatchScores(prev => ({
        ...prev,
        [tempCandidate.id]: { 
          score: scoreResult.score, 
          reasoning: scoreResult.reasoning, 
          loading: false 
        }
      }));
      
      setSuccessMessage(`✅ Test successful!`);
      
    } catch (error) {
      console.error('Test failed:', error);
      setError('Test failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-shadowforce-light rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-guardian/20">
        <div className="flex justify-between items-center border-b border-guardian/20 p-6">
          <div>
            <h2 className="text-2xl font-anton text-white-knight uppercase tracking-wide">Add Candidates</h2>
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
          {/* Submission Method and Scrape/Submit Button */}
          <div className="space-y-6 mb-6">
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
                  {/* Tooltip with CSV requirements */}
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
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestUrl(url)}
                        disabled={isTesting || !url.trim()}
                        className="flex items-center gap-2"
                      >
                        {isTesting ? (
                          <>
                            <Loader className="animate-spin" size={16} />
                            TESTING...
                          </>
                        ) : (
                          <>
                            <Zap size={16} />
                            TEST THIS URL
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {submissionMethod === 'urls' && (
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
            )}
          </div>
          {error && (
            <div className="mb-6 p-6 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-center mb-3">
                  <AlertCircle className="text-red-400 mr-2" size={20} />
                  <h5 className="font-anton text-lg text-red-400 uppercase tracking-wide">Submission Results</h5>
                </div>
              <pre className="text-red-400 font-jakarta text-sm leading-relaxed whitespace-pre-wrap">{error}</pre>
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="text-green-400 font-jakarta font-semibold whitespace-pre-line">
                  {successMessage}
                </div>
                {successMessage.includes('could not be scraped') && (
                  <div className="mt-3 text-sm text-guardian">
                    <p className="font-semibold text-supernova mb-1">💡 Tips for better results:</p>
                    <ul className="space-y-1 ml-4">
                      <li>• Use LinkedIn profiles that are public or have minimal privacy settings</li>
                      <li>• Verify the LinkedIn URLs are correct and accessible</li>
                      <li>• Try profiles of people with "Open to Work" badges</li>
                </ul>
              </div>
            )}
            </div>
          )}
          <Button 
            onClick={handleComplete} 
            fullWidth
            size="lg"
            isLoading={isSubmitting || loading}
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 glow-supernova"
          >
            {isSubmitting ? (
              <>
                <Loader className="animate-spin" size={20} />
                SUBMITTING CANDIDATES...
              </>
            ) : (
              <>
                <Zap size={20} />
                SUBMIT CANDIDATES
              </>
            )}
          </Button>
          {/* Accepted Candidates Section */}
          <div className="mb-8 mt-8">
            <div className="mb-6">
              <h6 className="text-sm text-white font-jakarta font-semibold">
                Submitted candidates will be analyzed and given a job match score. If they do not meet a score of a 60% they will be rejected. Please submit candidates until the required amount of candidates are accepted.
              </h6>
            </div>
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-xl font-anton text-white-knight uppercase tracking-wide">
                Accepted Candidates
              </h5>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-shadowforce rounded-full h-4 mb-2 border border-green-500/30">
              <div
                className="h-4 rounded-full bg-green-400 transition-all duration-300"
                style={{ width: `${Math.min((acceptedCandidates.filter(c => (matchScores[c.id]?.score || 0) >= 60).length / job.candidatesRequested) * 100, 100)}%` }}
              ></div>
            </div>
            {/* Progress Text */}
            <div className="text-sm text-white-knight font-jakarta font-semibold mb-4">
              {acceptedCandidates.filter(c => (matchScores[c.id]?.score || 0) >= 60).length} of {job.candidatesRequested} candidates submitted
              {acceptedCandidates.filter(c => (matchScores[c.id]?.score || 0) >= 60).length >= job.candidatesRequested && (
                <span className="text-white-knight font-bold ml-2">✅ TARGET REACHED!</span>
              )}
            </div>
            
            {/* Candidates Table */}
            {acceptedCandidates.length > 0 && (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-guardian/20">
                      <th className="text-left py-3 px-4 text-sm font-anton font-normal text-guardian uppercase tracking-wide">LinkedIn URL</th>
                      <th className="text-center py-3 px-4 text-sm font-anton font-normal text-guardian uppercase tracking-wide">Score</th>
                      <th className="text-center py-3 px-4 text-sm font-anton font-normal text-guardian uppercase tracking-wide">Status</th>
                      <th className="text-center py-3 px-4 text-sm font-anton font-normal text-guardian uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {acceptedCandidates.map((candidate, index) => {
                      const score = matchScores[candidate.id]?.score || 0;
                      const isLoading = matchScores[candidate.id]?.loading;
                      const isAccepted = score >= 60;
                      
                      return (
                        <tr key={candidate.id} className="border-b border-guardian/10 hover:bg-shadowforce/50 transition-colors">
                          <td className="py-3 px-4">
                            <a 
                              href={candidate.linkedinUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-supernova hover:text-supernova-light font-jakarta text-sm underline flex items-center gap-2"
                            >
                              {candidate.linkedinUrl}
                              <ExternalLink size={12} />
                            </a>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isLoading ? (
                              <div className="flex items-center justify-center">
                                <Loader className="animate-spin text-supernova" size={16} />
                              </div>
                            ) : (
                              <span className="text-white-knight font-anton text-lg">{score}%</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isLoading ? (
                              <span className="text-guardian font-jakarta text-xs">Analyzing...</span>
                            ) : isAccepted ? (
                              <Check size={20} className="text-green-400 mx-auto" />
                            ) : (
                              <X size={20} className="text-red-400 mx-auto" />
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleDeleteCandidate(candidate.id, `${candidate.firstName} ${candidate.lastName}`)}
                              disabled={deletingCandidateId === candidate.id}
                              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
                              title="Remove candidate"
                            >
                              {deletingCandidateId === candidate.id ? (
                                <Loader className="animate-spin" size={14} />
                              ) : (
                                <Trash2 size={14} />
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


