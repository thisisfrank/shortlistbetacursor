/**
 * localStorage Draft Management for Candidate Submissions
 * 
 * This utility manages draft candidate submissions so that:
 * 1. Work is not lost when switching browser tabs
 * 2. Sourcers can review candidates before final submission
 * 3. Drafts are persisted across sessions
 */

import { Candidate } from '../types';

export interface DraftCandidate {
  candidate: Omit<Candidate, 'id' | 'submittedAt'>;
  score: number;
  reasoning: string;
  linkedinUrl: string;
  tempId: string; // Temporary ID for tracking in UI
}

export interface CandidateDraft {
  jobId: string;
  processedCandidates: DraftCandidate[];
  rejectedCandidates: Array<{
    name: string;
    score: number;
    reasoning: string;
    linkedinUrl: string;
  }>;
  failedScrapes: number;
  timestamp: number; // When draft was created
  lastSaved: number; // When draft was last updated
}

const DRAFT_KEY_PREFIX = 'candidate_draft_';
const DRAFT_EXPIRY_HOURS = 48; // Drafts expire after 48 hours

/**
 * Get the localStorage key for a specific job
 */
function getDraftKey(jobId: string): string {
  return `${DRAFT_KEY_PREFIX}${jobId}`;
}

/**
 * Check if a draft has expired
 */
function isDraftExpired(draft: CandidateDraft): boolean {
  const expiryTime = draft.timestamp + (DRAFT_EXPIRY_HOURS * 60 * 60 * 1000);
  return Date.now() > expiryTime;
}

/**
 * Save a draft to localStorage
 */
export function saveDraft(draft: CandidateDraft): boolean {
  try {
    const key = getDraftKey(draft.jobId);
    const draftWithTimestamp = {
      ...draft,
      lastSaved: Date.now()
    };
    
    localStorage.setItem(key, JSON.stringify(draftWithTimestamp));
    console.log(`💾 Draft saved for job ${draft.jobId}: ${draft.processedCandidates.length} candidates`);
    return true;
  } catch (error) {
    console.error('❌ Failed to save draft to localStorage:', error);
    // LocalStorage might be full or disabled
    return false;
  }
}

/**
 * Load a draft from localStorage
 */
export function loadDraft(jobId: string): CandidateDraft | null {
  try {
    const key = getDraftKey(jobId);
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return null;
    }
    
    const draft: CandidateDraft = JSON.parse(stored);
    
    // Check if draft is expired
    if (isDraftExpired(draft)) {
      console.log(`⏰ Draft expired for job ${jobId}, removing...`);
      clearDraft(jobId);
      return null;
    }
    
    console.log(`📂 Draft loaded for job ${jobId}: ${draft.processedCandidates.length} candidates`);
    return draft;
  } catch (error) {
    console.error('❌ Failed to load draft from localStorage:', error);
    return null;
  }
}

/**
 * Clear a draft from localStorage
 */
export function clearDraft(jobId: string): void {
  try {
    const key = getDraftKey(jobId);
    localStorage.removeItem(key);
    console.log(`🗑️ Draft cleared for job ${jobId}`);
  } catch (error) {
    console.error('❌ Failed to clear draft from localStorage:', error);
  }
}

/**
 * Check if a draft exists for a job
 */
export function hasDraft(jobId: string): boolean {
  const draft = loadDraft(jobId);
  return draft !== null && draft.processedCandidates.length > 0;
}

/**
 * Add candidates to an existing draft (merging)
 */
export function addToDraft(
  jobId: string,
  newProcessedCandidates: DraftCandidate[],
  newRejectedCandidates: Array<{
    name: string;
    score: number;
    reasoning: string;
    linkedinUrl: string;
  }>,
  failedScrapes: number
): boolean {
  try {
    const existingDraft = loadDraft(jobId);
    
    if (existingDraft) {
      // Merge with existing draft, avoiding duplicates by LinkedIn URL
      const existingProcessedUrls = new Set(
        existingDraft.processedCandidates.map(c => c.linkedinUrl.toLowerCase())
      );
      
      const uniqueNewCandidates = newProcessedCandidates.filter(
        c => !existingProcessedUrls.has(c.linkedinUrl.toLowerCase())
      );
      
      // Also check for duplicate rejected candidates by LinkedIn URL
      const existingRejectedUrls = new Set(
        existingDraft.rejectedCandidates.map(c => c.linkedinUrl.toLowerCase())
      );
      
      const uniqueNewRejectedCandidates = newRejectedCandidates.filter(
        c => !existingRejectedUrls.has(c.linkedinUrl.toLowerCase())
      );
      
      const mergedDraft: CandidateDraft = {
        jobId,
        processedCandidates: [
          ...existingDraft.processedCandidates,
          ...uniqueNewCandidates
        ],
        rejectedCandidates: [
          ...existingDraft.rejectedCandidates,
          ...uniqueNewRejectedCandidates
        ],
        failedScrapes: existingDraft.failedScrapes + failedScrapes,
        timestamp: existingDraft.timestamp, // Keep original timestamp
        lastSaved: Date.now()
      };
      
      return saveDraft(mergedDraft);
    } else {
      // Create new draft
      const newDraft: CandidateDraft = {
        jobId,
        processedCandidates: newProcessedCandidates,
        rejectedCandidates: newRejectedCandidates,
        failedScrapes,
        timestamp: Date.now(),
        lastSaved: Date.now()
      };
      
      return saveDraft(newDraft);
    }
  } catch (error) {
    console.error('❌ Failed to add to draft:', error);
    return false;
  }
}

/**
 * Remove a specific candidate from the draft
 */
export function removeCandidateFromDraft(jobId: string, tempId: string): boolean {
  try {
    const draft = loadDraft(jobId);
    
    if (!draft) {
      return false;
    }
    
    const updatedDraft: CandidateDraft = {
      ...draft,
      processedCandidates: draft.processedCandidates.filter(c => c.tempId !== tempId),
      lastSaved: Date.now()
    };
    
    return saveDraft(updatedDraft);
  } catch (error) {
    console.error('❌ Failed to remove candidate from draft:', error);
    return false;
  }
}

/**
 * Get all drafts (for admin purposes or cleanup)
 */
export function getAllDrafts(): CandidateDraft[] {
  const drafts: CandidateDraft[] = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key && key.startsWith(DRAFT_KEY_PREFIX)) {
        const jobId = key.replace(DRAFT_KEY_PREFIX, '');
        const draft = loadDraft(jobId);
        
        if (draft) {
          drafts.push(draft);
        }
      }
    }
  } catch (error) {
    console.error('❌ Failed to get all drafts:', error);
  }
  
  return drafts;
}

/**
 * Clear all expired drafts (cleanup utility)
 */
export function clearExpiredDrafts(): number {
  let clearedCount = 0;
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key && key.startsWith(DRAFT_KEY_PREFIX)) {
        const stored = localStorage.getItem(key);
        
        if (stored) {
          try {
            const draft: CandidateDraft = JSON.parse(stored);
            
            if (isDraftExpired(draft)) {
              localStorage.removeItem(key);
              clearedCount++;
            }
          } catch (parseError) {
            // Invalid draft, remove it
            localStorage.removeItem(key);
            clearedCount++;
          }
        }
      }
    }
    
    if (clearedCount > 0) {
      console.log(`🧹 Cleared ${clearedCount} expired draft(s)`);
    }
  } catch (error) {
    console.error('❌ Failed to clear expired drafts:', error);
  }
  
  return clearedCount;
}

/**
 * Check localStorage availability and space
 */
export function checkStorageHealth(): {
  available: boolean;
  approximateSpace: number; // in KB
  error?: string;
} {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    
    // Estimate used space
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }
    
    return {
      available: true,
      approximateSpace: Math.round(totalSize / 1024) // Convert to KB
    };
  } catch (error) {
    return {
      available: false,
      approximateSpace: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

