export interface JobDescriptionRequest {
  title: string;
  mustHaveSkills: string[];
  companyName?: string;
  industry?: string;
  seniorityLevel?: string;
}

export const generateJobDescription = async (data: JobDescriptionRequest): Promise<string> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured');
    }

    // Build context-aware prompt
    const contextInfo = [];
    if (data.companyName) contextInfo.push(`Company: ${data.companyName}`);
    if (data.industry) contextInfo.push(`Industry: ${data.industry}`);
    if (data.seniorityLevel) contextInfo.push(`Experience Level: ${data.seniorityLevel}`);
    
    const contextSection = contextInfo.length > 0 
      ? `\n\nAdditional Context:\n${contextInfo.join('\n')}` 
      : '';

    const prompt = `Generate a professional job description for the following position:

Position Title: ${data.title}
Required Skills: ${data.mustHaveSkills.join(', ')}${contextSection}

Create a compelling 1-2 paragraph job description that:
- Starts with a brief company/role overview
- Highlights key responsibilities and impact
- Emphasizes the required skills (${data.mustHaveSkills.join(', ')})
- Mentions growth opportunities or benefits

Keep it concise, professional, and engaging to attract top talent. Focus on what makes this role exciting and impactful.

Return only the job description text, no additional formatting or headers.`;

    // Call Anthropic API via our proxy
    const response = await fetch(`${supabaseUrl}/functions/v1/anthropic-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 400, // Shorter for 1-2 paragraphs
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Job description generation failed: ${response.status}`);
    }

    const data_response = await response.json();
    
    // Parse Anthropic response
    if (data_response.content && data_response.content.length > 0 && data_response.content[0].text) {
      return data_response.content[0].text.trim();
    } else {
      throw new Error('Invalid response format from AI service');
    }
  } catch (error) {
    console.error('Job description generation error:', error);
    
    // Provide a fallback description
    return generateFallbackDescription(data);
  }
};

const generateFallbackDescription = (data: JobDescriptionRequest): string => {
  const { title, mustHaveSkills, companyName, seniorityLevel } = data;
  
  const companyText = companyName ? `${companyName} is` : 'We are';
  const levelText = seniorityLevel ? ` ${seniorityLevel.toLowerCase()}` : '';
  
  return `${companyText} seeking a talented${levelText} ${title} to join our growing team. This role offers the opportunity to work with cutting-edge technologies and make a significant impact on our products and services.

The ideal candidate will have strong expertise in ${mustHaveSkills.join(', ')} and be passionate about delivering high-quality solutions. You'll collaborate with cross-functional teams, contribute to technical decisions, and help drive innovation while growing your career in a supportive environment.`;
};
