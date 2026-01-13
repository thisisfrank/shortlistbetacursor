import { generateCandidateSummary } from './anthropicService';

// Supabase configuration for edge function calls
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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

// Helper function to calculate duration from dates
const calculateDuration = (startDate: string | null, endDate: string | null, stillWorking: boolean): string => {
  if (!startDate) return 'N/A';
  
  if (stillWorking || !endDate) {
    return `${startDate} - Present`;
  }
  return `${startDate} - ${endDate}`;
};

// Helper function to transform experience data according to the template
const transformExperience = (experiences: any[]): Array<{ title: string; company: string; duration: string }> => {
  if (!Array.isArray(experiences)) return [];
  
  return experiences.map(exp => ({
    title: exp.title || 'N/A',
    company: exp.companyName || 'N/A',
    duration: calculateDuration(exp.jobStartedOn, exp.jobEndedOn, exp.jobStillWorking)
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
    console.log(`🔍 Attempting to scrape ${linkedinUrls.length} LinkedIn profiles via Apify edge function:`);
    linkedinUrls.forEach((url, index) => {
      console.log(`  ${index + 1}. ${url}`);
    });
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing');
    }

    // Call secure edge function instead of Apify directly
    const response = await fetch(`${supabaseUrl}/functions/v1/apify-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ linkedinUrls }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Apify proxy error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const responseData = await response.json();
    const data = responseData.profiles || [];
    
    console.log(`✅ Apify returned ${data.length} profiles out of ${linkedinUrls.length} requested`);
    
    if (data.length < linkedinUrls.length) {
      console.warn(`⚠️ WARNING: Only ${data.length} out of ${linkedinUrls.length} profiles were returned by Apify`);
      console.warn(`⚠️ This usually means:`);
      console.warn(`   - Some LinkedIn URLs are invalid or incorrectly formatted`);
      console.warn(`   - Some profiles are private or restricted`);
      console.warn(`   - Some URLs may have been blocked by LinkedIn`);
    }
    
    // Transform the Apify response and generate AI summaries
    const profiles: LinkedInProfile[] = await Promise.all(
      data.map(async (item: any, index: number) => {
        console.log(`🔍 Processing profile ${index + 1}/${data.length}: ${item.fullName || 'Unknown'}`);
        console.log(`📊 Raw Apify data for profile ${index + 1}:`, {
          fullName: item.fullName,
          headline: item.headline,
          linkedinUrl: item.linkedinUrl,
          hasExperience: !!item.experiences,
          hasEducation: !!item.educations,
          hasSkills: !!item.skills
        });
        
        // Extract name from fullName field
        const nameInfo = extractName(item.fullName || '');
        console.log(`🔍 Debug - firstName extracted:`, nameInfo.firstName);
        
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
        
        // Generate AI summary with better error handling
        let aiSummary: string;
        try {
          console.log(`🤖 Generating AI summary for ${nameInfo.firstName} ${nameInfo.lastName}...`);
          aiSummary = await generateCandidateSummary(candidateData);
          console.log(`✅ AI summary generated successfully for ${nameInfo.firstName} ${nameInfo.lastName}`);
        } catch (error) {
          console.warn(`⚠️ AI summary generation failed for ${nameInfo.firstName} ${nameInfo.lastName}, using basic fallback:`, error);
          // Generate a simple fallback summary without AI
          aiSummary = `${nameInfo.firstName} ${nameInfo.lastName} is a ${item.headline || 'professional'} based in ${item.addressWithCountry || 'Unknown location'}.`;
        }
        
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
    
    console.log(`✅ Successfully processed ${profiles.length} profiles`);

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
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing');
    }

    // Call secure edge function
    const response = await fetch(`${supabaseUrl}/functions/v1/apify-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ linkedinUrls: [linkedinUrl] }),
    });

    console.log('Apify proxy response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Apify proxy error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const responseData = await response.json();
    const data = responseData.profiles || [];
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
