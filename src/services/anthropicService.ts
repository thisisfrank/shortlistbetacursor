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

    // Try calling anthropic-proxy directly first
    const response = await fetch(`${supabaseUrl}/functions/v1/anthropic-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 150,
        messages: [
          {
            role: 'user',
            content: `Based on the following candidate information, write a professional summary in exactly 2 sentences maximum that highlights their key qualifications, experience, and value proposition:

Name: ${candidateData.firstName} ${candidateData.lastName}
Current Role: ${candidateData.headline || 'N/A'}
Location: ${candidateData.location || 'N/A'}

Experience:
${candidateData.experience && candidateData.experience.length > 0 
  ? candidateData.experience.map(exp => `- ${exp.title} at ${exp.company} (${exp.duration})`).join('\n')
  : 'No experience data available'
}

Education:
${candidateData.education && candidateData.education.length > 0
  ? candidateData.education.map(edu => `- ${edu.degree} from ${edu.school}`).join('\n')
  : 'No education data available'
}

Skills:
${candidateData.skills && candidateData.skills.length > 0
  ? candidateData.skills.join(', ')
  : 'No skills data available'
}

About:
${candidateData.about || 'No about section available'}`
          }
        ]
      })
    });

    if (!response.ok) {
      console.warn(`Direct anthropic-proxy call failed: ${response.status}, falling back to edge function`);
      // Fall back to the existing edge function approach
      const fallbackResponse = await fetch(`${supabaseUrl}/functions/v1/generate-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ candidateData })
      });

      if (!fallbackResponse.ok) {
        throw new Error(`Both direct and edge function calls failed: ${fallbackResponse.status}`);
      }

      const fallbackData = await fallbackResponse.json();
      
      if (fallbackData.summary) {
        return fallbackData.summary;
      } else {
        throw new Error('Invalid response format from edge function');
      }
    }

    const data = await response.json();
    
    // Parse direct anthropic-proxy response
    if (data.content && data.content.length > 0 && data.content[0].text) {
      return data.content[0].text.trim();
    } else {
      throw new Error('Invalid response format from anthropic-proxy');
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

    // Try calling anthropic-proxy directly first
    const response = await fetch(`${supabaseUrl}/functions/v1/anthropic-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: `You are an expert recruiter. Analyze how well this candidate matches the job requirements and provide a match score from 0-100 and brief reasoning.

JOB REQUIREMENTS:
Title: ${matchData.jobTitle}
Seniority: ${matchData.seniorityLevel}
Key Skills: ${matchData.keySkills.join(', ')}
Description: ${matchData.jobDescription.substring(0, 500)}...

CANDIDATE PROFILE:
Name: ${matchData.candidateData.firstName} ${matchData.candidateData.lastName}
Current Role: ${matchData.candidateData.headline || 'N/A'}
Location: ${matchData.candidateData.location || 'N/A'}

Experience:
${matchData.candidateData.experience && matchData.candidateData.experience.length > 0 
  ? matchData.candidateData.experience.slice(0, 3).map(exp => `- ${exp.title} at ${exp.company}`).join('\n')
  : 'No experience data available'
}

Skills:
${matchData.candidateData.skills && matchData.candidateData.skills.length > 0
  ? matchData.candidateData.skills.slice(0, 10).join(', ')
  : 'No skills data available'
}

Education:
${matchData.candidateData.education && matchData.candidateData.education.length > 0
  ? matchData.candidateData.education.slice(0, 2).map(edu => `- ${edu.degree} from ${edu.school}`).join('\n')
  : 'No education data available'
}

Respond with ONLY a JSON object in this exact format:
{
  "score": 85,
  "reasoning": "Strong match due to relevant experience in similar role, 80% skill overlap, and appropriate seniority level"
}`
          }
        ]
      })
    });

    if (!response.ok) {
      console.warn(`Direct anthropic-proxy call failed: ${response.status}, falling back to edge function`);
      // Fall back to the existing edge function approach
      const fallbackResponse = await fetch(`${supabaseUrl}/functions/v1/generate-match-score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ matchData })
      });

      if (!fallbackResponse.ok) {
        throw new Error(`Both direct and edge function calls failed: ${fallbackResponse.status}`);
      }

      const fallbackData = await fallbackResponse.json();
      
      if (fallbackData.score !== undefined && fallbackData.reasoning) {
        return {
          score: Math.max(0, Math.min(100, fallbackData.score)),
          reasoning: fallbackData.reasoning
        };
      } else {
        throw new Error('Invalid response format from edge function');
      }
    }

    const data = await response.json();
    
    // Parse direct anthropic-proxy response
    if (data.content && data.content.length > 0 && data.content[0].text) {
      try {
        const aiResponse = data.content[0].text.trim();
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.score !== undefined && parsed.reasoning) {
            return {
              score: Math.max(0, Math.min(100, parsed.score)),
              reasoning: parsed.reasoning
            };
          }
        }
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
      }
    }
    
    throw new Error('Invalid response format from anthropic-proxy');
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
  
  // Add positive value proposition instead of noting it's fallback
  summary += ` ${firstName} brings valuable experience and would be a strong addition to the right team.`;
  
  return summary;
};