import { generateCandidateSummary } from './anthropicService';

// ScrapingDog is now accessed via Supabase proxy for security
// API key is stored securely in Supabase Edge Functions

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

// Helper function to parse LinkedIn profile HTML
const parseLinkedInHTML = (html: string, profileUrl: string): Partial<LinkedInProfile> | null => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extract full name - try multiple selectors
    let fullName = '';
    const nameSelectors = [
      'h1.text-heading-xlarge',
      '.pv-text-details__left-panel h1',
      '.top-card-layout__title',
      'h1[class*="top-card"]',
      'h1'
    ];
    
    for (const selector of nameSelectors) {
      const nameElement = doc.querySelector(selector);
      if (nameElement?.textContent?.trim()) {
        fullName = nameElement.textContent.trim();
        break;
      }
    }
    
    // Extract headline
    let headline = 'N/A';
    const headlineSelectors = [
      '.text-body-medium',
      '.pv-text-details__left-panel .text-body-medium',
      '.top-card-layout__headline',
      'div[class*="headline"]'
    ];
    
    for (const selector of headlineSelectors) {
      const headlineElement = doc.querySelector(selector);
      if (headlineElement?.textContent?.trim()) {
        headline = headlineElement.textContent.trim();
        break;
      }
    }
    
    // Extract location
    let location = 'N/A';
    const locationSelectors = [
      '.text-body-small.inline',
      '.pv-text-details__left-panel .text-body-small',
      '.top-card-layout__location-info',
      'span[class*="location"]'
    ];
    
    for (const selector of locationSelectors) {
      const locationElement = doc.querySelector(selector);
      if (locationElement?.textContent?.trim()) {
        location = locationElement.textContent.trim();
        break;
      }
    }
    
    // Extract experience
    const experience: Array<{ title: string; company: string; duration: string }> = [];
    const experienceSection = doc.querySelector('#experience');
    if (experienceSection) {
      const experienceItems = experienceSection.querySelectorAll('li');
      experienceItems.forEach(item => {
        const title = item.querySelector('.t-bold')?.textContent?.trim() || '';
        const company = item.querySelector('.t-14.t-normal')?.textContent?.trim() || '';
        const duration = item.querySelector('.t-14.t-normal.t-black--light')?.textContent?.trim() || '';
        
        if (title) {
          experience.push({ title, company: company || 'N/A', duration: duration || 'N/A' });
        }
      });
    }
    
    // Extract education
    const education: Array<{ school: string; degree: string }> = [];
    const educationSection = doc.querySelector('#education');
    if (educationSection) {
      const educationItems = educationSection.querySelectorAll('li');
      educationItems.forEach(item => {
        const school = item.querySelector('.t-bold')?.textContent?.trim() || '';
        const degree = item.querySelector('.t-14.t-normal')?.textContent?.trim() || '';
        
        if (school) {
          education.push({ school, degree: degree || 'N/A' });
        }
      });
    }
    
    // Extract skills
    const skills: string[] = [];
    const skillsSection = doc.querySelector('#skills');
    if (skillsSection) {
      const skillItems = skillsSection.querySelectorAll('li');
      skillItems.forEach(item => {
        const skill = item.textContent?.trim();
        if (skill) {
          skills.push(skill);
        }
      });
    }
    
    const nameInfo = extractName(fullName);
    
    return {
      firstName: nameInfo.firstName,
      lastName: nameInfo.lastName,
      headline,
      location,
      profileUrl,
      experience,
      education,
      skills
    };
  } catch (error) {
    console.error('Error parsing LinkedIn HTML:', error);
    return null;
  }
};

// Scrape a single LinkedIn profile
const scrapeSingleProfile = async (linkedinUrl: string): Promise<LinkedInProfile | null> => {
  try {
    console.log(`🔍 Scraping profile: ${linkedinUrl}`);
    
    // Get Supabase configuration
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Supabase configuration missing');
      return null;
    }
    
    // Call our secure proxy function instead of ScrapingDog directly
    console.log(`📡 Calling ScrapingDog proxy...`);
    const response = await fetch(`${supabaseUrl}/functions/v1/scrapingdog-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        linkedinUrl,
        dynamic: true,
        premium: true
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`❌ ScrapingDog proxy error for ${linkedinUrl}: ${response.status}`, errorData);
      return null;
    }
    
    const data = await response.json();
    const html = data.html;
    console.log(`✅ Received HTML (${html?.length || 0} characters)`);
    
    // If HTML is suspiciously short, log it for debugging
    if (html.length < 1000) {
      console.warn(`⚠️ Received very short HTML response (${html.length} chars). This may indicate an error or blocked request.`);
      console.warn(`Response preview:`, html.substring(0, 200));
    }
    
    // Parse the HTML to extract profile data
    const profileData = parseLinkedInHTML(html, linkedinUrl);
    
    if (!profileData || !profileData.firstName || profileData.firstName === 'N/A') {
      console.warn(`⚠️ Could not extract profile data from ${linkedinUrl}. This usually means the profile is private, restricted, or LinkedIn blocked the request.`);
      return null;
    }
    
    // Prepare data for AI summary generation
    const candidateData = {
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      headline: profileData.headline !== 'N/A' ? profileData.headline : undefined,
      location: profileData.location !== 'N/A' ? profileData.location : undefined,
      experience: profileData.experience && profileData.experience.length > 0 ? profileData.experience : undefined,
      education: profileData.education && profileData.education.length > 0 ? profileData.education : undefined,
      skills: profileData.skills && profileData.skills.length > 0 ? profileData.skills : undefined
    };
    
    // Generate AI summary
    let aiSummary: string;
    try {
      console.log(`🤖 Generating AI summary for ${profileData.firstName} ${profileData.lastName}...`);
      aiSummary = await generateCandidateSummary(candidateData);
      console.log(`✅ AI summary generated successfully`);
    } catch (error) {
      console.warn(`⚠️ AI summary generation failed, using basic fallback:`, error);
      aiSummary = `${profileData.firstName} ${profileData.lastName} is a ${profileData.headline || 'professional'} based in ${profileData.location || 'Unknown location'}.`;
    }
    
    return {
      firstName: profileData.firstName,
      lastName: profileData.lastName || 'N/A',
      headline: profileData.headline || 'N/A',
      location: profileData.location || 'N/A',
      profileUrl: linkedinUrl,
      experience: profileData.experience || [],
      education: profileData.education || [],
      skills: profileData.skills || [],
      summary: aiSummary
    };
  } catch (error) {
    console.error(`Error scraping LinkedIn profile ${linkedinUrl}:`, error);
    return null;
  }
};

export const scrapeLinkedInProfiles = async (linkedinUrls: string[]): Promise<ScrapingResult> => {
  try {
    console.log(`🔍 Attempting to scrape ${linkedinUrls.length} LinkedIn profiles:`);
    linkedinUrls.forEach((url, index) => {
      console.log(`  ${index + 1}. ${url}`);
    });
    
    // Scrape all profiles concurrently
    const scrapingPromises = linkedinUrls.map(url => scrapeSingleProfile(url));
    const results = await Promise.all(scrapingPromises);
    
    // Filter out null results (failed scrapes)
    const profiles = results.filter((profile): profile is LinkedInProfile => profile !== null);
    
    console.log(`✅ Successfully scraped ${profiles.length} out of ${linkedinUrls.length} profiles`);
    
    if (profiles.length < linkedinUrls.length) {
      console.warn(`⚠️ WARNING: Only ${profiles.length} out of ${linkedinUrls.length} profiles were successfully scraped`);
      console.warn(`⚠️ This usually means:`);
      console.warn(`   - Some LinkedIn URLs are invalid or incorrectly formatted`);
      console.warn(`   - Some profiles are private or restricted`);
      console.warn(`   - LinkedIn may be blocking some requests`);
    }

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

// Test function to see what ScrapingDog returns for a given LinkedIn URL
export const testScrapingDogResponse = async (linkedinUrl: string): Promise<any> => {
  try {
    console.log('Testing ScrapingDog with URL:', linkedinUrl);
    
    const profile = await scrapeSingleProfile(linkedinUrl);
    
    return {
      success: profile !== null,
      profile,
      error: profile === null ? 'Failed to scrape profile' : undefined
    };
  } catch (error) {
    console.error('Test error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      profile: null
    };
  }
};


