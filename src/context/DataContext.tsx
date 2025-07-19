import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Job, Candidate, Tier } from '../types';
import { scrapeLinkedInProfiles } from '../services/apifyService';
import { generateJobMatchScore } from '../services/anthropicService';
import { useAuth } from './AuthContext';

interface DataContextType {
  jobs: Job[];
  candidates: Candidate[];
  tiers: Tier[];
  addJob: (job: Omit<Job, 'id' | 'status' | 'sourcerName' | 'completionLink' | 'createdAt' | 'updatedAt'>) => Job;
  addCandidate: (candidate: Omit<Candidate, 'id' | 'submittedAt'>) => Candidate;
  addCandidatesFromLinkedIn: (jobId: string, linkedinUrls: string[]) => Promise<{ 
    success: boolean; 
    acceptedCount: number; 
    rejectedCount: number; 
    error?: string 
  }>;
  updateJob: (jobId: string, updates: Partial<Job>) => Job | null;
  deleteJob: (jobId: string) => void;
  getCandidatesByJob: (jobId: string) => Candidate[];
  getCandidatesByUser: (userId: string) => Candidate[];
  getJobsByStatus: (status: Job['status']) => Job[];
  getJobById: (jobId: string) => Job | null;
  getJobsByUser: (userId: string) => Job[];
  getTierById: (tierId: string) => Tier | null;
  resetData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

// Create empty data for fresh platform
const createEmptyData = () => {
  const emptyTiers: Tier[] = [
    {
      id: 'tier-free',
      name: 'Free',
      monthlyJobAllotment: 1,
      monthlyCandidateAllotment: 20,
      includesCompanyEmails: false,
      createdAt: new Date('2024-01-01')
    },
    {
      id: 'tier-1',
      name: 'Tier 1',
      monthlyJobAllotment: 1,
      monthlyCandidateAllotment: 50,
      includesCompanyEmails: true,
      createdAt: new Date('2024-01-01')
    },
    {
      id: 'tier-2',
      name: 'Tier 2',
      monthlyJobAllotment: 3,
      monthlyCandidateAllotment: 150,
      includesCompanyEmails: true,
      createdAt: new Date('2024-01-01')
    },
    {
      id: 'tier-3',
      name: 'Tier 3',
      monthlyJobAllotment: 10,
      monthlyCandidateAllotment: 400,
      includesCompanyEmails: true,
      createdAt: new Date('2024-01-01')
    }
  ];

  const emptyClients: any[] = []; // Removed Client import, so emptyClients is no longer needed
  const emptyJobs: Job[] = [];
  const emptyCandidates: Candidate[] = [];

  return {
    tiers: emptyTiers,
    clients: emptyClients,
    jobs: emptyJobs,
    candidates: emptyCandidates
  };
};

// Load data from localStorage if available, otherwise use empty data
const loadInitialData = () => {
  // Start with empty data for initial load
  // Real data will be loaded from Supabase in useEffect
  return createEmptyData();
};

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [data, setData] = useState(() => loadInitialData());
  const { user } = useAuth();

  // DEBUG: Check and clear any old localStorage data
  useEffect(() => {
    console.log('🧹 DataContext: Checking for old localStorage data...');
    const oldJobs = localStorage.getItem('jobs');
    const oldCandidates = localStorage.getItem('candidates');
    const oldFormData = localStorage.getItem('clientIntakeFormData');
    
    let foundOldData = false;
    
    if (oldJobs) {
      console.log('🗑️ Found old jobs data:', JSON.parse(oldJobs));
      localStorage.removeItem('jobs');
      foundOldData = true;
    }
    if (oldCandidates) {
      console.log('🗑️ Found old candidates data:', JSON.parse(oldCandidates));
      localStorage.removeItem('candidates');
      foundOldData = true;
    }
    if (oldFormData) {
      console.log('🗑️ Found old form data:', JSON.parse(oldFormData));
      localStorage.removeItem('clientIntakeFormData');
      foundOldData = true;
    }
    
    if (foundOldData) {
      console.log('🔄 DataContext: Old data found, forcing fresh state reset...');
      const freshData = createEmptyData();
      setData(freshData);
      
      // Force reload user data if user is logged in
      if (user?.email) {
        setTimeout(() => {
          console.log('🔄 DataContext: Forcing fresh data reload for:', user.email);
          loadUserData(user.email);
        }, 500);
      }
    }
    
    console.log('✅ DataContext: Old localStorage data cleared');
  }, [user]);

  // No localStorage persistence - always load fresh from Supabase

        // Handle user changes - reset data when user logs out, load data when user logs in
      useEffect(() => {
        if (!user) {
          // User logged out, reset data to initial empty state
          console.log('🔄 DataContext: User logged out, resetting state');
          const freshData = createEmptyData();
          setData(freshData);
        } else {
          // User logged in, load their data from Supabase
          console.log('✅ DataContext: User logged in, loading data for:', user.email);
          
          // Force reload data from Supabase
          setTimeout(() => {
            loadUserData(user.email);
          }, 100);
        }
      }, [user]);

  const loadUserData = async (userEmail: string) => {
    try {
      console.log('📥 Loading user data from Supabase for:', userEmail);
      
      // Check if Supabase is configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.log('⚠️ Supabase not configured, using local data');
        return;
      }

      console.log('🔍 Step 1: Getting current user...');
      // Get current user profile to determine role
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No authenticated user found');
        return;
      }
      console.log('✅ Step 1 complete: User found:', user.email);

      console.log('🔍 Step 2: Loading user profile...');
      // Get user profile to determine role
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('❌ Error loading user profile:', profileError);
        return;
      }
      console.log('✅ Step 2 complete: User profile loaded');

      console.log('👤 User profile:', userProfile);
      const userRole = userProfile?.role || 'client';
      console.log('🎭 Detected user role:', userRole);

      // Load jobs based on user role
      let jobsData = [];
      if (userRole === 'client') {
        // For clients, only load jobs for their clients
        if (user?.id) {
          const { data: clientJobs, error: jobsError } = await supabase
            .from('jobs')
            .select('*')
            .eq('user_id', user.id);

          if (jobsError) {
            console.error('❌ Error loading client jobs:', jobsError);
          } else {
            jobsData = clientJobs || [];
            console.log('💼 Loaded jobs for client user:', jobsData);
          }
        }
      } else {
        // For sourcers and admins, load all jobs
        const { data: allJobs, error: jobsError } = await supabase
          .from('jobs')
          .select('*');

        if (jobsError) {
          console.error('❌ Error loading all jobs:', jobsError);
        } else {
          jobsData = allJobs || [];
          console.log('💼 Loaded all jobs for sourcer/admin:', jobsData);
        }
      }

      // Load candidates for these jobs
      let candidatesData = [];
      if (jobsData.length > 0) {
        const jobIds = jobsData.map(j => j.id);
        
        const { data: jobCandidates, error: candidatesError } = await supabase
          .from('candidates')
          .select('*')
          .in('job_id', jobIds);

        if (candidatesError) {
          console.error('❌ Error loading candidates:', candidatesError);
        } else {
          candidatesData = jobCandidates || [];
          console.log('👤 Loaded candidates:', candidatesData);
        }
      }

      // Update state with loaded data
      const loadedJobs = jobsData.map(j => ({
        id: j.id,
        userId: j.user_id, // Map database user_id to frontend userId
        companyName: j.company_name,
        title: j.title,
        description: j.description,
        seniorityLevel: j.seniority_level,
        workArrangement: j.work_arrangement,
        location: j.location,
        salaryRangeMin: j.salary_range_min,
        salaryRangeMax: j.salary_range_max,
        keySellingPoints: j.key_selling_points,
        status: j.status,
        sourcerName: j.sourcer_name,
        completionLink: j.completion_link,
        candidatesRequested: j.candidates_requested,
        createdAt: j.created_at ? new Date(j.created_at) : new Date(),
        updatedAt: j.updated_at ? new Date(j.updated_at) : new Date()
      }));

      const loadedCandidates = candidatesData.map(c => ({
        id: c.id,
        jobId: c.job_id,
        firstName: c.first_name,
        lastName: c.last_name,
        headline: c.headline,
        location: c.location,
        linkedinUrl: c.linkedin_url,
        experience: c.experience,
        education: c.education,
        skills: c.skills,
        summary: c.summary,
        submittedAt: c.submitted_at ? new Date(c.submitted_at) : new Date()
      }));

      console.log('📊 Setting data with:', {
        jobsCount: loadedJobs.length,
        candidatesCount: loadedCandidates.length
      });

      // DEBUG: Log the actual job data being set
      console.log('🔍 Job data being loaded:', loadedJobs.map(j => ({
        id: j.id,
        email: j.sourcerName, // Assuming sourcerName is the user who created the job
        companyName: j.companyName,
        source: 'supabase'
      })));

      setData(prev => ({
        ...prev,
        jobs: loadedJobs,
        candidates: loadedCandidates
      }));

      console.log('✅ User data loaded successfully for role:', userRole);
    } catch (error) {
      console.error('💥 Error loading user data:', error);
    }
  };

  const addJob = (jobData: Omit<Job, 'id' | 'status' | 'sourcerName' | 'completionLink' | 'createdAt' | 'updatedAt'>) => {
    return new Promise<Job>(async (resolve, reject) => {
      try {
        console.log('💼 Adding job to database/storage...');
        
        // Check if Supabase is properly configured
        if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
          console.log('💾 Creating job in local storage (Supabase not configured)...');
          
          const newJob: Job = {
            id: crypto.randomUUID(),
            user_id: user?.id || null, // Changed from client_id to user_id
            companyName: jobData.companyName,
            title: jobData.title,
            description: jobData.description,
            seniorityLevel: jobData.seniorityLevel,
            workArrangement: jobData.workArrangement,
            location: jobData.location,
            salaryRangeMin: jobData.salaryRangeMin,
            salaryRangeMax: jobData.salaryRangeMax,
            keySellingPoints: jobData.keySellingPoints,
            status: 'Unclaimed',
            sourcerName: null,
            completionLink: null,
            candidatesRequested: jobData.candidatesRequested,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          setData(prev => ({
            ...prev,
            jobs: [...prev.jobs, newJob]
          }));
          
          console.log('✅ Job created in local storage:', newJob);
          resolve(newJob);
          return;
        }

        console.log('🗄️ Using Supabase database for job...');
        
        try {
          const jobInsert = {
            user_id: user?.id || null,
            company_name: jobData.companyName,
            title: jobData.title,
            description: jobData.description,
            seniority_level: jobData.seniorityLevel,
            work_arrangement: jobData.workArrangement,
            location: jobData.location,
            salary_range_min: jobData.salaryRangeMin,
            salary_range_max: jobData.salaryRangeMax,
            key_selling_points: jobData.keySellingPoints,
            candidates_requested: jobData.candidatesRequested,
            status: 'Unclaimed'
          };
        
          const { data: insertedJob, error } = await supabase
            .from('jobs')
            .insert(jobInsert)
            .select()
            .single();

          if (error) {
            console.error('❌ Error inserting job into Supabase:', error);
            throw error;
          }

          const newJob: Job = {
            id: insertedJob.id,
            userId: insertedJob.user_id, // Map database user_id to frontend userId
            companyName: insertedJob.company_name,
            title: insertedJob.title,
            description: insertedJob.description,
            seniorityLevel: insertedJob.seniority_level,
            workArrangement: insertedJob.work_arrangement,
            location: insertedJob.location,
            salaryRangeMin: insertedJob.salary_range_min,
            salaryRangeMax: insertedJob.salary_range_max,
            keySellingPoints: insertedJob.key_selling_points,
            status: insertedJob.status,
            sourcerName: insertedJob.sourcer_name,
            completionLink: insertedJob.completion_link,
            candidatesRequested: insertedJob.candidates_requested,
            createdAt: new Date(insertedJob.created_at),
            updatedAt: new Date(insertedJob.updated_at)
          };
          
          setData(prev => ({
            ...prev,
            jobs: [...prev.jobs, newJob]
          }));
          
          console.log('✅ Job created in Supabase:', newJob);
          resolve(newJob);
        } catch (supabaseError) {
          console.error('💥 Supabase job creation failed, falling back to local storage:', supabaseError);
          
          // Fallback to local storage
          const newJob: Job = {
            id: crypto.randomUUID(),
            user_id: user?.id || null, // Changed from client_id to user_id
            companyName: jobData.companyName,
            title: jobData.title,
            description: jobData.description,
            seniorityLevel: jobData.seniorityLevel,
            workArrangement: jobData.workArrangement,
            location: jobData.location,
            salaryRangeMin: jobData.salaryRangeMin,
            salaryRangeMax: jobData.salaryRangeMax,
            keySellingPoints: jobData.keySellingPoints,
            status: 'Unclaimed',
            sourcerName: null,
            completionLink: null,
            candidatesRequested: jobData.candidatesRequested,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          setData(prev => ({
            ...prev,
            jobs: [...prev.jobs, newJob]
          }));
          
          console.log('✅ Job created in local storage (fallback):', newJob);
          resolve(newJob);
        }
        
      } catch (error) {
        console.error('💥 Job submission failed:', error);
        reject(error);
      }
    });
  };

  const addCandidate = (candidateData: Omit<Candidate, 'id' | 'submittedAt'>) => {
    return new Promise<Candidate>(async (resolve, reject) => {
      try {
        const candidateInsert = {
          job_id: candidateData.jobId,
          first_name: candidateData.firstName,
          last_name: candidateData.lastName,
          linkedin_url: candidateData.linkedinUrl,
          headline: candidateData.headline,
          location: candidateData.location,
          experience: candidateData.experience,
          education: candidateData.education,
          skills: candidateData.skills,
          summary: candidateData.summary
        };

        const { data: insertedCandidate, error } = await supabase
          .from('candidates')
          .insert(candidateInsert)
          .select()
          .single();

        if (error) {
          console.error('Error inserting candidate:', error);
          throw error;
        }

        const newCandidate: Candidate = {
          id: insertedCandidate.id,
          jobId: insertedCandidate.job_id,
          firstName: insertedCandidate.first_name,
          lastName: insertedCandidate.last_name,
          linkedinUrl: insertedCandidate.linkedin_url,
          headline: insertedCandidate.headline,
          location: insertedCandidate.location,
          experience: insertedCandidate.experience,
          education: insertedCandidate.education,
          skills: insertedCandidate.skills,
          summary: insertedCandidate.summary,
          submittedAt: new Date(insertedCandidate.submitted_at)
        };
        
        setData(prev => ({
          ...prev,
          candidates: [...prev.candidates, newCandidate]
        }));
        
        resolve(newCandidate);
      } catch (error) {
        reject(error);
      }
    });
  };

  const addCandidatesFromLinkedIn = async (jobId: string, linkedinUrls: string[]): Promise<{ 
    success: boolean; 
    acceptedCount: number; 
    rejectedCount: number; 
    error?: string 
  }> => {
    try {
      // Enforce 50-candidate limit per submission
      if (linkedinUrls.length > 50) {
        return {
          success: false,
          acceptedCount: 0,
          rejectedCount: 0,
          error: 'Cannot submit more than 50 candidates per job submission'
        };
      }

      // Get the job and client to check available credits
      const job = data.jobs.find(j => j.id === jobId);
      if (!job) {
        return {
          success: false,
          acceptedCount: 0,
          rejectedCount: 0,
          error: 'Job not found'
        };
      }

      // The clientId is now part of the job, not directly available here.
      // For now, we'll assume the job's clientId is the source of truth for credits.
      // If a specific client credit limit is needed, it would require a different approach.
      // For this edit, we'll remove the client-specific credit check as per the new_code.

      // Check if client has enough credits
      // This logic needs to be re-evaluated if credits are tied to a specific client.
      // For now, we'll assume a global limit or that credits are managed differently.
      // Since the clients table is removed, this part of the logic is no longer applicable
      // in the same way. We'll proceed assuming a global limit or that credits are
      // implicitly managed by the user's role or a different mechanism.
      // For now, we'll allow any number of candidates to be submitted.

      // Get current accepted candidates for this job to calculate progress
      const currentCandidates = data.candidates.filter(c => c.jobId === jobId);
      const currentAcceptedCount = currentCandidates.length;
      
      // Check for duplicates across all existing candidates
      const existingLinkedInUrls = new Set(
        data.candidates.map(c => c.linkedinUrl.toLowerCase().trim())
      );
      
      const duplicateUrls: string[] = [];
      const uniqueUrls: string[] = [];
      
      linkedinUrls.forEach(url => {
        const normalizedUrl = url.toLowerCase().trim();
        if (existingLinkedInUrls.has(normalizedUrl)) {
          duplicateUrls.push(url);
        } else {
          uniqueUrls.push(url);
        }
      });
      // Use the actual Apify scraping service
      const scrapingResult = await scrapeLinkedInProfiles(uniqueUrls);
      
      if (!scrapingResult.success) {
        return {
          success: false,
          acceptedCount: 0,
          rejectedCount: 0,
          error: scrapingResult.error || 'Failed to scrape LinkedIn profiles'
        };
      }
      
      // Filter candidates based on AI score threshold (60%)
      const acceptedCandidates: Candidate[] = [];
      const rejectedCandidates: any[] = [];
      
      for (const profile of scrapingResult.profiles) {
        // Prepare candidate data for AI scoring
        const candidateData = {
          firstName: profile.firstName || 'N/A',
          lastName: profile.lastName || 'N/A',
          headline: profile.headline,
          location: profile.location,
          experience: profile.experience && profile.experience.length > 0 ? profile.experience : undefined,
          education: profile.education && profile.education.length > 0 ? profile.education : undefined,
          skills: profile.skills && profile.skills.length > 0 ? profile.skills : undefined,
          about: profile.summary
        };
        
        // Generate AI match score
        const matchData = {
          jobTitle: job.title,
          jobDescription: job.description,
          seniorityLevel: job.seniorityLevel,
          keySkills: job.keySellingPoints, // Using selling points as key skills
          candidateData
        };
        
        try {
          const scoreResult = await generateJobMatchScore(matchData);
          
          if (scoreResult.score >= 60) {
            // Accept candidate - meets threshold
            const candidate: Candidate = {
              id: crypto.randomUUID(),
              jobId,
              firstName: candidateData.firstName,
              lastName: candidateData.lastName,
              linkedinUrl: profile.profileUrl || linkedinUrls[scrapingResult.profiles.indexOf(profile)] || '',
              headline: candidateData.headline,
              location: candidateData.location,
              experience: candidateData.experience,
              education: candidateData.education,
              skills: candidateData.skills,
              summary: profile.summary,
              submittedAt: new Date()
            };
            acceptedCandidates.push(candidate);
          } else {
            // Reject candidate - below threshold
            rejectedCandidates.push({
              name: `${candidateData.firstName} ${candidateData.lastName}`,
              score: scoreResult.score,
              reasoning: scoreResult.reasoning
            });
          }
        } catch (error) {
          console.error('Error calculating match score for candidate:', error);
          // On scoring error, reject the candidate to be safe
          rejectedCandidates.push({
            name: `${candidateData.firstName} ${candidateData.lastName}`,
            score: 0,
            reasoning: 'Unable to calculate match score'
          });
        }
      }

      // Only add accepted candidates to the system
      if (acceptedCandidates.length > 0) {
        setData(prev => ({
          ...prev,
          candidates: [...prev.candidates, ...acceptedCandidates]
        }));
      }

      // Deduct credits only for accepted candidates
      // This logic needs to be re-evaluated if credits are tied to a specific client.
      // For now, we'll assume a global limit or that credits are implicitly managed.
      // Since the clients table is removed, this part of the logic is no longer applicable
      // in the same way. We'll proceed assuming a global limit or that credits are
      // implicitly managed by the user's role or a different mechanism.
      // For now, we'll allow any number of candidates to be submitted.

      // Calculate new totals after this submission
      const newTotalAccepted = currentAcceptedCount + acceptedCandidates.length;
      const stillNeeded = Math.max(0, job.candidatesRequested - newTotalAccepted);
      const progressPercentage = Math.round((newTotalAccepted / job.candidatesRequested) * 100);

      // Check if job is now complete
      const isJobComplete = newTotalAccepted >= job.candidatesRequested;

      // Build detailed results message
      let resultMessage = `SUBMISSION RESULTS:\n✅ ${acceptedCandidates.length} candidates ACCEPTED this submission\n`;
      
      if (duplicateUrls.length > 0) {
        resultMessage += `🔄 ${duplicateUrls.length} candidates SKIPPED (duplicates already in system)\n`;
      }
      
      if (rejectedCandidates.length > 0) {
        resultMessage += `❌ ${rejectedCandidates.length} candidates REJECTED (below 60% AI match)\n`;
        const rejectedNames = rejectedCandidates.map(r => `${r.name} (${r.score}%)`).join(', ');
        resultMessage += `\nREJECTED: ${rejectedNames}\n`;
      }
      
      if (duplicateUrls.length > 0) {
        resultMessage += `\nDUPLICATES: ${duplicateUrls.join(', ')}\n`;
      }
      
      resultMessage += `\n📊 JOB PROGRESS: ${newTotalAccepted}/${job.candidatesRequested} candidates (${progressPercentage}% complete)\n\n`;
      resultMessage += isJobComplete 
        ? '🎉 JOB COMPLETED! All required candidates have been submitted.' 
        : `🎯 NEXT STEPS: Submit ${stillNeeded} more quality candidate${stillNeeded !== 1 ? 's' : ''} to complete this job.`;
      
      // Return results with detailed information
      return {
        success: isJobComplete,
        acceptedCount: acceptedCandidates.length,
        rejectedCount: rejectedCandidates.length + duplicateUrls.length,
        error: resultMessage
      };
    } catch (error) {
      console.error('Error adding candidates from LinkedIn:', error);
      return { 
        success: false, 
        acceptedCount: 0,
        rejectedCount: 0,
        error: error instanceof Error ? error.message : 'Failed to scrape LinkedIn profiles' 
      };
    }
  };

  const updateJob = (jobId: string, updates: Partial<Job>) => {
    return new Promise<Job | null>(async (resolve, reject) => {
      try {
        // Convert updates to database format
        const dbUpdates: any = {};
        
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.sourcerName !== undefined) dbUpdates.sourcer_name = updates.sourcerName;
        if (updates.completionLink !== undefined) dbUpdates.completion_link = updates.completionLink;
        
        const { data: updatedJobData, error } = await supabase
          .from('jobs')
          .update(dbUpdates)
          .eq('id', jobId)
          .select()
          .single();

        if (error) {
          console.error('Error updating job:', error);
          throw error;
        }

        const updatedJob: Job = {
          id: updatedJobData.id,
          userId: updatedJobData.user_id, // Map database user_id to frontend userId
          title: updatedJobData.title,
          description: updatedJobData.description,
          seniorityLevel: updatedJobData.seniority_level,
          workArrangement: updatedJobData.work_arrangement,
          location: updatedJobData.location,
          salaryRangeMin: updatedJobData.salary_range_min,
          salaryRangeMax: updatedJobData.salary_range_max,
          keySellingPoints: updatedJobData.key_selling_points,
          status: updatedJobData.status,
          sourcerName: updatedJobData.sourcer_name,
          completionLink: updatedJobData.completion_link,
          candidatesRequested: updatedJobData.candidates_requested,
          createdAt: new Date(updatedJobData.created_at),
          updatedAt: new Date(updatedJobData.updated_at)
        };
        
        setData(prev => ({
          ...prev,
          jobs: prev.jobs.map(job => job.id === jobId ? updatedJob : job)
        }));
        
        resolve(updatedJob);
      } catch (error) {
        reject(error);
      }
    });
  };

  const deleteJob = (jobId: string) => {
    setData(prev => ({
      ...prev,
      jobs: prev.jobs.filter(job => job.id !== jobId)
    }));
  };

  const getCandidatesByJob = (jobId: string) => {
    return data.candidates.filter(candidate => candidate.jobId === jobId);
  };

  const getCandidatesByUser = (userId: string) => {
    return data.candidates.filter(candidate => candidate.jobId && data.jobs.find(job => job.id === candidate.jobId)?.user_id === userId);
  };

  const getJobsByStatus = (status: Job['status']) => {
    return data.jobs.filter(job => job.status === status);
  };

  const getJobById = (jobId: string) => {
    return data.jobs.find(job => job.id === jobId) || null;
  };

  const getJobsByUser = (userId: string) => {
    return data.jobs.filter(job => job.user_id === userId);
  };

  const getTierById = (tierId: string) => {
    return data.tiers.find(tier => tier.id === tierId) || null;
  };

  const resetData = () => {
    if (window.confirm('Are you sure you want to reset ALL data? This will clear all jobs and candidates.')) {
      localStorage.removeItem('jobs');
      localStorage.removeItem('candidates');
      localStorage.removeItem('tiers');
      const freshData = createEmptyData();
      setData(freshData);
      console.log('Data reset successfully');
    }
  };

  const value = {
    jobs: data.jobs,
    candidates: data.candidates,
    tiers: data.tiers,
    addJob,
    addCandidate,
    addCandidatesFromLinkedIn,
    updateJob,
    deleteJob,
    getCandidatesByJob,
    getCandidatesByUser,
    getJobsByStatus,
    getJobById,
    getJobsByUser,
    getTierById,
    resetData
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};