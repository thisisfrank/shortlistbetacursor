import { generateCandidateSummary } from './anthropicService';

const APIFY_API_TOKEN = import.meta.env.VITE_APIFY_API_TOKEN || 'your_apify_api_token_here';
const APIFY_ACTOR_ID = '2SyF0bVxmgGr8IVCZ';

export interface LinkedInProfile {
  firstName: string;
  lastName: string;
  headline: string;
  location: string;
  profileUrl: string;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
  }>;
  skills: string[];
  summary: string;
}

export interface ApifyScrapingResult {
  success: boolean;
  profiles: LinkedInProfile[];
  error?: string;
}

// Helper function to extract company name from subtitle
const extractCompanyName = (subtitle: string): string => {
  if (!subtitle) return 'N/A';
  
  // The subtitle often contains "Company Name · Employment Type"
  // We want to extract just the company name=
  const parts = subtitle.split('·');
  return parts[0]?.trim() || subtitle.trim();
};

// Helper function to transform experience data according to the template
const transformExperience = (experiences: any[]): Array<{ title: string; company: string; duration: string }> => {
  if (!Array.isArray(experiences)) return [];
  
  return experiences.map(exp => ({
    title: exp.title || 'N/A',
    company: extractCompanyName(exp.subtitle || ''),
    duration: exp.caption || 'N/A'
  })).filter(exp => exp.title !== 'N/A' || exp.company !== 'N/A');
};

// Helper function to transform education data
const transformEducation = (educations: any[]): Array<{ school: string; degree: string }> => {
  if (!Array.isArray(educations)) return [];
  
  return educations.map(edu => ({
    school: edu.subtitle || 'N/A',
    degree: edu.title || 'N/A'
  })).filter(edu => edu.school !== 'N/A' || edu.degree !== 'N/A');
};

// Helper function to transform skills data
const transformSkills = (skills: any[]): string[] => {
  if (!Array.isArray(skills)) return [];
  
  return skills.map(skill => {
    if (typeof skill === 'string') return skill;
    if (skill && skill.title) return skill.title;
    return String(skill);
  }).filter(skill => skill && skill.trim() !== '');
};

// Helper function to extract name parts
const extractName = (fullName: string): { firstName: string; lastName: string } => {
  if (!fullName || fullName.trim() === '') {
    return { firstName: 'N/A', lastName: 'N/A' };
  }
  
  const nameParts = fullName.trim().split(' ');
  if (nameParts.length === 1) {
    return { firstName: nameParts[0], lastName: 'N/A' };
  }
  
  return {
    firstName: nameParts[0],
    lastName: nameParts.slice(1).join(' ')
  };
};

export const scrapeLinkedInProfiles = async (linkedinUrls: string[]): Promise<ApifyScrapingResult> => {
  try {
    // Prepare the input for the Apify actor
    const input = {
      profileUrls: linkedinUrls
    };

    // Make the API call to Apify using the run-sync endpoint
    const response = await fetch(
      `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Apify API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Transform the Apify response and generate AI summaries
    const profiles: LinkedInProfile[] = await Promise.all(
      data.map(async (item: any) => {
        // Extract name from fullName field
        const nameInfo = extractName(item.fullName || '');
        const experience = transformExperience(item.experiences || []);
        const education = transformEducation(item.educations || []);
        const skills = transformSkills(item.skills || []);
        
        // Prepare data for AI summary generation
        const candidateData = {
          firstName: nameInfo.firstName,
          lastName: nameInfo.lastName,
          headline: item.headline || undefined,
          location: item.addressWithCountry || undefined,
          experience: experience.length > 0 ? experience : undefined,
          education: education.length > 0 ? education : undefined,
          skills: skills.length > 0 ? skills : undefined,
          about: item.about || undefined
        };
        
        // Generate AI summary
        const aiSummary = await generateCandidateSummary(candidateData);
        
        return {
          firstName: nameInfo.firstName,
          lastName: nameInfo.lastName,
          headline: item.headline || 'N/A',
          location: item.addressWithCountry || 'N/A',
          profileUrl: item.linkedinUrl || '',
          experience,
          education,
          skills,
          summary: aiSummary
        };
      })
    );

    return {
      success: true,
      profiles
    };
  } catch (error) {
    console.error('Error scraping LinkedIn profiles:', error);
    return {
      success: false,
      profiles: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Test function to see what Apify returns for a given LinkedIn URL
export const testApifyResponse = async (linkedinUrl: string): Promise<any> => {
  try {
    console.log('Testing Apify with URL:', linkedinUrl);
    
    const input = {
      profileUrls: [linkedinUrl]
    };

    console.log('Sending input to Apify:', input);

    const response = await fetch(
      `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      }
    );

    console.log('Apify response status:', response.status);
    console.log('Apify response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Apify error response:', errorText);
      throw new Error(`Apify API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Raw Apify response:', data);
    
    // Transform according to template for testing
    let transformedProfile = null;
    if (data.length > 0) {
      const item = data[0];
      const nameInfo = extractName(item.fullName || '');
      const experience = transformExperience(item.experiences || []);
      const education = transformEducation(item.educations || []);
      const skills = transformSkills(item.skills || []);
      
      // Generate AI summary for test
      const candidateData = {
        firstName: nameInfo.firstName,
        lastName: nameInfo.lastName,
        headline: item.headline || undefined,
        location: item.addressWithCountry || undefined,
        experience: experience.length > 0 ? experience : undefined,
        education: education.length > 0 ? education : undefined,
        skills: skills.length > 0 ? skills : undefined,
        about: item.about || undefined
      };
      
      const aiSummary = await generateCandidateSummary(candidateData);
      
      transformedProfile = {
        firstName: nameInfo.firstName,
        lastName: nameInfo.lastName,
        headline: item.headline || 'N/A',
        location: item.addressWithCountry || 'N/A',
        profileUrl: item.linkedinUrl || linkedinUrl,
        experience,
        education,
        skills,
        summary: aiSummary
      };
    }
    
    return {
      success: true,
      rawResponse: data,
      transformedProfile
    };
  } catch (error) {
    console.error('Test error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      rawResponse: null,
      transformedProfile: null
    };
  }
};