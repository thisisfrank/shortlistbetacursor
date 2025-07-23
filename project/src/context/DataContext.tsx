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
  testInsertCandidate: () => Promise<{ success: boolean; data: any; error: any }>;
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

  const emptyJobs: Job[] = [];
  const emptyCandidates: Candidate[] = [];

  return {
    tiers: emptyTiers,
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

  // SIMPLE: One effect, one purpose - load data when user changes
  useEffect(() => {
    if (!user) {
      console.log('🔄 DataContext: User logged out, resetting state');
      setData(createEmptyData());
    } else {
      console.log('✅ DataContext: User logged in, loading data for:', user.email);
      loadUserData(user.email);
    }
  }, [user]);

  // Load real tiers from Supabase
  useEffect(() => {
    const loadTiers = async () => {
      const { data: tiers, error } = await supabase.from('tiers').select('*');
      if (tiers && !error) {
        setData(prev => ({
          ...prev,
          tiers: tiers.map((t: any) => ({
            id: t.id || '',
            name: t.name || '',
            monthlyJobAllotment: t.monthly_job_allotment,
            monthlyCandidateAllotment: t.monthly_candidate_allotment,
            includesCompanyEmails: t.includes_company_emails,
            createdAt: t.created_at ? new Date(t.created_at) : new Date(),
          })),
        }));
      }
    };
    loadTiers();
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
      const loadedJobs = jobsData.map((j: any) => ({
        id: j.id || '',
        userId: j.user_id || '',
        userEmail: j.user_email || '',
        companyName: j.company_name || '',
        title: j.title || '',
        description: j.description || '',
        seniorityLevel: j.seniority_level || '',
        workArrangement: j.work_arrangement || '',
        location: j.location || '',
        salaryRangeMin: j.salary_range_min ?? 0,
        salaryRangeMax: j.salary_range_max ?? 0,
        keySellingPoints: j.key_selling_points || [],
        status: j.status || '',
        sourcerId: j.sourcer_name || null, // Temporarily using sourcer_name to test production schema
        completionLink: j.completion_link || null,
        candidatesRequested: j.candidates_requested ?? 0,
        createdAt: j.created_at ? new Date(j.created_at) : new Date(),
        updatedAt: j.updated_at ? new Date(j.updated_at) : new Date(),
      }));

      const loadedCandidates = candidatesData.map((c: any) => ({
        id: c.id,
        jobId: c.job_id || '',
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
            userId: user?.id || null,
            userEmail: user?.email || null, // Add userEmail for local storage
            companyName: jobData.companyName || '',
            title: jobData.title || '',
            description: jobData.description || '',
            seniorityLevel: jobData.seniorityLevel || '',
            workArrangement: jobData.workArrangement || '',
            location: jobData.location || '',
            salaryRangeMin: jobData.salaryRangeMin ?? 0,
            salaryRangeMax: jobData.salaryRangeMax ?? 0,
            keySellingPoints: jobData.keySellingPoints || [],
            status: 'Unclaimed',
            sourcerId: null,
            completionLink: null,
            candidatesRequested: jobData.candidatesRequested ?? 0,
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
          // Create the job insert object with only the fields we know exist
          const jobInsert: any = {
            user_id: user?.id || null,
            user_email: user?.email || null,
            title: jobData.title || '',
            description: jobData.description || '',
            seniority_level: jobData.seniorityLevel || '',
            work_arrangement: jobData.workArrangement || '',
            location: jobData.location || '',
            salary_range_min: jobData.salaryRangeMin ?? 0,
            salary_range_max: jobData.salaryRangeMax ?? 0,
            key_selling_points: jobData.keySellingPoints || [],
            candidates_requested: jobData.candidatesRequested ?? 0,
            status: 'Unclaimed'
          };

          // Add company_name if it exists in the schema
          if (jobData.companyName) {
            jobInsert.company_name = jobData.companyName;
          }
        
          console.log('📤 Inserting job with data:', jobInsert);
          
          const { data: insertedJob, error } = await supabase
            .from('jobs')
            .insert(jobInsert)
            .select()
            .single();

          if (error) {
            console.error('❌ Error inserting job into Supabase:', error);
            console.error('❌ Error details:', {
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint
            });
            throw error;
          }

          console.log('✅ Job inserted successfully:', insertedJob);

          const newJob: Job = {
            id: insertedJob.id || '',
            userId: insertedJob.user_id || '',
            userEmail: insertedJob.user_email || '',
            companyName: insertedJob.company_name || jobData.companyName || '',
            title: insertedJob.title || '',
            description: insertedJob.description || '',
            seniorityLevel: insertedJob.seniority_level || '',
            workArrangement: insertedJob.work_arrangement || '',
            location: insertedJob.location || '',
            salaryRangeMin: insertedJob.salary_range_min ?? 0,
            salaryRangeMax: insertedJob.salary_range_max ?? 0,
            keySellingPoints: insertedJob.key_selling_points || [],
            status: insertedJob.status || '',
            sourcerId: insertedJob.sourcer_name || null,
            completionLink: insertedJob.completion_link || null,
            candidatesRequested: insertedJob.candidates_requested ?? 0,
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
            userId: user?.id || null,
            userEmail: user?.email || null, // Add userEmail for local storage
            companyName: jobData.companyName || '',
            title: jobData.title || '',
            description: jobData.description || '',
            seniorityLevel: jobData.seniorityLevel || '',
            workArrangement: jobData.workArrangement || '',
            location: jobData.location || '',
            salaryRangeMin: jobData.salaryRangeMin ?? 0,
            salaryRangeMax: jobData.salaryRangeMax ?? 0,
            keySellingPoints: jobData.keySellingPoints || [],
            status: 'Unclaimed',
            sourcerId: null,
            completionLink: null,
            candidatesRequested: jobData.candidatesRequested ?? 0,
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
          job_id: candidateData.jobId || '',
          first_name: candidateData.firstName || '',
          last_name: candidateData.lastName || '',
          linkedin_url: candidateData.linkedinUrl || '',
          headline: candidateData.headline || '',
          location: candidateData.location || '',
          experience: candidateData.experience || [],
          education: candidateData.education || [],
          skills: candidateData.skills || [],
          summary: candidateData.summary || ''
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
          id: insertedCandidate.id || '',
          jobId: insertedCandidate.job_id || '',
          firstName: insertedCandidate.first_name || '',
          lastName: insertedCandidate.last_name || '',
          linkedinUrl: insertedCandidate.linkedin_url || '',
          headline: insertedCandidate.headline || '',
          location: insertedCandidate.location || '',
          experience: insertedCandidate.experience || [],
          education: insertedCandidate.education || [],
          skills: insertedCandidate.skills || [],
          summary: insertedCandidate.summary || '',
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
      
      // Check if we have any unique URLs to process
      if (uniqueUrls.length === 0) {
        return {
          success: false,
          acceptedCount: 0,
          rejectedCount: duplicateUrls.length,
          error: `All ${duplicateUrls.length} LinkedIn profiles have already been submitted for this job. Please try different profiles.`
        };
      }
      
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
          jobTitle: job.title || '',
          jobDescription: job.description || '',
          seniorityLevel: job.seniorityLevel || '',
          keySkills: job.keySellingPoints || [], // Using selling points as key skills
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

      // Save accepted candidates to Supabase and update local state
      if (acceptedCandidates.length > 0) {
        try {
          console.log('💾 Saving candidates to Supabase:', acceptedCandidates.length);
          
          // Prepare candidates for database insertion
          const candidatesToInsert = acceptedCandidates.map(candidate => ({
            job_id: candidate.jobId || '',
            first_name: candidate.firstName || '',
            last_name: candidate.lastName || '',
            linkedin_url: candidate.linkedinUrl || '',
            headline: candidate.headline || '',
            location: candidate.location || '',
            experience: candidate.experience || [],
            education: candidate.education || [],
            skills: candidate.skills || [],
            summary: candidate.summary || ''
          }));
          
          console.log('📤 Inserting candidates to Supabase:', candidatesToInsert.length);
          console.log('📋 Candidate data to insert:', candidatesToInsert);
          
          const { data: insertedCandidates, error: insertError } = await supabase
            .from('candidates')
            .insert(candidatesToInsert)
            .select();
          
          if (insertError) {
            console.error('❌ Error inserting candidates to Supabase:', insertError);
            console.error('❌ Insert error details:', {
              code: insertError.code,
              message: insertError.message,
              details: insertError.details,
              hint: insertError.hint
            });
            throw new Error(`Failed to save candidates: ${insertError.message}`);
          }
          
          console.log('✅ Candidates saved to Supabase:', insertedCandidates.length);
          console.log('📊 Inserted candidates data:', insertedCandidates);
          
          // Update local state with the actual database records
          const savedCandidates = insertedCandidates.map(c => ({
            id: c.id || '',
            jobId: c.job_id || '',
            firstName: c.first_name || '',
            lastName: c.last_name || '',
            linkedinUrl: c.linkedin_url || '',
            headline: c.headline || '',
            location: c.location || '',
            experience: c.experience || [],
            education: c.education || [],
            skills: c.skills || [],
            summary: c.summary || '',
            submittedAt: new Date(c.submitted_at)
          }));
          
          console.log('🔄 Updating local state with saved candidates...');
          setData(prev => ({
            ...prev,
            candidates: [...prev.candidates, ...savedCandidates]
          }));
          console.log('✅ Local state updated successfully');
          
        } catch (error) {
          console.error('💥 Error saving candidates to database:', error);
          throw error;
        }
      } else {
        console.log('ℹ️ No accepted candidates to save');
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
      
      // AUTO-COMPLETE: Mark job as completed if requirements are met
      if (isJobComplete) {
        try {
          console.log('🎯 Auto-completing job:', jobId);
          await updateJob(jobId, {
            status: 'Completed',
            completionLink: `Auto-completed with ${acceptedCandidates.length} candidates submitted`
          });
          console.log('✅ Job auto-completed successfully');
        } catch (completionError) {
          console.error('❌ Error auto-completing job:', completionError);
          // Don't fail the entire operation if auto-completion fails
        }
      }
      
      // CREDIT DEDUCTION: Deduct credits for accepted candidates
      if (acceptedCandidates.length > 0) {
        try {
          console.log('💰 Deducting credits for accepted candidates:', acceptedCandidates.length);
          
          // Get current user profile
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (!currentUser) {
            console.warn('⚠️ No authenticated user found for credit deduction');
          } else {
            // Get current user profile
            const { data: userProfile, error: profileError } = await supabase
              .from('user_profiles')
              .select('available_credits')
              .eq('id', currentUser.id)
              .single();
            
            if (profileError) {
              console.error('❌ Error loading user profile for credit deduction:', profileError);
            } else if (userProfile) {
              const currentCredits = userProfile.available_credits || 0;
              const creditsToDeduct = acceptedCandidates.length;
              const newCredits = Math.max(0, currentCredits - creditsToDeduct);
              
              // Update user profile with new credit count
              const { error: updateError } = await supabase
                .from('user_profiles')
                .update({ available_credits: newCredits })
                .eq('id', currentUser.id);
              
              if (updateError) {
                console.error('❌ Error updating credits:', updateError);
              } else {
                console.log(`✅ Credits deducted: ${currentCredits} → ${newCredits} (${creditsToDeduct} used)`);
                
                // Log transaction to audit trail (optional - won't break if table doesn't exist)
                try {
                  const { error: auditError } = await supabase
                    .from('credit_transactions')
                    .insert({
                      user_id: currentUser.id,
                      transaction_type: 'deduction',
                      amount: creditsToDeduct,
                      description: `Candidate submission for job ${jobId}: ${acceptedCandidates.length} candidates accepted`,
                      job_id: jobId
                    });
                  
                  if (auditError) {
                    console.error('❌ Error logging credit transaction:', auditError);
                    // Don't fail the entire operation if audit logging fails
                    console.log('⚠️ Credit transaction logging failed, but credits were deducted successfully');
                  } else {
                    console.log('📝 Credit transaction logged to audit trail');
                  }
                } catch (auditError) {
                  console.error('❌ Error logging credit transaction:', auditError);
                  console.log('⚠️ Credit transaction logging failed, but credits were deducted successfully');
                }
              }
            }
          }
        } catch (creditError) {
          console.error('❌ Error in credit deduction:', creditError);
          // Don't fail the entire operation if credit deduction fails
        }
      }
      
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
        if (updates.sourcerId !== undefined) dbUpdates.sourcer_name = updates.sourcerId; // Temporarily using sourcer_name to test production schema
        if (updates.completionLink !== undefined) dbUpdates.completion_link = updates.completionLink;
        
        // DEBUG: Log everything before the database call
        console.log('🔍 DEBUG updateJob: Job ID:', jobId);
        console.log('🔍 DEBUG updateJob: Updates received:', updates);
        console.log('🔍 DEBUG updateJob: Database updates to send:', dbUpdates);
        
        // Get current user for debugging
        const { data: { user } } = await supabase.auth.getUser();
        console.log('🔍 DEBUG updateJob: Current auth user:', user);
        
        const { data: updatedJobData, error } = await supabase
          .from('jobs')
          .update(dbUpdates)
          .eq('id', jobId)
          .select()
          .single();

        if (error) {
          console.error('🔍 DEBUG updateJob: Supabase error:', error);
          console.error('🔍 DEBUG updateJob: Error code:', error.code);
          console.error('🔍 DEBUG updateJob: Error message:', error.message);
          console.error('🔍 DEBUG updateJob: Error details:', error.details);
          console.error('🔍 DEBUG updateJob: Error hint:', error.hint);
          throw error;
        }

        const updatedJob: Job = {
          id: updatedJobData.id || '',
          userId: updatedJobData.user_id || '',
          userEmail: updatedJobData.user_email || '',
          companyName: updatedJobData.company_name || '',
          title: updatedJobData.title || '',
          description: updatedJobData.description || '',
          seniorityLevel: updatedJobData.seniority_level || '',
          workArrangement: updatedJobData.work_arrangement || '',
          location: updatedJobData.location || '',
          salaryRangeMin: updatedJobData.salary_range_min ?? 0,
          salaryRangeMax: updatedJobData.salary_range_max ?? 0,
          keySellingPoints: updatedJobData.key_selling_points || [],
          status: updatedJobData.status || '',
          sourcerId: updatedJobData.sourcer_name || null, // Temporarily using sourcer_name to test production schema
          completionLink: updatedJobData.completion_link || null,
          candidatesRequested: updatedJobData.candidates_requested ?? 0,
          createdAt: updatedJobData.created_at ? new Date(updatedJobData.created_at) : new Date(),
          updatedAt: updatedJobData.updated_at ? new Date(updatedJobData.updated_at) : new Date(),
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

  // Test function to manually insert a candidate
  const testInsertCandidate = async () => {
    try {
      console.log('🧪 Testing candidate insertion...');
      
      const testCandidate = {
        job_id: data.jobs[0]?.id || 'test-job-id',
        first_name: 'Test',
        last_name: 'Candidate',
        linkedin_url: 'https://linkedin.com/in/test',
        headline: 'Test Headline',
        location: 'Test Location',
        experience: [{ title: 'Test Role', company: 'Test Company', duration: '1 year' }],
        education: [{ school: 'Test University', degree: 'Test Degree' }],
        skills: ['Test Skill 1', 'Test Skill 2'],
        summary: 'Test summary'
      };
      
      console.log('📤 Inserting test candidate:', testCandidate);
      
      const { data: insertedCandidate, error } = await supabase
        .from('candidates')
        .insert(testCandidate)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Test insertion failed:', error);
        console.error('❌ Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
      } else {
        console.log('✅ Test insertion successful:', insertedCandidate);
      }
      
      return { success: !error, data: insertedCandidate, error };
    } catch (error) {
      console.error('💥 Test insertion error:', error);
      return { success: false, data: null, error };
    }
  };

  // Expose test function globally for console access
  if (typeof window !== 'undefined') {
    (window as any).testCandidateInsertion = testInsertCandidate;
    console.log('🔧 Global test function available: window.testCandidateInsertion()');
  }

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
    resetData,
    testInsertCandidate
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};