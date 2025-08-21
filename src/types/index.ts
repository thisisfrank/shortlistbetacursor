export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'client' | 'sourcer' | 'admin';
  tierId: string;
  availableCredits?: number;
  creditsResetDate?: Date | null;
  stripeCustomerId?: string | null;
  subscriptionStatus?: string;
  subscriptionPeriodEnd?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  transactionType: 'deduction' | 'addition' | 'reset';
  amount: number;
  description: string;
  jobId?: string | null;
  createdAt: Date;
}

export interface Tier {
  id: string;
  name: string;
  monthlyCandidateAllotment: number;
  includesCompanyEmails: boolean;
  createdAt: Date;
}

export interface Job {
  id: string;
  userId: string; // Changed from clientId to userId
  userEmail?: string; // Email of the user who submitted the job
  companyName: string; // Production uses company_name (string field)
  title: string;
  description: string;
  seniorityLevel: 'Junior' | 'Mid' | 'Senior' | 'Executive';
  workArrangement?: 'Remote' | 'On-site' | 'Hybrid'; // Made optional
  location: string;
  salaryRangeMin: number;
  salaryRangeMax: number;
  mustHaveSkills: string[];
  status: 'Unclaimed' | 'Claimed' | 'Completed';
  sourcerId?: string | null; // UUID of the sourcer who claimed the job (optional for client job submission)
  completionLink: string | null;
  candidatesRequested: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Candidate {
  id: string;
  jobId: string;
  firstName: string;
  lastName: string;
  linkedinUrl: string;
  headline?: string;
  location?: string;
  experience?: Array<{
    title: string;
    company: string;
    duration: string;
  }>;
  education?: Array<{
    school: string;
    degree: string;
  }>;
  skills?: string[];
  summary?: string;
  submittedAt: Date;
}

export type FormStep = 
  | 'job-title'
  | 'job-details' 
  | 'company-info' 
  | 'requirements' 
  | 'summary' 
  | 'confirmation';

export interface UserUsageStats {
  jobsUsed: number;
  jobsLimit: number; // Kept for backward compatibility, always 0
  jobsRemaining: number; // Kept for backward compatibility, always 0
  candidatesUsed: number;
  candidatesLimit: number;
  candidatesRemaining: number;
  creditsResetDate: Date | null;
  tierName: string;
}

export interface Shortlist {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShortlistCandidate {
  id: string;
  shortlistId: string;
  candidateId: string;
  addedAt: Date;
}