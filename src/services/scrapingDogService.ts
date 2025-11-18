import { generateCandidateSummary } from './anthropicService';

// ScrapingDog is now accessed via Supabase proxy for security
// API key is stored securely in Supabase Edge Functions
// Using ScrapingDog's LinkedIn Profile API for structured data

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

export interface ScrapingResult {
  success: boolean;
  profiles: LinkedInProfile[];
  error?: string;
}

// ScrapingDog Profile API response interface (based on actual API response)
interface ScrapingDogProfile {
  fullName?: string;
  first_name?: string;
  last_name?: string;
  headline?: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  about?: string;
  connections?: string;
  followers?: string;
  experience?: Array<{
    title?: string;
    company?: string;
    company_name?: string;
    company_position?: string;
    start_date?: string;
    starts_at?: string;
    end_date?: string;
    ends_at?: string;
    duration?: string;
    company_duration?: string;
    description?: string;
  }>;
  education?: Array<{
    school?: string;
    school_name?: string;
    degree?: string;
    field_of_study?: string;
    start_date?: string;
    starts_at?: string;
    end_date?: string;
    ends_at?: string;
  }>;
  skills?: Array<string | { name?: string; skill_name?: string }>;
  volunteering?: Array<{
    company_name?: string;
    company_position?: string;
    company_duration?: string;
  }>;
}

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

// Map ScrapingDog profile data to our LinkedInProfile interface
const mapScrapingDogProfile = (data: ScrapingDogProfile, profileUrl: string): Partial<LinkedInProfile> | null => {
  try {
    // Extract name
    let firstName = data.first_name || 'N/A';
    let lastName = data.last_name || 'N/A';
    
    // If first/last name not provided, try to split from full name
    if ((!data.first_name || !data.last_name) && data.fullName) {
      const nameInfo = extractName(data.fullName);
      firstName = nameInfo.firstName;
      lastName = nameInfo.lastName;
    }
    
    // Extract location
    const location = data.location || 
                     [data.city, data.state, data.country].filter(Boolean).join(', ') || 
                     'N/A';
    
    // Map experience - handle various formats including minimal data
    const experience = (data.experience || []).map(exp => {
      const title = exp.title || exp.company_position || exp.description || 'Position not specified';
      const company = exp.company || exp.company_name || 'Company not specified';
      const startDate = exp.start_date || exp.starts_at || '';
      const endDate = exp.end_date || exp.ends_at || '';
      const duration = exp.duration || exp.company_duration || 
                      (startDate && endDate ? `${startDate} - ${endDate}` : 
                       startDate ? `${startDate} - Present` : 'Duration not specified');
      
      return { title, company, duration };
    });
    
    // If experience is empty but volunteering exists, use that
    if (experience.length === 0 && data.volunteering && data.volunteering.length > 0) {
      data.volunteering.slice(0, 3).forEach(vol => {
        experience.push({
          title: vol.company_position || 'Volunteer',
          company: vol.company_name || 'Organization not specified',
          duration: vol.company_duration || 'Duration not specified'
        });
      });
    }
    
    // Map education
    const education = (data.education || []).map(edu => {
      const school = edu.school || edu.school_name || 'School not specified';
      const degree = [edu.degree, edu.field_of_study].filter(Boolean).join(', ') || 'Degree not specified';
      return { school, degree };
    });
    
    // Map skills - handle string, object with name, or object with skill_name
    const skills = (data.skills || []).map(skill => {
      if (typeof skill === 'string') return skill;
      if (typeof skill === 'object' && skill.skill_name) return skill.skill_name;
      if (typeof skill === 'object' && skill.name) return skill.name;
      return null;
    }).filter(Boolean) as string[];
    
    // Use about as headline if headline is empty
    const headline = (data.headline && data.headline.trim()) ? data.headline : (data.about || 'Professional');
    
    return {
      firstName,
      lastName,
      headline,
      location,
      profileUrl,
      experience,
      education,
      skills
    };
  } catch (error) {
    console.error('Error mapping ScrapingDog profile:', error);
    return null;
  }
};

// Scrape a single LinkedIn profile using ScrapingDog's Profile API
const scrapeSingleProfile = async (linkedinUrl: string): Promise<LinkedInProfile | null> => {
  try {
    // Get Supabase configuration
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Supabase configuration missing');
      return null;
    }
    
    // Call our secure proxy function which uses ScrapingDog's LinkedIn Profile API
    const response = await fetch(`${supabaseUrl}/functions/v1/scrapingdog-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        linkedinUrl,
        premium: true
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`❌ ScrapingDog API error (${response.status}) for ${linkedinUrl}`, errorData);
      return null;
    }
    
    const data = await response.json();
    const profileData = data.profile;
    
    if (!profileData) {
      console.error(`❌ No profile data received for ${linkedinUrl}`);
      return null;
    }
    
    // Map ScrapingDog's response to our LinkedInProfile interface
    const mappedProfile = mapScrapingDogProfile(profileData, linkedinUrl);
    
    if (!mappedProfile || !mappedProfile.firstName || mappedProfile.firstName === 'N/A') {
      console.warn(`⚠️ Could not extract valid profile data from ${linkedinUrl}`);
      return null;
    }
    
    // Prepare data for AI summary generation
    const candidateData = {
      firstName: mappedProfile.firstName,
      lastName: mappedProfile.lastName,
      headline: mappedProfile.headline !== 'N/A' ? mappedProfile.headline : undefined,
      location: mappedProfile.location !== 'N/A' ? mappedProfile.location : undefined,
      experience: mappedProfile.experience && mappedProfile.experience.length > 0 ? mappedProfile.experience : undefined,
      education: mappedProfile.education && mappedProfile.education.length > 0 ? mappedProfile.education : undefined,
      skills: mappedProfile.skills && mappedProfile.skills.length > 0 ? mappedProfile.skills : undefined
    };
    
    // Generate AI summary
    let aiSummary: string;
    try {
      aiSummary = await generateCandidateSummary(candidateData);
    } catch (error) {
      // Fallback if AI summary fails
      aiSummary = `${mappedProfile.firstName} ${mappedProfile.lastName} is a ${mappedProfile.headline || 'professional'} based in ${mappedProfile.location || 'Unknown location'}.`;
    }
    
    return {
      firstName: mappedProfile.firstName,
      lastName: mappedProfile.lastName || 'N/A',
      headline: mappedProfile.headline || 'N/A',
      location: mappedProfile.location || 'N/A',
      profileUrl: linkedinUrl,
      experience: mappedProfile.experience || [],
      education: mappedProfile.education || [],
      skills: mappedProfile.skills || [],
      summary: aiSummary
    };
  } catch (error) {
    console.error(`Error scraping LinkedIn profile ${linkedinUrl}:`, error);
    return null;
  }
};

export const scrapeLinkedInProfiles = async (linkedinUrls: string[]): Promise<ScrapingResult> => {
  try {
    // Scrape all profiles concurrently
    const scrapingPromises = linkedinUrls.map(url => scrapeSingleProfile(url));
    const results = await Promise.all(scrapingPromises);
    
    // Filter out null results (failed scrapes)
    const profiles = results.filter((profile): profile is LinkedInProfile => profile !== null);

    return {
      success: true,
      profiles
    };
  } catch (error) {
    console.error('❌ Scraping error:', error);
    return {
      success: false,
      profiles: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Test function to see what ScrapingDog returns for a given LinkedIn URL
export const testScrapingDogResponse = async (linkedinUrl: string): Promise<any> => {
  try {
    console.log('\n🧪 TEST MODE: Scraping LinkedIn Profile');
    console.log(`   📍 URL: ${linkedinUrl}`);
    console.log('\n📡 STEP 1: Calling ScrapingDog API...');
    
    const profile = await scrapeSingleProfile(linkedinUrl);
    
    if (profile) {
      console.log('\n✅ TEST SUCCESSFUL!');
      console.log('   📊 Profile Data:');
      console.log(`   • Name: ${profile.firstName} ${profile.lastName}`);
      console.log(`   • Headline: ${profile.headline}`);
      console.log(`   • Location: ${profile.location}`);
      console.log(`   • Experience: ${profile.experience?.length || 0} positions`);
      console.log(`   • Education: ${profile.education?.length || 0} schools`);
      console.log(`   • Skills: ${profile.skills?.length || 0} skills`);
      console.log(`   • Summary: ${profile.summary?.substring(0, 100)}...`);
      
      return {
        success: true,
        profile,
        message: `✅ Successfully scraped profile for ${profile.firstName} ${profile.lastName}`
      };
    } else {
      console.log('\n❌ TEST FAILED: Could not scrape profile');
      console.log('   Possible reasons:');
      console.log('   • Profile is private or restricted');
      console.log('   • Invalid LinkedIn URL format');
      console.log('   • LinkedIn is blocking the request');
      
      return {
        success: false,
        profile: null,
        error: 'Failed to scrape profile. Check console for details.'
      };
    }
  } catch (error) {
    console.log('\n❌ TEST ERROR:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      profile: null
    };
  }
};


