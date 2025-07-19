import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Client, Job, Candidate, Tier } from '../types';
import { scrapeLinkedInProfiles } from '../services/apifyService';
import { generateJobMatchScore } from '../services/anthropicService';
import { useAuth } from './AuthContext';

interface DataContextType {
  clients: Client[];
  jobs: Job[];
  candidates: Candidate[];
  tiers: Tier[];
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Client;
  addJob: (job: Omit<Job, 'id' | 'status' | 'sourcerName' | 'completionLink' | 'createdAt' | 'updatedAt'>) => Job;
  addCandidate: (candidate: Omit<Candidate, 'id' | 'submittedAt'>) => Candidate;
  addCandidatesFromLinkedIn: (jobId: string, linkedinUrls: string[]) => Promise<{ 
    success: boolean; 
    acceptedCount: number; 
    rejectedCount: number; 
    error?: string 
  }>;
  updateJob: (jobId: string, updates: Partial<Job>) => Job | null;
  updateClient: (clientId: string, updates: Partial<Client>) => Client | null;
  deleteJob: (jobId: string) => void;
  deleteClient: (clientId: string) => void;
  getCandidatesByJob: (jobId: string) => Candidate[];
  getCandidatesByClient: (clientId: string) => Candidate[];
  getJobsByStatus: (status: Job['status']) => Job[];
  getClientById: (clientId: string) => Client | null;
  getJobById: (jobId: string) => Job | null;
  getJobsByClient: (clientId: string) => Job[];
  getTierById: (tierId: string) => Tier | null;
  checkDuplicateEmail: (email: string) => boolean;
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

// Create dummy data for demonstration
const createDummyData = () => {
  const dummyTiers: Tier[] = [
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

  const dummyClients: Client[] = [
    {
      id: 'client-1',
      companyName: 'TechCorp AI Solutions',
      contactName: 'Sarah Johnson',
      email: 'sarah.johnson@techcorp.ai',
      phone: '+1 (555) 123-4567',
      hasReceivedFreeShortlist: false,
      tierId: 'tier-free',
      availableCredits: 20,
      jobsRemaining: 1,
      creditsResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      createdAt: new Date('2024-01-15')
    }
  ];

  const dummyJobs: Job[] = [
    {
      id: 'job-1',
      clientId: 'client-1',
      title: 'Senior AI Engineer',
      description: `We are seeking a highly skilled Senior AI Engineer to join our cutting-edge AI development team. The ideal candidate will have extensive experience in machine learning, deep learning, and AI model development.

Key Responsibilities:
• Design and implement advanced AI/ML algorithms and models
• Develop and optimize neural networks for various applications
• Work with large datasets and implement data preprocessing pipelines
• Collaborate with cross-functional teams to integrate AI solutions
• Research and implement state-of-the-art AI techniques
• Mentor junior engineers and contribute to technical documentation

Required Skills:
• 5+ years of experience in AI/ML development
• Proficiency in Python, TensorFlow, PyTorch, and scikit-learn
• Strong background in mathematics, statistics, and computer science
• Experience with cloud platforms (AWS, GCP, or Azure)
• Knowledge of MLOps practices and model deployment`,
      seniorityLevel: 'Senior',
      workArrangement: 'Hybrid',
      location: 'San Francisco, CA',
      salaryRangeMin: 150000,
      salaryRangeMax: 220000,
      keySellingPoints: [
        'Competitive salary with equity package',
        'Work on cutting-edge AI projects',
        'Flexible hybrid work arrangement',
        'Comprehensive health and dental coverage',
        'Annual learning and development budget',
        'Stock options and performance bonuses',
        'Collaborative and innovative team environment'
      ],
      status: 'Unclaimed',
      sourcerName: null,
      completionLink: null,
      candidatesRequested: 15,
      createdAt: new Date('2024-01-16'),
      updatedAt: new Date('2024-01-16')
    }
  ];

  const dummyCandidates: Candidate[] = [
    // No dummy candidates - start fresh
  ];

  return {
    tiers: dummyTiers,
    clients: dummyClients,
    jobs: dummyJobs,
    candidates: dummyCandidates
  };
};

// Load data from localStorage if available, otherwise use dummy data
const loadInitialData = () => {
  // Start with dummy data for initial load
  // Real data will be loaded from Supabase in useEffect
  return createDummyData();
};

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [data, setData] = useState(() => loadInitialData());
  const { user } = useAuth();

  // Save data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('tiers', JSON.stringify(data.tiers));
      localStorage.setItem('clients', JSON.stringify(data.clients));
      localStorage.setItem('jobs', JSON.stringify(data.jobs));
      localStorage.setItem('candidates', JSON.stringify(data.candidates));
    } catch (error) {
      console.error('Error saving data to localStorage:', error);
    }
  }, [data]);

  // Handle user changes - reset data when user logs out, load data when user logs in
  useEffect(() => {
    if (!user) {
      // User logged out, reset data to initial dummy state
      console.log('🔄 DataContext: User logged out, resetting state');
      const freshData = createDummyData();
      setData(freshData);
      
      // Also clear localStorage to prevent stale data
      console.log('🧹 DataContext: Clearing localStorage');
      localStorage.removeItem('clients');
      localStorage.removeItem('jobs');
      localStorage.removeItem('candidates');
      localStorage.removeItem('tiers');
    } else {
      // User logged in, load their data from Supabase
      console.log('✅ DataContext: User logged in, loading data for:', user.email);
      loadUserData(user.email);
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

      // Get current user profile to determine role
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No authenticated user found');
        return;
      }

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

      console.log('👤 User profile:', userProfile);
      const userRole = userProfile?.role || 'client';

      // Load clients for this user (only for clients)
      let clientsData = [];
      if (userRole === 'client') {
        const { data: clientData, error: clientsError } = await supabase
          .from('clients')
          .select('*')
          .eq('email', userEmail);

        if (clientsError) {
          console.error('❌ Error loading clients:', clientsError);
          return;
        }
        clientsData = clientData || [];
        console.log('👥 Loaded clients for client user:', clientsData);
      } else {
        // For sourcers and admins, load all clients
        const { data: allClients, error: clientsError } = await supabase
          .from('clients')
          .select('*');

        if (clientsError) {
          console.error('❌ Error loading all clients:', clientsError);
          return;
        }
        clientsData = allClients || [];
        console.log('👥 Loaded all clients for sourcer/admin:', clientsData);
      }

      // Load jobs based on user role
      let jobsData = [];
      if (userRole === 'client') {
        // For clients, only load jobs for their clients
        if (clientsData.length > 0) {
          const clientIds = clientsData.map(c => c.id);
          const { data: clientJobs, error: jobsError } = await supabase
            .from('jobs')
            .select('*')
            .in('client_id', clientIds);

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
      const loadedClients = clientsData.map(c => ({
        id: c.id,
        companyName: c.company_name,
        contactName: c.contact_name,
        email: c.email,
        phone: c.phone,
        hasReceivedFreeShortlist: c.has_received_free_shortlist,
        tierId: 'tier-free', // Default for now
        availableCredits: c.available_credits,
        jobsRemaining: c.jobs_remaining,
        creditsResetDate: new Date(c.credits_reset_date),
        createdAt: new Date(c.created_at)
      }));

      const loadedJobs = jobsData.map(j => ({
        id: j.id,
        clientId: j.client_id,
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
        createdAt: new Date(j.created_at),
        updatedAt: new Date(j.updated_at)
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
        submittedAt: new Date(c.submitted_at)
      }));

      setData(prev => ({
        ...prev,
        clients: loadedClients,
        jobs: loadedJobs,
        candidates: loadedCandidates
      }));

      console.log('✅ User data loaded successfully for role:', userRole);
    } catch (error) {
      console.error('💥 Error loading user data:', error);
    }
  };

  const addClient = (clientData: Omit<Client, 'id' | 'createdAt' | 'tierId' | 'availableCredits' | 'jobsRemaining' | 'creditsResetDate'>) => {
    return new Promise<Client>(async (resolve, reject) => {
      try {
        console.log('👤 Adding client to database/storage...');
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        console.log('🔍 Current user:', user?.email || 'No user');

        const now = new Date();
        const creditsResetDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        // Check if Supabase is configured
        if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
          console.log('💾 Using local storage for client (Supabase not configured)');
          
          const newClient: Client = {
            id: crypto.randomUUID(),
            companyName: clientData.companyName,
            contactName: clientData.contactName,
            email: clientData.email,
            phone: clientData.phone,
            hasReceivedFreeShortlist: clientData.hasReceivedFreeShortlist || false,
            tierId: 'tier-free',
            availableCredits: 20,
            jobsRemaining: 1,
            creditsResetDate,
            createdAt: now
          };
          
          setData(prev => ({
            ...prev,
            clients: [...prev.clients, newClient]
          }));
          
          console.log('✅ Client added to local storage:', newClient);
          resolve(newClient);
          return;
        }

        console.log('🗄️ Using Supabase database for client...');
        
        try {
          const clientInsert = {
            user_id: user?.id || null,
            company_name: clientData.companyName,
            contact_name: clientData.contactName,
            email: clientData.email,
            phone: clientData.phone,
            available_credits: 20, // Free tier default
            jobs_remaining: 1, // Free tier default
            credits_reset_date: creditsResetDate.toISOString(),
            has_received_free_shortlist: clientData.hasReceivedFreeShortlist || false
          };

          const { data: insertedClient, error } = await supabase
            .from('clients')
            .insert(clientInsert)
            .select()
            .single();

          if (error) {
            console.error('❌ Error inserting client into Supabase:', error);
            throw error;
          }

          const newClient: Client = {
            id: insertedClient.id,
            companyName: insertedClient.company_name,
            contactName: insertedClient.contact_name,
            email: insertedClient.email,
            phone: insertedClient.phone,
            hasReceivedFreeShortlist: insertedClient.has_received_free_shortlist,
            tierId: 'tier-free', // Default to free tier
            availableCredits: insertedClient.available_credits,
            jobsRemaining: insertedClient.jobs_remaining,
            creditsResetDate: new Date(insertedClient.credits_reset_date),
            createdAt: new Date(insertedClient.created_at)
          };
          
          setData(prev => ({
            ...prev,
            clients: [...prev.clients, newClient]
          }));
          
          console.log('✅ Client added to Supabase:', newClient);
          resolve(newClient);
        } catch (supabaseError) {
          console.error('💥 Supabase client creation failed, falling back to local storage:', supabaseError);
          
          // Fallback to local storage
          const newClient: Client = {
            id: crypto.randomUUID(),
            companyName: clientData.companyName,
            contactName: clientData.contactName,
            email: clientData.email,
            phone: clientData.phone,
            hasReceivedFreeShortlist: clientData.hasReceivedFreeShortlist || false,
            tierId: 'tier-free',
            availableCredits: 20,
            jobsRemaining: 1,
            creditsResetDate,
            createdAt: now
          };
          
          setData(prev => ({
            ...prev,
            clients: [...prev.clients, newClient]
          }));
          
          console.log('✅ Client added to local storage (fallback):', newClient);
          resolve(newClient);
        }
        
      } catch (error) {
        console.error('💥 Client creation failed completely:', error);
        reject(error);
      }
    });
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
            clientId: jobData.clientId,
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
            client_id: jobData.clientId,
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
            clientId: insertedJob.client_id,
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
            clientId: jobData.clientId,
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

      const client = data.clients.find(c => c.id === job.clientId);
      if (!client) {
        return {
          success: false,
          acceptedCount: 0,
          rejectedCount: 0,
          error: 'Client not found'
        };
      }

      // Check if client has enough credits
      if (client.availableCredits < linkedinUrls.length) {
        return {
          success: false,
          acceptedCount: 0,
          rejectedCount: 0,
          error: `Insufficient credits. Available: ${client.availableCredits}, Required: ${linkedinUrls.length}`
        };
      }

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
      if (acceptedCandidates.length > 0) {
        setData(prev => ({
          ...prev,
          clients: prev.clients.map(c => 
            c.id === client.id 
              ? { ...c, availableCredits: c.availableCredits - acceptedCandidates.length }
              : c
          )
        }));
      }

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
          clientId: updatedJobData.client_id,
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

  const updateClient = (clientId: string, updates: Partial<Client>) => {
    let updatedClient: Client | null = null;
    
    setData(prev => ({
      ...prev,
      clients: prev.clients.map(client => {
        if (client.id === clientId) {
          updatedClient = { ...client, ...updates };
          return updatedClient;
        }
        return client;
      })
    }));
    
    return updatedClient;
  };

  const deleteJob = (jobId: string) => {
    setData(prev => ({
      ...prev,
      jobs: prev.jobs.filter(job => job.id !== jobId)
    }));
  };

  const deleteClient = (clientId: string) => {
    setData(prev => ({
      ...prev,
      clients: prev.clients.filter(client => client.id !== clientId),
      jobs: prev.jobs.filter(job => job.clientId !== clientId),
      candidates: prev.candidates.filter(candidate => {
        const job = prev.jobs.find(j => j.id === candidate.jobId);
        return job ? job.clientId !== clientId : true;
      })
    }));
  };

  const getCandidatesByJob = (jobId: string) => {
    return data.candidates.filter(candidate => candidate.jobId === jobId);
  };

  const getCandidatesByClient = (clientId: string) => {
    const clientJobs = data.jobs.filter(job => job.clientId === clientId);
    const jobIds = clientJobs.map(job => job.id);
    return data.candidates.filter(candidate => jobIds.includes(candidate.jobId));
  };

  const getJobsByStatus = (status: Job['status']) => {
    return data.jobs.filter(job => job.status === status);
  };

  const getClientById = (clientId: string) => {
    return data.clients.find(client => client.id === clientId) || null;
  };

  const getJobById = (jobId: string) => {
    return data.jobs.find(job => job.id === jobId) || null;
  };

  const getJobsByClient = (clientId: string) => {
    return data.jobs.filter(job => job.clientId === clientId);
  };

  const getTierById = (tierId: string) => {
    return data.tiers.find(tier => tier.id === tierId) || null;
  };

  const checkDuplicateEmail = (email: string) => {
    return data.clients.some(client => 
      client.email.toLowerCase() === email.toLowerCase() && 
      client.hasReceivedFreeShortlist
    );
  };

  const resetData = () => {
    if (window.confirm('Are you sure you want to reset ALL data? This will clear all jobs, clients, and candidates.')) {
      localStorage.removeItem('clients');
      localStorage.removeItem('jobs');
      localStorage.removeItem('candidates');
      localStorage.removeItem('tiers');
      const freshData = createDummyData();
      setData(freshData);
      console.log('Data reset successfully');
    }
  };

  const value = {
    tiers: data.tiers,
    clients: data.clients,
    jobs: data.jobs,
    candidates: data.candidates,
    addClient,
    addJob,
    addCandidate,
    addCandidatesFromLinkedIn,
    updateJob,
    updateClient,
    deleteJob,
    deleteClient,
    getCandidatesByJob,
    getCandidatesByClient,
    getJobsByStatus,
    getClientById,
    getJobById,
    getJobsByClient,
    getTierById,
    checkDuplicateEmail,
    resetData
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};