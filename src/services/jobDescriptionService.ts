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

export interface FormatJobDescriptionRequest {
  description: string;
  title: string;
  companyName?: string;
  seniorityLevel?: string;
}

export const formatJobDescription = async (data: FormatJobDescriptionRequest): Promise<string> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured');
    }

    // Build context for better formatting
    const contextInfo = [];
    if (data.companyName) contextInfo.push(`Company: ${data.companyName}`);
    if (data.title) contextInfo.push(`Position: ${data.title}`);
    if (data.seniorityLevel) contextInfo.push(`Level: ${data.seniorityLevel}`);
    
    const contextSection = contextInfo.length > 0 
      ? `\n\nContext:\n${contextInfo.join('\n')}` 
      : '';

    const prompt = `Format this job description to be clean and well-organized while preserving ALL content and meaning exactly as stated:

${data.description}${contextSection}

FORMATTING GUIDELINES:
- Keep all original ideas, points, and information exactly as written - DO NOT rephrase or rewrite
- If the description is already well-formatted, respect and preserve that structure
- If the description needs structure, organize it into this preferred format:

  Overview: (2-3 sentences introducing the role/company)
  
  Main Responsibilities: 
  - (4-6 bullet points of key duties)
  
  Qualifications:
  - (4-6 bullet points of requirements)

- Use actual bullet characters (•, -, or *) for lists
- Add section headers (Overview:, Main Responsibilities:, Qualifications:, etc.) if missing
- Ensure proper spacing between sections
- If content doesn't fit this structure perfectly, organize it in the most logical way
- The goal is to make it clean and readable, not to rewrite it

Return only the formatted job description, no explanations.`;

    // Call Anthropic API via our proxy
    const response = await fetch(`${supabaseUrl}/functions/v1/anthropic-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 800, // More tokens for formatting longer descriptions
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Job description formatting failed: ${response.status}`);
    }

    const data_response = await response.json();
    
    // Parse Anthropic response
    if (data_response.content && data_response.content.length > 0 && data_response.content[0].text) {
      return data_response.content[0].text.trim();
    } else {
      throw new Error('Invalid response format from AI service');
    }
  } catch (error) {
    console.error('Job description formatting error:', error);
    // If formatting fails, return the original description
    return data.description;
  }
};