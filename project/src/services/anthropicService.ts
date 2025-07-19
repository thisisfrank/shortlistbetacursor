export interface CandidateData {
  firstName: string;
  lastName: string;
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
  about?: string;
}

export const generateCandidateSummary = async (candidateData: CandidateData): Promise<string> => {
  try {
    // Use Supabase Edge Function to call Anthropic API
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured');
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/generate-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ candidateData })
    });

    if (!response.ok) {
      throw new Error(`Edge function error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.summary) {
      return data.summary;
    } else {
      throw new Error('Invalid response format from edge function');
    }
  } catch (error) {
    console.warn('AI summary generation failed, using fallback:', error);
    
    // Generate a professional fallback summary based on available data
    return generateFallbackSummary(candidateData);
  }
};

export interface JobMatchData {
  jobTitle: string;
  jobDescription: string;
  seniorityLevel: string;
  keySkills: string[];
  candidateData: CandidateData;
}

export const generateJobMatchScore = async (matchData: JobMatchData): Promise<{ score: number; reasoning: string }> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured');
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/generate-match-score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ matchData })
    });

    if (!response.ok) {
      throw new Error(`Edge function error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.score !== undefined && data.reasoning) {
      return {
        score: Math.max(0, Math.min(100, data.score)), // Ensure score is between 0-100
        reasoning: data.reasoning
      };
    } else {
      throw new Error('Invalid response format from edge function');
    }
  } catch (error) {
    console.warn('AI match score generation failed, using fallback:', error);
    
    // Generate a fallback match score based on simple keyword matching
    return generateFallbackMatchScore(matchData);
  }
};

const generateFallbackMatchScore = (matchData: JobMatchData): { score: number; reasoning: string } => {
  const { jobTitle, jobDescription, seniorityLevel, keySkills, candidateData } = matchData;
  let score = 45; // Base score (slightly below threshold to be conservative)
  const reasons: string[] = [];
  
  // Check title similarity
  if (candidateData.headline) {
    const titleWords = jobTitle.toLowerCase().split(' ');
    const headlineWords = candidateData.headline.toLowerCase().split(' ');
    const titleMatch = titleWords.some(word => headlineWords.some(hw => hw.includes(word) || word.includes(hw)));
    if (titleMatch) {
      score += 15;
      reasons.push('Similar job title/role');
    }
  }
  
  // Check skills overlap
  if (candidateData.skills && candidateData.skills.length > 0 && keySkills.length > 0) {
    const candidateSkillsLower = candidateData.skills.map(s => s.toLowerCase());
    const jobSkillsLower = keySkills.map(s => s.toLowerCase());
    const skillMatches = jobSkillsLower.filter(skill => 
      candidateSkillsLower.some(cs => cs.includes(skill) || skill.includes(cs))
    );
    
    if (skillMatches.length > 0) {
      const skillBonus = Math.min(25, (skillMatches.length / jobSkillsLower.length) * 25);
      score += skillBonus;
      reasons.push(`${skillMatches.length} matching skills`);
    }
  }
  
  // Check experience relevance
  if (candidateData.experience && candidateData.experience.length > 0) {
    const hasRelevantExperience = candidateData.experience.some(exp => {
      const expText = `${exp.title} ${exp.company}`.toLowerCase();
      return jobTitle.toLowerCase().split(' ').some(word => expText.includes(word));
    });
    
    if (hasRelevantExperience) {
      score += 10;
      reasons.push('Relevant work experience');
    }
  }
  
  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));
  
  const reasoning = reasons.length > 0 
    ? `Match based on: ${reasons.join(', ')}`
    : 'Limited profile match - candidate may not meet job requirements';
  
  return { score, reasoning };
};

const generateFallbackSummary = (candidateData: CandidateData): string => {
  const { firstName, lastName, headline, location, experience, education, skills } = candidateData;
  
  let summary = `${firstName} ${lastName} is a`;
  
  // Add professional title/headline
  if (headline) {
    summary += ` ${headline.toLowerCase()}`;
  } else {
    summary += ` professional`;
  }
  
  // Add location
  if (location) {
    summary += ` based in ${location}`;
  }
  
  // Add experience context
  if (experience && experience.length > 0) {
    const latestRole = experience[0];
    summary += ` with experience as ${latestRole.title} at ${latestRole.company}`;
    
    if (experience.length > 1) {
      summary += ` and ${experience.length - 1} other professional role${experience.length > 2 ? 's' : ''}`;
    }
  }
  
  summary += '.';
  
  // Add skills or education as second sentence
  if (skills && skills.length > 0) {
    const topSkills = skills.slice(0, 3).join(', ');
    summary += ` They bring expertise in ${topSkills}`;
    if (skills.length > 3) {
      summary += ` and ${skills.length - 3} other key skill${skills.length > 4 ? 's' : ''}`;
    }
    summary += '.';
  } else if (education && education.length > 0) {
    const latestEducation = education[0];
    summary += ` They hold a ${latestEducation.degree} from ${latestEducation.school}.`;
  }
  
  // Add value proposition
  summary += ` ${firstName} would be a valuable addition to teams seeking experienced talent in their field.`;
  
  return summary;
};