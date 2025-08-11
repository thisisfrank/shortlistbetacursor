import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Job, Candidate, Tier, CreditTransaction, UserProfile, Shortlist, ShortlistCandidate } from '../types';
import { scrapeLinkedInProfiles } from '../services/apifyService';
import { generateJobMatchScore } from '../services/anthropicService';
import { useAuth } from './AuthContext';

interface DataContextType {
  jobs: Job[];
  candidates: Candidate[];
  tiers: Tier[];
  creditTransactions: CreditTransaction[];
  shortlists: Shortlist[];
  shortlistCandidates: ShortlistCandidate[];
  addJob: (job: Omit<Job, 'id' | 'status' | 'sourcerName' | 'completionLink' | 'createdAt' | 'updatedAt'>) => Promise<Job>;
  addCandidate: (candidate: Omit<Candidate, 'id' | 'submittedAt'>) => Promise<Candidate>;
  addCandidatesFromLinkedIn: (jobId: string, linkedinUrls: string[]) => Promise<{ 
    success: boolean; 
    acceptedCount: number; 
    rejectedCount: number; 
    error?: string 
  }>;
  updateJob: (jobId: string, updates: Partial<Job>) => Promise<Job | null>;
  getCandidatesByJob: (jobId: string) => Candidate[];
  getCandidatesByUser: (userId: string) => Candidate[];
  getJobsByStatus: (status: Job['status']) => Job[];
  getJobById: (jobId: string) => Job | null;
  getJobsByUser: (userId: string) => Job[];
  getTierById: (tierId: string) => Tier | null;
  getUserProfileById: (userId: string) => Promise<UserProfile | null>;
  // Shortlist functions
  createShortlist: (name: string, description?: string) => Promise<Shortlist>;
  updateShortlist: (shortlistId: string, updates: { name?: string; description?: string }) => Promise<Shortlist | null>;
  deleteShortlist: (shortlistId: string) => Promise<boolean>;
  getShortlistsByUser: (userId: string) => Shortlist[];
  addCandidateToShortlist: (shortlistId: string, candidateId: string) => Promise<boolean>;
  removeCandidateFromShortlist: (shortlistId: string, candidateId: string) => Promise<boolean>;
  getCandidatesByShortlist: (shortlistId: string) => Candidate[];
  getShortlistsForCandidate: (candidateId: string) => Shortlist[];
  resetData: () => void;
  testInsertCandidate: () => Promise<{ success: boolean; data: any; error: any }>;
  recordCreditTransaction: (userId: string | null | undefined, type: 'job' | 'candidate', amount: number, jobId?: string) => Promise<void>;
  loading: boolean;
  loadUserData: (userEmail: string) => Promise<void>;
  loadError: string | null;
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
  const emptyCreditTransactions: CreditTransaction[] = [];
  const emptyTiers: Tier[] = [
    {
      id: 'tier-free',
      name: 'Free',
      monthlyCandidateAllotment: 20,
      includesCompanyEmails: false,
      createdAt: new Date('2024-01-01')
    },
    {
      id: 'tier-1',
      name: 'Tier 1',
      monthlyCandidateAllotment: 50,
      includesCompanyEmails: true,
      createdAt: new Date('2024-01-01')
    },
    {
      id: 'tier-2',
      name: 'Tier 2',
      monthlyCandidateAllotment: 150,
      includesCompanyEmails: true,
      createdAt: new Date('2024-01-01')
    },
    {
      id: 'tier-3',
      name: 'Tier 3',
      monthlyCandidateAllotment: 400,
      includesCompanyEmails: true,
      createdAt: new Date('2024-01-01')
    }
  ];

  const emptyJobs: Job[] = [];
  const emptyCandidates: Candidate[] = [];
  const emptyShortlists: Shortlist[] = [];
  const emptyShortlistCandidates: ShortlistCandidate[] = [];

  return {
    tiers: emptyTiers,
    jobs: emptyJobs,
    candidates: emptyCandidates,
    creditTransactions: emptyCreditTransactions,
    shortlists: emptyShortlists,
    shortlistCandidates: emptyShortlistCandidates
  };
};

// --- Local Storage Fallback Helpers ---
const LOCAL_STORAGE_KEY = 'bolt_data_cache_v1';

function saveDataToCache(data: any) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
      jobs: data.jobs,
      candidates: data.candidates,
      userProfile: data.userProfile || null,
      creditTransactions: data.creditTransactions || [],
      shortlists: data.shortlists || [],
      shortlistCandidates: data.shortlistCandidates || [],
      timestamp: Date.now(),
    }));
  } catch (e) {
    console.warn('Failed to save data to localStorage', e);
  }
}

function loadDataFromCache() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (e) {
    console.warn('Failed to load data from localStorage', e);
    return null;
  }
}

// Load data from localStorage if available, otherwise use empty data
const loadInitialData = () => {
  const cached = loadDataFromCache();
  if (cached) {
    return {
      jobs: cached.jobs || [],
      candidates: cached.candidates || [],
      tiers: createEmptyData().tiers, // Always use fresh tiers
      creditTransactions: cached.creditTransactions || [],
      shortlists: cached.shortlists || [],
      shortlistCandidates: cached.shortlistCandidates || [],
      userProfile: cached.userProfile || null,
    };
  }
  return createEmptyData();
};

// Helper to add a timeout to async operations
function withTimeout(promise: Promise<any>, ms = 10000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out. Please try again.')), ms))
  ]);
}

// Helper to retry supabase.auth.getUser() a few times if user is undefined, with a true hard timeout
async function getUserWithRetry(retries = 5, delay = 200, hardTimeoutMs = 5000): Promise<any> {
  return Promise.race([
    (async () => {
      for (let i = 0; i < retries; i++) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) return user;
        await new Promise(res => setTimeout(res, delay));
      }
      return null;
    })(),
    new Promise((_, reject) => setTimeout(() => reject(new Error('User load timeout')), hardTimeoutMs))
  ]);
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [data, setData] = useState(() => loadInitialData());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { user, userProfile } = useAuth();

  // Helper function to record credit transactions
  const recordCreditTransaction = async (
    userId: string | null | undefined, 
    type: 'job' | 'candidate', 
    amount: number, 
    jobId?: string
  ) => {
    // Early return if no valid userId
    if (!userId) {
      console.warn('⚠️ Cannot record credit transaction: no valid user ID');
      return;
    }

    try {
      // Check if Supabase is configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.log(`💾 Credit transaction (${type}, -${amount}) recorded locally for user ${userId}`);
        return;
      }

      const description = type === 'job' 
        ? 'Job submission deduction' 
        : `Candidate credit deduction (${amount} candidates requested)`;

      const { error } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          transaction_type: 'deduction',
          amount: -amount, // Negative for deductions
          description,
          job_id: jobId || null
        });

      if (error) {
        console.error('❌ Error recording credit transaction:', error);
      } else {
        console.log(`✅ Credit transaction recorded: ${type} -${amount} for user ${userId}`);
      }
    } catch (error) {
      console.error('💥 Failed to record credit transaction:', error);
    }
  };

  // SIMPLE: One effect, one purpose - load data when user changes
  useEffect(() => {
    if (!user) {
      console.log('🔄 DataContext: User logged out, resetting state');
      setData(createEmptyData());
      setLoading(false);
    } else {
      console.log('✅ DataContext: User logged in, loading data for:', user.email);
      setLoading(true);
      if (typeof user.email === 'string') {
        loadUserData(user.email).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }
  }, [user]);

  // Removed window storage reload effect to prevent unnecessary reloads and hanging after tab switches
  // useEffect(() => {
  //   const handleStorage = async (event: StorageEvent) => {
  //     // Supabase uses 'supabase.auth.token' as the key for session
  //     if (event.key && event.key.includes('supabase.auth.token')) {
  //       // Rehydrate session from localStorage
  //       const { data: { session } } = await supabase.auth.getSession();
  //       // If session exists, reload user data
  //       if (session && session.user && session.user.email) {
  //         await loadUserData(session.user.email);
  //       } else {
  //         // If no session, reset data
  //         setData(createEmptyData());
  //       }
  //     }
  //   };
  //   window.addEventListener('storage', handleStorage);
  //   return () => window.removeEventListener('storage', handleStorage);
  // }, []);

  // Removed window focus reload effect to prevent data loss in modals
  // useEffect(() => {
  //   const handleFocus = async () => {
  //     const { data: { session } } = await supabase.auth.getSession();
  //     if (session && session.user && session.user.email) {
  //       await loadUserData(session.user.email);
  //     } else {
  //       setData(createEmptyData());
  //     }
  //   };
  //   window.addEventListener('focus', handleFocus);
  //   return () => window.removeEventListener('focus', handleFocus);
  // }, []);

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
      setLoadError(null);
      console.log('📥 Loading user data from Supabase for:', userEmail);
      
      // Check if Supabase is configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.log('⚠️ Supabase not configured, using local data');
        return;
      }

      console.log('🔍 Step 1: Getting current user...');
      // Use retry logic here
      let user: any = null;
      try {
        user = await getUserWithRetry();
      } catch (timeoutError) {
        console.log('❌ User load timeout:', timeoutError);
        setLoading(false);
        setLoadError('Could not load your session (timeout). Please refresh or sign in again.');
        return;
      }
      if (!user) {
        console.log('❌ No authenticated user found after retry');
        setLoading(false);
        setLoadError('Could not load your session. Please refresh or sign in again.');
        return;
      }
      console.log('✅ Step 1 complete: User found:', user.email);

      console.log('🔍 Step 2: Loading user profile...');
      // Get user profile to determine role
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id || '')
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
      let jobsData: any[] = [];
      if (userRole === 'client') {
        // For clients, only load jobs for their clients
        if (user?.id) {
          const { data: clientJobs, error: jobsError } = await supabase
            .from('jobs')
            .select('*')
            .eq('user_id', user.id || '');

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
      let candidatesData: any[] = [];
      if (jobsData.length > 0) {
        const jobIds = jobsData.map((j: any) => j.id);
        
        const { data: jobCandidates, error: candidatesError } = await supabase
          .from('candidates')
          .select('*')
          .in('job_id', jobIds as string[]);

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
        location: j.location || '',
        salaryRangeMin: j.salary_range_min ?? 0,
        salaryRangeMax: j.salary_range_max ?? 0,
                    mustHaveSkills: j.must_have_skills || [],
        status: j.status || '',
        sourcerId: j.sourcer_name || null, // Temporarily using sourcer_name to test production schema
        completionLink: j.completion_link || null,
        candidatesRequested: j.candidates_requested ?? 0,
        createdAt: j.created_at ? new Date(j.created_at) : new Date(),
        updatedAt: j.updated_at ? new Date(j.updated_at) : new Date(),
      }));

      // console.log('🔍 Debug: Raw job data from database:', jobsData);
      // console.log('🔍 Debug: Processed jobs with titles:', loadedJobs.map(job => ({ id: job.id, title: job.title, hasTitle: !!job.title })));

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

      // Load credit transactions for the user
      const { data: creditTransactionsData, error: creditTransactionsError } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userProfile.id || '');

      const loadedCreditTransactions: CreditTransaction[] = creditTransactionsData?.map((ct: any) => ({
        id: ct.id,
        userId: ct.user_id,
        transactionType: ct.transaction_type,
        amount: ct.amount,
        description: ct.description,
        jobId: ct.job_id,
        createdAt: new Date(ct.created_at)
      })) || [];

      if (creditTransactionsError) {
        console.warn('⚠️ Error loading credit transactions:', creditTransactionsError);
      }

      // Load shortlists for the user
      const { data: shortlistsData, error: shortlistsError } = await supabase
        .from('shortlists')
        .select('*')
        .eq('user_id', user.id || '');

      const loadedShortlists: Shortlist[] = shortlistsData?.map((sl: any) => ({
        id: sl.id,
        userId: sl.user_id,
        name: sl.name,
        description: sl.description,
        createdAt: new Date(sl.created_at),
        updatedAt: new Date(sl.updated_at)
      })) || [];

      if (shortlistsError) {
        console.warn('⚠️ Error loading shortlists:', shortlistsError);
      }

      // Load shortlist candidates
      const shortlistIds = loadedShortlists.map(sl => sl.id);
      let loadedShortlistCandidates: ShortlistCandidate[] = [];
      
      if (shortlistIds.length > 0) {
        const { data: shortlistCandidatesData, error: shortlistCandidatesError } = await supabase
          .from('shortlist_candidates')
          .select('*')
          .in('shortlist_id', shortlistIds);

        loadedShortlistCandidates = shortlistCandidatesData?.map((sc: any) => ({
          id: sc.id,
          shortlistId: sc.shortlist_id,
          candidateId: sc.candidate_id,
          addedAt: new Date(sc.added_at)
        })) || [];

        if (shortlistCandidatesError) {
          console.warn('⚠️ Error loading shortlist candidates:', shortlistCandidatesError);
        }
      }

      setData(prev => ({
        ...prev,
        jobs: loadedJobs,
        candidates: loadedCandidates,
        creditTransactions: loadedCreditTransactions,
        shortlists: loadedShortlists,
        shortlistCandidates: loadedShortlistCandidates,
        userProfile: userProfile || null,
      }));
      // Save to cache
      saveDataToCache({
        jobs: loadedJobs,
        candidates: loadedCandidates,
        creditTransactions: loadedCreditTransactions,
        shortlists: loadedShortlists,
        shortlistCandidates: loadedShortlistCandidates,
        userProfile: userProfile || null,
      });

      console.log('✅ User data loaded successfully for role:', userRole);
    } catch (error) {
      console.error('💥 Error loading user data:', error);
      setLoading(false);
      setLoadError('An unexpected error occurred while loading your data. Please try again.');
      // On error, optionally load from cache if available
      const cached = loadDataFromCache();
      if (cached) {
        setData(prev => ({
          ...prev,
          jobs: cached.jobs || [],
          candidates: cached.candidates || [],
          creditTransactions: cached.creditTransactions || [],
          shortlists: cached.shortlists || [],
          shortlistCandidates: cached.shortlistCandidates || [],
          userProfile: cached.userProfile || null,
        }));
      }
    }
  };

  const addJob = (jobData: Omit<Job, 'id' | 'status' | 'sourcerName' | 'completionLink' | 'createdAt' | 'updatedAt'>) => {
    return new Promise<Job>(async (resolve, reject) => {
      try {
        console.log('💼 Adding job to database/storage...');
        
        // Add timeout to prevent hanging
        const timeoutId = setTimeout(() => {
          reject(new Error('Job submission timed out after 30 seconds. Please check your internet connection and try again.'));
        }, 30000);
        
        // Check if Supabase is properly configured
        if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
          clearTimeout(timeoutId);
          console.log('💾 Creating job in local storage (Supabase not configured)...');
          
          const newJob: Job = {
            id: crypto.randomUUID(),
            userId: user?.id || '',
            userEmail: user?.email || '',
            companyName: jobData.companyName || '',
            title: jobData.title || '',
            description: jobData.description || '',
            seniorityLevel: jobData.seniorityLevel || '',
            location: jobData.location || '',
            salaryRangeMin: jobData.salaryRangeMin ?? 0,
            salaryRangeMax: jobData.salaryRangeMax ?? 0,
            mustHaveSkills: jobData.mustHaveSkills || [],
            status: 'Unclaimed',
            sourcerId: null,
            completionLink: null,
            candidatesRequested: jobData.candidatesRequested ?? 0,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          setData(prev => {
            const newData = { ...prev, jobs: [...prev.jobs, newJob] };
            saveDataToCache(newData);
            return newData;
          });
          
          console.log('✅ Job created in local storage:', newJob);
          
          // Record job credit deduction (non-blocking)
          recordCreditTransaction(user?.id, 'job', 1, newJob.id).catch(error => 
            console.warn('⚠️ Job credit transaction failed but job was created:', error)
          );

          // Record candidate credit deduction for requested candidates (non-blocking)
          const requestedCandidates = jobData.candidatesRequested || 1;
          recordCreditTransaction(user?.id, 'candidate', requestedCandidates, newJob.id).catch(error => 
            console.warn('⚠️ Candidate credit transaction failed but job was created:', error)
          );
          
          resolve(newJob);
          return;
        }

        console.log('🗄️ Using Supabase database for job...');
        
        try {
          // Create the job insert object with only the fields we know exist
          const jobInsert: any = {
            user_id: user?.id || '',
            user_email: user?.email || '',
            title: jobData.title || '',
            description: jobData.description || '',
            seniority_level: jobData.seniorityLevel || '',
            work_arrangement: jobData.location === 'Remote' ? 'Remote' : 'On-site', // Derive from location
            location: jobData.location || '',
            salary_range_min: jobData.salaryRangeMin ?? 0,
            salary_range_max: jobData.salaryRangeMax ?? 0,
            must_have_skills: jobData.mustHaveSkills || [],
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

          console.log('🔍 Supabase response:', { data: insertedJob, error });

          if (error) {
            console.error('❌ Error inserting job into Supabase:', error);
            console.error('❌ Error details:', {
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint
            });
            clearTimeout(timeoutId);
            throw error;
          }

          console.log('✅ Job inserted successfully:', insertedJob);
          clearTimeout(timeoutId);

          const newJob: Job = {
            id: insertedJob.id || '',
            userId: insertedJob.user_id || '',
            userEmail: insertedJob.user_email || '',
            companyName: insertedJob.company_name || jobData.companyName || '',
            title: insertedJob.title || '',
            description: insertedJob.description || '',
            seniorityLevel: insertedJob.seniority_level || '',
            location: insertedJob.location || '',
            salaryRangeMin: insertedJob.salary_range_min ?? 0,
            salaryRangeMax: insertedJob.salary_range_max ?? 0,
            mustHaveSkills: insertedJob.must_have_skills || [],
            status: insertedJob.status || '',
            sourcerId: insertedJob.sourcer_name || null,
            completionLink: insertedJob.completion_link || null,
            candidatesRequested: insertedJob.candidates_requested ?? 0,
            createdAt: new Date(insertedJob.created_at),
            updatedAt: new Date(insertedJob.updated_at)
          };
          
          setData(prev => {
            const newData = { ...prev, jobs: [...prev.jobs, newJob] };
            saveDataToCache(newData);
            return newData;
          });
          
          console.log('✅ Job created in Supabase:', newJob);
          
          // Record job credit deduction (non-blocking)
          recordCreditTransaction(user?.id, 'job', 1, newJob.id).catch(error => 
            console.warn('⚠️ Job credit transaction failed but job was created:', error)
          );

          // Record candidate credit deduction for requested candidates (non-blocking)
          const requestedCandidates = insertedJob.candidates_requested || 1;
          recordCreditTransaction(user?.id, 'candidate', requestedCandidates, newJob.id).catch(error => 
            console.warn('⚠️ Candidate credit transaction failed but job was created:', error)
          );
          
          resolve(newJob);
        } catch (supabaseError) {
          console.error('💥 Supabase job creation failed, falling back to local storage:', supabaseError);
          clearTimeout(timeoutId);
          
          // Fallback to local storage
          const newJob: Job = {
            id: crypto.randomUUID(),
            userId: user?.id || '',
            userEmail: user?.email || '',
            companyName: jobData.companyName || '',
            title: jobData.title || '',
            description: jobData.description || '',
            seniorityLevel: jobData.seniorityLevel || '',
            location: jobData.location || '',
            salaryRangeMin: jobData.salaryRangeMin ?? 0,
            salaryRangeMax: jobData.salaryRangeMax ?? 0,
            mustHaveSkills: jobData.mustHaveSkills || [],
            status: 'Unclaimed',
            sourcerId: null,
            completionLink: null,
            candidatesRequested: jobData.candidatesRequested ?? 0,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          setData(prev => {
            const newData = { ...prev, jobs: [...prev.jobs, newJob] };
            saveDataToCache(newData);
            return newData;
          });
          
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
        
        setData(prev => {
          const newData = { ...prev, candidates: [...prev.candidates, newCandidate] };
          saveDataToCache(newData);
          return newData;
        });
        
        resolve(newCandidate);
      } catch (error) {
        reject(error);
      }
    });
  };

  // Step 1: Add a bypass flag at the top of the file
  const BYPASS_AI_SCORING = true; // TODO: Set to false in production or make configurable

  const addCandidatesFromLinkedIn = async (jobId: string, linkedinUrls: string[]): Promise<{ 
    success: boolean; 
    acceptedCount: number; 
    rejectedCount: number; 
    isJobCompleted?: boolean;
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
      const job = data.jobs.find((j: Job) => j.id === jobId);
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
      const currentCandidates = data.candidates.filter((c: Candidate) => c.jobId === jobId);
      const currentAcceptedCount = currentCandidates.length;
      
      // Check for duplicates across all existing candidates
      const existingLinkedInUrls = new Set(
        data.candidates.map((c: Candidate) => c.linkedinUrl.toLowerCase().trim())
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
      
      // Step 1 & 2: Bypass AI scoring if flag is set, or fallback to always accept on error
      const acceptedCandidates: Candidate[] = [];
      const rejectedCandidates: any[] = [];
      for (const profile of scrapingResult.profiles) {
        // Fix for string | undefined and string | null issues in candidate mapping and job mapping
        const candidateData = {
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          headline: profile.headline || '',
          location: profile.location || '',
          experience: (profile.experience && profile.experience.length > 0 ? profile.experience : undefined),
          education: (profile.education && profile.education.length > 0 ? profile.education : undefined),
          skills: (profile.skills && profile.skills.length > 0 ? profile.skills : undefined),
          about: profile.summary || ''
        };
        if (BYPASS_AI_SCORING) {
          // Accept all candidates, skip AI
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
          try {
            const matchData = {
              jobTitle: job.title || '',
              jobDescription: job.description || '',
              seniorityLevel: job.seniorityLevel || '',
              keySkills: job.keySellingPoints || [],
              candidateData
            };
            const scoreResult = await generateJobMatchScore(matchData);
            if (scoreResult.score >= 50) {
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
            // Step 2: On AI scoring error, accept candidate and log warning
            console.warn('AI scoring failed, auto-accepting candidate:', error);
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
          }
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
          
          // DEBUG LOG: Before insert
          console.log('About to insert candidates to Supabase:', candidatesToInsert);
          const { data: insertedCandidates, error: insertError } = await withTimeout(
            supabase.from('candidates').insert(candidatesToInsert).select(),
            10000
          );
          // DEBUG LOG: After insert
          console.log('Insert result:', { insertedCandidates, insertError });
          
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
          const savedCandidates = (insertedCandidates || []).map((c: any) => ({
            id: (c.id || ''),
            jobId: (c.job_id || ''),
            firstName: (c.first_name || ''),
            lastName: (c.last_name || ''),
            linkedinUrl: (c.linkedin_url || ''),
            headline: (c.headline || ''),
            location: (c.location || ''),
            experience: (c.experience || []),
            education: (c.education || []),
            skills: (c.skills || []),
            summary: (c.summary || ''),
            submittedAt: new Date(c.submitted_at || '')
          }));
          
          console.log('🔄 Updating local state with saved candidates...');
          setData(prev => {
            const newData = { ...prev, candidates: [...prev.candidates, ...savedCandidates] };
            saveDataToCache(newData);
            return newData;
          });
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
      // const isJobComplete = newTotalAccepted >= job.candidatesRequested;

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
      resultMessage += `🎯 NEXT STEPS: Submit ${stillNeeded} more quality candidate${stillNeeded !== 1 ? 's' : ''} to complete this job.`;

      // REMOVE AUTO-COMPLETE: Do not mark job as completed automatically here
      // if (isJobComplete) {
      //   try {
      //     console.log('🎯 Auto-completing job:', jobId);
      //     await updateJob(jobId, {
      //       status: 'Completed',
      //       completionLink: `Auto-completed with ${acceptedCandidates.length} candidates submitted`
      //     });
      //     console.log('✅ Job auto-completed successfully');
      //   } catch (completionError) {
      //     console.error('❌ Error auto-completing job:', completionError);
      //     // Don't fail the entire operation if auto-completion fails
      //   }
      // }
      
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
              .eq('id', currentUser.id || '')
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
                .eq('id', currentUser.id || '');
              
              if (updateError) {
                console.error('❌ Error updating credits:', updateError);
              } else {
                console.log(`✅ Credits deducted: ${currentCredits} → ${newCredits} (${creditsToDeduct} used)`);
                
                // Log transaction to audit trail (optional - won't break if table doesn't exist)
                try {
                  const { error: auditError } = await supabase
                    .from('credit_transactions')
                    .insert({
                      user_id: currentUser.id || '',
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
        success: true,
        acceptedCount: acceptedCandidates.length,
        rejectedCount: rejectedCandidates.length + duplicateUrls.length,
        isJobCompleted: false, // Always false here as auto-completion is removed
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
                      mustHaveSkills: updatedJobData.must_have_skills || [],
          status: updatedJobData.status || '',
          sourcerId: updatedJobData.sourcer_name || null, // Temporarily using sourcer_name to test production schema
          completionLink: updatedJobData.completion_link || null,
          candidatesRequested: updatedJobData.candidates_requested ?? 0,
          createdAt: updatedJobData.created_at ? new Date(updatedJobData.created_at) : new Date(),
          updatedAt: updatedJobData.updated_at ? new Date(updatedJobData.updated_at) : new Date(),
        };
        
        setData(prev => {
          const newData = { ...prev, jobs: prev.jobs.map((job: Job) => job.id === jobId ? updatedJob : job) };
          saveDataToCache(newData);
          return newData;
        });
        
        resolve(updatedJob);
      } catch (error) {
        reject(error);
      }
    });
  };



  const getCandidatesByJob = (jobId: string): Candidate[] => {
    return data.candidates.filter((c: Candidate) => (c.jobId || '') === jobId);
  };

  const getCandidatesByUser = (userId: string) => {
    return data.candidates.filter((candidate: Candidate) => candidate.jobId && data.jobs.find((job: Job) => job.id === candidate.jobId)?.user_id === userId);
  };

  const getJobsByStatus = (status: Job['status']) => {
    return data.jobs.filter((job: Job) => job.status === status);
  };

  const getJobById = (jobId: string): Job | null => {
    return data.jobs.find((j: Job) => (j.id || '') === jobId) || null;
  };

  const getJobsByUser = (userId: string): Job[] => {
    return data.jobs.filter((j: Job) => (j.userId || '') === userId);
  };

  const getTierById = (tierId: string): Tier | null => {
    return data.tiers.find((t: Tier) => (t.id || '') === tierId) || null;
  };

  const getUserProfileById = async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile by ID:', error);
      return null;
    }
    return data || null;
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

  // Shortlist functions
  const createShortlist = async (name: string, description?: string): Promise<Shortlist> => {
    if (!user?.id) {
      throw new Error('User must be authenticated to create shortlists');
    }

    const { data: newShortlist, error } = await supabase
      .from('shortlists')
      .insert({
        user_id: user.id,
        name,
        description
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating shortlist:', error);
      throw error;
    }

    const shortlist: Shortlist = {
      id: newShortlist.id,
      userId: newShortlist.user_id,
      name: newShortlist.name,
      description: newShortlist.description,
      createdAt: new Date(newShortlist.created_at),
      updatedAt: new Date(newShortlist.updated_at)
    };

    setData(prev => ({
      ...prev,
      shortlists: [...prev.shortlists, shortlist]
    }));

    return shortlist;
  };

  const updateShortlist = async (shortlistId: string, updates: { name?: string; description?: string }): Promise<Shortlist | null> => {
    const { data: updatedShortlist, error } = await supabase
      .from('shortlists')
      .update(updates)
      .eq('id', shortlistId)
      .select()
      .single();

    if (error) {
      console.error('Error updating shortlist:', error);
      return null;
    }

    const shortlist: Shortlist = {
      id: updatedShortlist.id,
      userId: updatedShortlist.user_id,
      name: updatedShortlist.name,
      description: updatedShortlist.description,
      createdAt: new Date(updatedShortlist.created_at),
      updatedAt: new Date(updatedShortlist.updated_at)
    };

    setData(prev => ({
      ...prev,
      shortlists: prev.shortlists.map(sl => sl.id === shortlistId ? shortlist : sl)
    }));

    return shortlist;
  };

  const deleteShortlist = async (shortlistId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('shortlists')
      .delete()
      .eq('id', shortlistId);

    if (error) {
      console.error('Error deleting shortlist:', error);
      return false;
    }

    setData(prev => ({
      ...prev,
      shortlists: prev.shortlists.filter(sl => sl.id !== shortlistId),
      shortlistCandidates: prev.shortlistCandidates.filter(sc => sc.shortlistId !== shortlistId)
    }));

    return true;
  };

  const getShortlistsByUser = (userId: string): Shortlist[] => {
    return data.shortlists.filter(sl => sl.userId === userId);
  };

  const addCandidateToShortlist = async (shortlistId: string, candidateId: string): Promise<boolean> => {
    const { data: newShortlistCandidate, error } = await supabase
      .from('shortlist_candidates')
      .insert({
        shortlist_id: shortlistId,
        candidate_id: candidateId
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        console.log('Candidate already in shortlist');
        return true;
      }
      console.error('Error adding candidate to shortlist:', error);
      return false;
    }

    const shortlistCandidate: ShortlistCandidate = {
      id: newShortlistCandidate.id,
      shortlistId: newShortlistCandidate.shortlist_id,
      candidateId: newShortlistCandidate.candidate_id,
      addedAt: new Date(newShortlistCandidate.added_at)
    };

    setData(prev => ({
      ...prev,
      shortlistCandidates: [...prev.shortlistCandidates, shortlistCandidate]
    }));

    return true;
  };

  const removeCandidateFromShortlist = async (shortlistId: string, candidateId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('shortlist_candidates')
      .delete()
      .eq('shortlist_id', shortlistId)
      .eq('candidate_id', candidateId);

    if (error) {
      console.error('Error removing candidate from shortlist:', error);
      return false;
    }

    setData(prev => ({
      ...prev,
      shortlistCandidates: prev.shortlistCandidates.filter(sc => 
        !(sc.shortlistId === shortlistId && sc.candidateId === candidateId)
      )
    }));

    return true;
  };

  const getCandidatesByShortlist = (shortlistId: string): Candidate[] => {
    const shortlistCandidateIds = data.shortlistCandidates
      .filter(sc => sc.shortlistId === shortlistId)
      .map(sc => sc.candidateId);
    
    return data.candidates.filter(candidate => 
      shortlistCandidateIds.includes(candidate.id)
    );
  };

  const getShortlistsForCandidate = (candidateId: string): Shortlist[] => {
    const shortlistIds = data.shortlistCandidates
      .filter(sc => sc.candidateId === candidateId)
      .map(sc => sc.shortlistId);
    
    return data.shortlists.filter(shortlist => 
      shortlistIds.includes(shortlist.id)
    );
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
    creditTransactions: data.creditTransactions,
    shortlists: data.shortlists,
    shortlistCandidates: data.shortlistCandidates,
    loading,
    loadError,
    addJob,
    addCandidate,
    addCandidatesFromLinkedIn,
    updateJob,
    getCandidatesByJob,
    getCandidatesByUser,
    getJobsByStatus,
    getJobById,
    getJobsByUser,
    getTierById,
    getUserProfileById,
    createShortlist,
    updateShortlist,
    deleteShortlist,
    getShortlistsByUser,
    addCandidateToShortlist,
    removeCandidateFromShortlist,
    getCandidatesByShortlist,
    getShortlistsForCandidate,
    resetData,
    testInsertCandidate,
    recordCreditTransaction,
    loadUserData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};