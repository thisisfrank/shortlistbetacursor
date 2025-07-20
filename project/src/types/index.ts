export interface Client {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  hasReceivedFreeShortlist: boolean;
  tierId: string;
  availableCredits: number;
  jobsRemaining: number;
  creditsResetDate: Date;
  createdAt: Date;
}

export interface UserProfile {
  id: string;
  email: string;
  role: 'client' | 'sourcer' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface Tier {
  id: string;
  name: string;
  monthlyJobAllotment: number;
  monthlyCandidateAllotment: number;
  includesCompanyEmails: boolean;
  createdAt: Date;
}

export interface Job {
  id: string;
  userId: string; // ✅ Changed from clientId to userId to match UserProfile system
  companyName: string; // ✅ Added companyName to match database schema
  title: string;
  description: string;
  seniorityLevel: 'Junior' | 'Mid' | 'Senior' | 'Executive';
  workArrangement: 'Remote' | 'On-site' | 'Hybrid';
  location: string;
  salaryRangeMin: number;
  salaryRangeMax: number;
  keySellingPoints: string[];
  status: 'Unclaimed' | 'Claimed' | 'Completed';
  sourcerName: string | null;
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
  | 'company-info' 
  | 'job-details' 
  | 'requirements' 
  | 'summary' 
  | 'confirmation';