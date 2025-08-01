import React, { useState } from 'react';
import { Job } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { JobTimer } from '../ui/JobTimer';
import { testApifyResponse } from '../../services/apifyService';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { FormInput } from '../forms/FormInput';
import { X, CheckCircle, AlertCircle, Plus, Trash2, Users, ExternalLink, Loader, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ghlService } from '../../services/ghlService';

interface JobDetailModalProps {
  job: Job;
  onClose: () => void;
  onClaim?: (jobId: string) => void;
  onComplete?: (jobId: string) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  onClose,
  onClaim,
  onComplete
}) => {
  const { addCandidatesFromLinkedIn, getCandidatesByJob, loading } = useData();
  const { userProfile } = useAuth();
  
  // Use the authenticated user's name from their profile
  const sourcerName = userProfile?.name || 'Unknown Sourcer';
  const [linkedinUrls, setLinkedinUrls] = useState(['']);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [submissionMethod, setSubmissionMethod] = useState<'urls' | 'csv'>('csv');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvError, setCsvError] = useState('');
  const [showAcceptedCandidates, setShowAcceptedCandidates] = useState(false);
  const [showJobCompletionConfirmation, setShowJobCompletionConfirmation] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const MAX_CANDIDATES_PER_SUBMISSION = 50;
  
  // Get accepted candidates for this job
  const [acceptedCandidates, setAcceptedCandidates] = useState(getCandidatesByJob(job.id));
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  };

  const handleClaim = async () => {
    if (!userProfile) {
      setError('You must be logged in to claim jobs');
      return;
    }
    
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onClaim && onClaim(job.id);
    setIsSubmitting(false);
    onClose();
  };

  const parseCsvFile = (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').map(line => line.trim()).filter(line => line);
          
          // Skip header row if it exists (check if first line contains 'linkedin' or 'url')
          const startIndex = lines[0]?.toLowerCase().includes('linkedin') || lines[0]?.toLowerCase().includes('url') ? 1 : 0;
          
          const urls: string[] = [];
          
          for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i];
            
            // Handle CSV with commas - take the first column that looks like a LinkedIn URL
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
    
    // Enforce 50-candidate limit
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
        

      }
      
      // Show a success message and reset form, do not close modal
      setSuccessMessage(`✅ ${result.acceptedCount} candidate${result.acceptedCount === 1 ? '' : 's'} submitted successfully!`);
      setError('');
      setLinkedinUrls(['']);
      setCsvFile(null);
      // Optionally, you could also refresh acceptedCandidates here if needed
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
      setError(submissionMethod === 'csv' ? 'CSV file contains no valid LinkedIn URLs' : 'Please add at least one LinkedIn URL');
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    setError('');

    try {
      const result = await testApifyResponse(url);
      setTestResult(result);
      
      if (!result.success) {
        setError(`Test failed: ${result.error}`);
      }
    } catch (error) {
      setError('Test failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsTesting(false);
    }
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

            {/* Move Job Description above Key Selling Points and remove background */}
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
            
            {/* Remove Company Information box and its contents */}
            {/* <div className="bg-supernova/10 border border-supernova/30 p-6 rounded-lg mb-6">
              <p className="text-sm font-jakarta font-semibold text-supernova uppercase tracking-wide mb-3">Company Information</p>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-jakarta font-semibold text-guardian">Company</p>
                  <p className="text-white-knight font-jakarta font-bold">{job.companyName}</p>
                </div>
                <div>
                  <p className="text-sm font-jakarta font-semibold text-guardian">Location</p>
                  <p className="text-white-knight font-jakarta font-bold">{job.location}</p>
                </div>
                <div>
                  <p className="text-sm font-jakarta font-semibold text-guardian">Work Arrangement</p>
                  <p className="text-white-knight font-jakarta font-bold">{job.workArrangement}</p>
                </div>
                <div>
                  <p className="text-sm font-jakarta font-semibold text-guardian">Posted</p>
                  <p className="text-white-knight font-jakarta font-bold">{formatDate(job.createdAt)}</p>
                </div>
              </div>
            </div> */}
            


            
            {/* Claim Job Section */}
            {job.status === 'Unclaimed' && onClaim && (
              <div className="bg-supernova/10 border border-supernova/30 p-8 rounded-xl">
                <h4 className="text-2xl font-anton text-supernova mb-6 uppercase tracking-wide">Claim This Job</h4>
                
                <div className="mb-6">
                  <div className="bg-shadowforce border border-guardian/20 p-4 rounded-lg">
                    <p className="text-sm font-jakarta font-semibold text-guardian mb-2 uppercase tracking-wide">
                      Claiming as:
                    </p>
                    <p className="text-xl font-anton text-white-knight">{sourcerName}</p>
                    <p className="text-sm text-guardian font-jakarta mt-1">
                      {userProfile?.email}
                    </p>
                  </div>
                  
                  {error && (
                    <p className="mt-2 text-sm text-red-400 font-jakarta font-medium">{error}</p>
                  )}
                </div>
                
                <Button 
                  onClick={handleClaim} 
                  fullWidth
                  size="lg"
                  className="glow-supernova"
                  isLoading={isSubmitting}
                >
                  CLAIM JOB
                </Button>
              </div>
            )}
            
            {/* Complete Job Section */}
            {job.status === 'Claimed' && job.sourcerId === userProfile?.id && onComplete && (
              <div className="bg-green-500/10 border border-green-500/30 p-8 rounded-xl">
                {/* Submission Method and Scrape/Submit Button */}
                <div className="space-y-6 mb-6">
                  {/* Submission Method Toggle */}
                  <div className="bg-shadowforce border border-guardian/20 p-6 rounded-lg">
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
                    <div className="bg-shadowforce border border-guardian/20 p-6 rounded-lg">
                      <h5 className="font-anton text-lg text-white-knight mb-4 uppercase tracking-wide">
                        Upload CSV File
                      </h5>
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
                      <div className="bg-supernova/10 border border-supernova/30 p-4 rounded-lg">
                        <h6 className="font-jakarta font-semibold text-supernova text-sm mb-1">CSV Format Requirements:</h6>
                        <ul className="text-guardian font-jakarta text-xs space-y-1">
                          <li>• First column should contain LinkedIn URLs</li>
                          <li>• Header row is optional (will be automatically detected)</li>
                          <li>• Maximum {MAX_CANDIDATES_PER_SUBMISSION} URLs per file</li>
                          <li>• File size limit: 5MB</li>
                        </ul>
                        <div className="mt-3 text-xs text-guardian/80">
                          <div className="text-sm text-supernova font-jakarta font-semibold mb-1">Example format:</div>
                          <code className="text-sm text-white-knight font-jakarta font-semibold block text-left">
linkedin_url<br/>
https://linkedin.com/in/candidate1<br/>
https://linkedin.com/in/candidate2
                          </code>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Manual URL Entry Section */
                    <div>
                      {linkedinUrls.map((url, index) => (
                        <div key={index} className="bg-shadowforce border border-guardian/20 p-6 rounded-lg">
                          <div className="flex justify-between items-center mb-4">
                            <h5 className="font-anton text-lg text-white-knight uppercase tracking-wide">
                              LinkedIn URL {index + 1}
                            </h5>
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
                          <FormInput
                            label="LinkedIn URL"
                            value={url}
                            onChange={(e) => updateUrl(index, e.target.value)}
                            placeholder="https://linkedin.com/in/candidate-profile"
                            hint="Paste the full LinkedIn profile URL here"
                          />
                          <div className="mt-4">
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
                {testResult && (
                  <div className="mb-6 p-6 bg-shadowforce border border-guardian/20 rounded-lg">
                    <h5 className="font-anton text-lg text-white-knight mb-4 uppercase tracking-wide">
                      Apify Test Result
                    </h5>
                    {testResult.success ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                          <p className="text-green-400 font-jakarta font-semibold mb-2">✅ Success!</p>
                          {testResult.transformedProfile && (
                            <div className="space-y-2 text-sm">
                              <p><span className="text-guardian">Name:</span> <span className="text-white-knight">{testResult.transformedProfile.firstName} {testResult.transformedProfile.lastName}</span></p>
                              <p><span className="text-guardian">Headline:</span> <span className="text-white-knight">{testResult.transformedProfile.headline}</span></p>
                              <p><span className="text-guardian">Location:</span> <span className="text-white-knight">{testResult.transformedProfile.location}</span></p>
                              <p><span className="text-guardian">Experience Count:</span> <span className="text-white-knight">{testResult.transformedProfile.experience?.length || 0}</span></p>
                              <p><span className="text-guardian">Skills Count:</span> <span className="text-white-knight">{testResult.transformedProfile.skills?.length || 0}</span></p>
                            </div>
                          )}
                        </div>
                        <details className="bg-shadowforce-light border border-guardian/20 rounded-lg">
                          <summary className="p-3 cursor-pointer text-guardian font-jakarta font-semibold">
                            View Raw Apify Response
                          </summary>
                          <div className="p-3 border-t border-guardian/20">
                            <pre className="text-xs text-guardian overflow-auto max-h-64">
                              {JSON.stringify(testResult.rawResponse, null, 2)}
                            </pre>
                          </div>
                        </details>
                      </div>
                    ) : (
                      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-red-400 font-jakarta font-semibold">❌ Test Failed</p>
                        <p className="text-guardian text-sm mt-2">{testResult.error}</p>
                      </div>
                    )}
                  </div>
                )}
                {successMessage && (
                  <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 font-jakarta font-semibold text-center">
                    {successMessage}
                  </div>
                )}
                <Button 
                  onClick={handleComplete} 
                  variant="success"
                  fullWidth
                  size="lg"
                  isLoading={isSubmitting || loading}
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2"
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
                {/* Accepted Candidates Section moved here */}
                {job.status === 'Claimed' && (
                  <div className="mb-8 mt-8">
                    <div className="mb-8">
                      <h6 className="text-sm text-white font-jakarta font-semibold">
                        Submitted candidates will be analyzed and given a job match score. If they do not meet a score of a 60% they will be rejected. Please submit candidates until the required amount of candidates are accepted.
                      </h6>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Users className="text-green-400 mr-3" size={24} />
                        <h5 className="text-xl font-anton text-green-400 uppercase tracking-wide">
                          Accepted Candidates
                        </h5>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-shadowforce rounded-full h-4 mb-2 border border-green-500/30">
                      <div
                        className="h-4 rounded-full bg-green-400 transition-all duration-300"
                        style={{ width: `${Math.min((acceptedCandidates.length / job.candidatesRequested) * 100, 100)}%` }}
                      ></div>
                    </div>
                    {/* Progress Text */}
                    <div className="text-sm text-green-400 font-jakarta font-semibold mb-4">
                      {acceptedCandidates.length} of {job.candidatesRequested} candidates submitted
                      {acceptedCandidates.length >= job.candidatesRequested && (
                        <span className="text-green-400 font-bold ml-2">✅ TARGET REACHED!</span>
                      )}
                    </div>
                    {/* Show Candidates Button - bottom left under bar, only if there are accepted candidates */}
                    {acceptedCandidates.length > 0 && (
                      <div className="mb-4 flex justify-start">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAcceptedCandidates(!showAcceptedCandidates)}
                        >
                          {showAcceptedCandidates ? 'HIDE' : 'SHOW'} CANDIDATES
                        </Button>
                      </div>
                    )}
                    {showAcceptedCandidates && (
                      <div className="bg-shadowforce border border-guardian/20 rounded-lg p-4 max-h-64 overflow-y-auto">
                        <div className="space-y-3">
                          {acceptedCandidates.map((candidate, index) => (
                            <div key={candidate.id} className="flex items-center justify-between p-3 bg-shadowforce-light rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <span className="text-supernova font-anton text-sm mr-3">#{index + 1}</span>
                                  <div>
                                    <p className="text-white-knight font-jakarta font-semibold text-2xl">
                                      {candidate.firstName} {candidate.lastName}
                                    </p>
                                    <p className="text-guardian font-jakarta text-sm">
                                      {candidate.headline || 'No headline available'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(candidate.linkedinUrl, '_blank')}
                                className="flex items-center gap-2"
                              >
                                <ExternalLink size={14} />
                                VIEW
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {/* Manual Job Completion Button - only enabled when target is reached */}
                {job.status === 'Claimed' && (
                  <div className="mt-8 flex flex-col items-center">
                    <Button
                      variant="success"
                      size="lg"
                      disabled={acceptedCandidates.length < job.candidatesRequested || isSubmitting}
                      onClick={async () => {
                        if (acceptedCandidates.length < job.candidatesRequested) return;
                        setIsSubmitting(true);
                        setError('');
                        try {
                          // Fetch latest candidates from Supabase before completing
                          const { data: latestCandidates, error } = await supabase
                            .from('candidates')
                            .select('*')
                            .eq('job_id', job.id);
                          if (error) {
                            setError('Failed to verify candidate count. Please try again.');
                            setIsSubmitting(false);
                            return;
                          }
                          if ((latestCandidates?.length || 0) < job.candidatesRequested) {
                            setError(`You must have at least ${job.candidatesRequested} accepted candidates to complete this job. Please refresh and try again.`);
                            setIsSubmitting(false);
                            return;
                          }
                          // Use DataContext or useSourcerData to complete the job
                          await onComplete && onComplete(job.id);
                          setShowJobCompletionConfirmation(true);
                          setTimeout(() => {
                            onClose();
                            window.location.href = '/sourcer';
                          }, 1000);
                        } catch (e) {
                          setError('Failed to complete job. Please try again.');
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle size={20} />
                      COMPLETE JOB
                    </Button>
                    {acceptedCandidates.length < job.candidatesRequested && (
                      <p className="text-sm text-guardian mt-2">You must submit at least {job.candidatesRequested} accepted candidates to complete this job.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Job Completion Confirmation Overlay */}
      {showJobCompletionConfirmation && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 text-center max-w-md mx-4 animate-pulse">
            <div className="mb-4">
              <CheckCircle className="text-green-500 w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-2xl font-anton text-gray-900 mb-2">
              🎉 JOB COMPLETED!
            </h3>
            <p className="text-gray-600 font-jakarta">
              All required candidates have been successfully submitted.
              <br />
              Redirecting to dashboard...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};