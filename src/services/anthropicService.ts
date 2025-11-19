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

// Helper function to calculate total years of experience
const calculateYearsOfExperience = (experience?: Array<{ title: string; company: string; duration: string }>): number => {
  if (!experience || experience.length === 0) return 0;
  
  let totalMonths = 0;
  
  for (const exp of experience) {
    const duration = exp.duration?.toLowerCase() || '';
    
    // Handle different duration formats
    if (duration.includes('yr') || duration.includes('year')) {
      const yearMatch = duration.match(/(\d+)\s*(yr|year)/);
      if (yearMatch) {
        totalMonths += parseInt(yearMatch[1]) * 12;
      }
    }
    
    if (duration.includes('mo') || duration.includes('month')) {
      const monthMatch = duration.match(/(\d+)\s*(mo|month)/);
      if (monthMatch) {
        totalMonths += parseInt(monthMatch[1]);
      }
    }
    
    // Handle date ranges like "Jan 2020 - Dec 2022"
    if (duration.includes('-') && !duration.includes('yr') && !duration.includes('mo')) {
      const dateRangeMatch = duration.match(/(\w{3})\s*(\d{4})\s*-\s*(\w{3})\s*(\d{4})/);
      if (dateRangeMatch) {
        const startYear = parseInt(dateRangeMatch[2]);
        const endYear = parseInt(dateRangeMatch[4]);
        const months = Math.max(1, (endYear - startYear) * 12);
        totalMonths += months;
      }
    }
    
    // Handle single years like "2020 - 2022"
    if (duration.includes('-')) {
      const yearRangeMatch = duration.match(/(\d{4})\s*-\s*(\d{4})/);
      if (yearRangeMatch) {
        const startYear = parseInt(yearRangeMatch[1]);
        const endYear = parseInt(yearRangeMatch[2]);
        const months = Math.max(1, (endYear - startYear) * 12);
        totalMonths += months;
      }
    }
    
    // If no specific format matches, assume 1 year minimum per role
    if (totalMonths === 0 && duration && duration !== 'n/a' && duration !== 'N/A') {
      totalMonths += 12;
    }
  }
  
  return Math.round(totalMonths / 12 * 10) / 10; // Round to 1 decimal place
};

// Helper function to extract unique industries/companies
const extractIndustries = (experience?: Array<{ title: string; company: string; duration: string }>): string[] => {
  if (!experience || experience.length === 0) return [];
  
  const companies = experience
    .map(exp => exp.company)
    .filter(company => company && company !== 'N/A' && company.trim() !== '')
    .map(company => company.trim());
  
  // Remove duplicates and return unique companies
  return [...new Set(companies)];
};

export const generateCandidateSummary = async (candidateData: CandidateData): Promise<string> => {
  try {
    // Calculate years of experience and extract industries
    const yearsOfExperience = calculateYearsOfExperience(candidateData.experience);
    const industries = extractIndustries(candidateData.experience);
    
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
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: `Based on the following candidate information, write a professional summary in exactly 2-3 sentences maximum that highlights their key qualifications, experience, and value proposition. IMPORTANT: Include their total years of experience.

Name: ${candidateData.firstName} ${candidateData.lastName}
Current Role: ${candidateData.headline || 'N/A'}
Location: ${candidateData.location || 'N/A'}
Total Years of Experience: ${yearsOfExperience} years

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
${candidateData.about || 'No about section available'}

Provide a 2-3 sentence professional summary that mentions their ${yearsOfExperience} years of experience.`
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
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: `You are an expert recruiter. Score this candidate using the following weighted criteria (0-100 scale):

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

SCORING FORMULA (calculate each component, then sum to get total 0-100):
1. Experience Relevance (35 points max): Score 0-35 based on how relevant their past roles are to this position
2. Skills Match (35 points max): Score 0-35 based on percentage of required skills the candidate has
3. Seniority Alignment (20 points max): Score 0-20 based on how well their level matches the required seniority
4. Education Fit (10 points max): Score 0-10 based on education background relevance

Calculate each component score, sum them for a total (0-100), and provide reasoning that shows your breakdown.

Respond with ONLY a JSON object in this exact format:
{
  "score": 85,
  "reasoning": "Experience: 30/35 (highly relevant roles), Skills: 28/35 (80% match), Seniority: 18/20 (senior level match), Education: 9/10 (relevant degree)"
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
  
  // Skill synonyms for better matching
  const skillSynonyms: Record<string, string[]> = {
    'react': ['reactjs', 'react.js'],
    'javascript': ['js', 'node', 'nodejs', 'node.js'],
    'python': ['py'],
    'typescript': ['ts'],
    'css': ['css3', 'styling'],
    'html': ['html5', 'markup'],
    'sql': ['mysql', 'postgresql', 'postgres']
  };
  
  const normalizeSkill = (skill: string): string => {
    const lower = skill.toLowerCase();
    for (const [main, synonyms] of Object.entries(skillSynonyms)) {
      if (synonyms.includes(lower) || lower.includes(main)) return main;
    }
    return lower;
  };

  // Check skills overlap
  if (candidateData.skills && candidateData.skills.length > 0 && keySkills.length > 0) {
    const candidateSkillsNormalized = candidateData.skills.map(s => normalizeSkill(s));
    const jobSkillsNormalized = keySkills.map(s => normalizeSkill(s));
    const skillMatches = jobSkillsNormalized.filter(skill => 
      candidateSkillsNormalized.some(cs => cs.includes(skill) || skill.includes(cs))
    );
    
    if (skillMatches.length > 0) {
      const skillBonus = Math.min(25, (skillMatches.length / jobSkillsNormalized.length) * 25);
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
  const yearsOfExperience = calculateYearsOfExperience(experience);
  const industries = extractIndustries(experience);
  
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
  
  // Add years of experience
  if (yearsOfExperience > 0) {
    summary += ` with ${yearsOfExperience} years of experience`;
  }
  
  // Add experience context
  if (experience && experience.length > 0) {
    const latestRole = experience[0];
    summary += `, currently working as ${latestRole.title} at ${latestRole.company}`;
    
    if (experience.length > 1) {
      summary += ` and having held ${experience.length - 1} other professional role${experience.length > 2 ? 's' : ''}`;
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
  

  
  return summary;
};

export interface GrammarReviewResult {
  hasIssues: boolean;
  correctedMessage?: string;
  suggestions: string[];
  score: number; // 1-10 score for message quality
}

export const reviewMessageGrammar = async (message: string): Promise<GrammarReviewResult> => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  
  if (!supabaseUrl) {
    throw new Error('Supabase URL not configured');
  }

  try {
    // Call our anthropic-proxy function
    const response = await fetch(`${supabaseUrl}/functions/v1/anthropic-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `Please review this LinkedIn outreach message for grammar mistakes, inconsistencies, and overall quality. Provide a corrected version and specific suggestions for improvement.

MESSAGE TO REVIEW:
"${message}"

IMPORTANT: Respond with ONLY a valid JSON object in this exact format. Do not add any text before or after the JSON:

{
  "hasIssues": boolean,
  "correctedMessage": "corrected version of the message (always provide this, even if just minor improvements)",
  "suggestions": ["list of specific suggestions"],
  "score": number from 1-10 for message quality
}

Focus on:
- Grammar and spelling errors
- Awkward phrasing or unclear sentences
- Professional tone consistency
- Flow and readability
- Personalization effectiveness

IMPORTANT: Always provide a correctedMessage, even if the original message is already good. Make at least minor improvements for clarity or professionalism.

Remember: Return ONLY the JSON object, no additional text or explanations.`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Grammar review failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.content && data.content[0] && data.content[0].text) {
      try {
        const aiResponse = data.content[0].text.trim();
        
        // Try to extract JSON from the response, handling cases where AI adds extra text
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const reviewResult = JSON.parse(jsonMatch[0]);
          
          // Validate the required fields
          if (typeof reviewResult.hasIssues === 'boolean' && 
              Array.isArray(reviewResult.suggestions) && 
              typeof reviewResult.score === 'number') {
            return reviewResult;
          } else {
            throw new Error('Missing required fields in review result');
          }
        } else {
          throw new Error('No JSON found in AI response');
        }
      } catch (parseError) {
        console.error('Failed to parse grammar review response:', parseError);
        console.log('Raw AI response:', data.content[0].text);
        throw new Error('Invalid review response format');
      }
    } else {
      throw new Error('Invalid response format from grammar review');
    }
  } catch (error) {
    console.warn('Grammar review failed:', error);
    
    // Return a fallback response
    return {
      hasIssues: false,
      suggestions: ['Grammar review service temporarily unavailable'],
      score: 8
    };
  }
};