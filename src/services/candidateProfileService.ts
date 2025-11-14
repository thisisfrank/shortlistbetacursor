export interface CandidateProfile {
  id: string;
  name: string;
  location: string;
  yearsOfExperience: number;
  previousWorkExperience: string[];
  relevantSkills: string[];
  keyProjects: string[];
}

export interface ProfileGenerationRequest {
  title: string;
  mustHaveSkills: string[];
  seniorityLevel: string;
  location?: string;
  isRemote: boolean;
  industry?: string;
  idealCandidate?: string;
}

export const generateCandidateProfiles = async (
  data: ProfileGenerationRequest
): Promise<CandidateProfile[]> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured');
    }

    // Build context for profile generation
    const locationText = data.isRemote 
      ? 'various locations (remote position)' 
      : data.location || 'relevant locations';
    
    const prompt = `Generate 3 diverse synthetic candidate profiles for this position:

Position Title: ${data.title}
Required Skills: ${data.mustHaveSkills.join(', ')}
Experience Level: ${data.seniorityLevel}
Location: ${locationText}
${data.industry ? `Industry: ${data.industry}` : ''}
${data.idealCandidate ? `Ideal Candidate: ${data.idealCandidate}` : ''}

Create 3 UNIQUE candidate profiles following this EXACT format:

Profile 1:
Name: [realistic first and last name]
Location: [realistic US city, state]
Total Years of Experience: [number between appropriate range for ${data.seniorityLevel}]
Previous Work Experience: [2-3 previous relevant job titles and companies, format: "Title at Company"]
Relevant Skills: [4-5 skills from the required skills and related technologies]
Key Projects: [2-3 specific projects with measurable impact, format: "Brief project description with tech or metrics"]

Profile 2:
[same format, different person with varied background]

Profile 3:
[same format, different person with varied background]

CRITICAL Guidelines:
- Use realistic, diverse names (various ethnicities and genders)
- Choose DIFFERENT real US cities with tech presence for each profile
- Experience years should vary within seniority range: Junior (1-3 years), Mid (4-6 years), Senior (7-10 years), Super Senior (10-15 years)
- Previous roles MUST show VERY DIFFERENT career paths:
  * Profile 1: Big Tech background (Google, Amazon, Microsoft, Meta, Apple, etc.)
  * Profile 2: Startup/Scale-up experience (YC companies, unicorns, Series A-C startups)
  * Profile 3: Mix of agency/consultancy and product companies
- Each profile should have DIFFERENT company types, industries, and specializations
- Skills should overlap with required skills but each profile should emphasize different strengths
- Key Projects should showcase DIFFERENT types of work:
  * System architecture/infrastructure projects
  * Customer-facing features with business impact
  * Technical migrations or modernization efforts
  * Scale/performance optimizations
  * New product development
- Include specific metrics in projects when relevant (users, revenue, performance improvement)
- Mention key technologies used in project context
- Use specific, recognizable company names (not generic "Tech Company" or "Startup")
- Use industry-accurate job titles
- Keep content professional and concise
- NO vague terms like "self-starter" or "innovative"

IMPORTANT: Return ONLY the 3 profiles in the exact format shown above. Each field must be on its own line.`;

    const response = await fetch(`${supabaseUrl}/functions/v1/anthropic-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Anthropic API Error (profiles):', {
        status: response.status,
        error: errorData.error,
        details: errorData.details,
        timestamp: errorData.timestamp
      });
      throw new Error(`Profile generation failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const responseData = await response.json();
    
    if (responseData.content?.[0]?.text) {
      return parseProfilesFromText(responseData.content[0].text);
    } else {
      throw new Error('Invalid response format from AI service');
    }
  } catch (error) {
    console.error('Candidate profile generation error:', error);
    return generateFallbackProfiles(data);
  }
};

const parseProfilesFromText = (text: string): CandidateProfile[] => {
  const profiles: CandidateProfile[] = [];
  
  // Split by "Profile X:" markers
  const profileSections = text.split(/Profile \d+:/i).filter(s => s.trim());
  
  profileSections.forEach((section, index) => {
    const lines = section.split('\n').filter(l => l.trim());
    
    let name = '';
    let location = '';
    let yearsOfExperience = 0;
    const previousWorkExperience: string[] = [];
    let relevantSkills: string[] = [];
    let keyProjects: string[] = [];
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      if (trimmedLine.match(/^-?\s*Name:/i)) {
        name = trimmedLine.replace(/^-?\s*Name:\s*/i, '').trim();
      } else if (trimmedLine.match(/^-?\s*Location:/i)) {
        location = trimmedLine.replace(/^-?\s*Location:\s*/i, '').trim();
      } else if (trimmedLine.match(/^-?\s*Total Years of Experience:/i)) {
        // More robust parsing - look for any number in the line
        const match = trimmedLine.match(/(\d+)/);
        if (match) {
          yearsOfExperience = parseInt(match[1]);
        }
      } else if (trimmedLine.match(/^-?\s*Previous Work Experience:/i)) {
        const expText = trimmedLine.replace(/^-?\s*Previous Work Experience:\s*/i, '').trim();
        if (expText) {
          // Split by comma or semicolon
          const experiences = expText.split(/[,;]/).map(e => e.trim()).filter(e => e);
          previousWorkExperience.push(...experiences);
        }
      } else if (trimmedLine.match(/^-?\s*Relevant Skills:/i)) {
        const skillsText = trimmedLine.replace(/^-?\s*Relevant Skills:\s*/i, '').trim();
        if (skillsText) {
          relevantSkills = skillsText.split(',').map(s => s.trim()).filter(s => s);
        }
      } else if (trimmedLine.match(/^-?\s*Key Projects:/i)) {
        const projectsText = trimmedLine.replace(/^-?\s*Key Projects:\s*/i, '').trim();
        if (projectsText) {
          // Split by comma or semicolon
          const projects = projectsText.split(/[,;]/).map(p => p.trim()).filter(p => p);
          keyProjects.push(...projects);
        }
      }
    });
    
    if (name && location) {
      profiles.push({
        id: `profile-${index + 1}`,
        name,
        location,
        yearsOfExperience,
        previousWorkExperience,
        relevantSkills,
        keyProjects
      });
    }
  });
  
  // If parsing failed, return fallback
  if (profiles.length !== 3) {
    console.warn('Profile parsing incomplete, using fallback');
    return generateFallbackProfiles({} as ProfileGenerationRequest);
  }
  
  return profiles;
};

const generateFallbackProfiles = (data: ProfileGenerationRequest): CandidateProfile[] => {
  const seniorityYears = {
    'Junior': 2,
    'Mid': 5,
    'Senior': 8,
    'Super Senior': 12
  }[data.seniorityLevel] || 5;

  const skills = data.mustHaveSkills?.length > 0 ? data.mustHaveSkills : ['React', 'TypeScript', 'Node.js'];
  const title = data.title || 'Software Engineer';

  return [
    {
      id: 'profile-1',
      name: 'Sarah Chen',
      location: 'Austin, TX',
      yearsOfExperience: seniorityYears,
      previousWorkExperience: [
        `${title} at Amazon`,
        'Software Engineer at Microsoft',
        'Junior Developer at IBM'
      ],
      relevantSkills: [...skills.slice(0, 3), 'AWS', 'Git'],
      keyProjects: [
        'Built microservices architecture handling 10M+ daily requests',
        'Led team of 5 engineers on cloud migration reducing costs 40%',
        'Developed real-time analytics dashboard for 50K+ users'
      ]
    },
    {
      id: 'profile-2',
      name: 'Marcus Williams',
      location: 'Denver, CO',
      yearsOfExperience: seniorityYears + 1,
      previousWorkExperience: [
        `Senior ${title} at Scale AI`,
        'Tech Lead at Series B Startup',
        'Developer at Y Combinator Company'
      ],
      relevantSkills: [...skills.slice(0, 3), 'Docker', 'CI/CD'],
      keyProjects: [
        'Architected payment system processing $20M annually',
        'Built ML pipeline improving recommendation accuracy by 35%',
        'Led API redesign serving 1M+ mobile app users'
      ]
    },
    {
      id: 'profile-3',
      name: 'Elena Rodriguez',
      location: 'Miami, FL',
      yearsOfExperience: seniorityYears > 1 ? seniorityYears - 1 : seniorityYears,
      previousWorkExperience: [
        `${title} at Deloitte Digital`,
        'Full Stack Developer at Huge Inc',
        'Web Developer at Local Agency'
      ],
      relevantSkills: [...skills.slice(0, 3), 'Agile', 'REST APIs'],
      keyProjects: [
        'Developed e-commerce platform generating $5M in first year',
        'Migrated legacy system to modern stack with zero downtime',
        'Created customer portal increasing engagement by 60%'
      ]
    }
  ];
};

