import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Add timeout helper function
const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs = 15000): Promise<Response> => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - Anthropic API took too long to respond')
    }
    throw error
  }
}

interface CandidateData {
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { candidateData }: { candidateData: CandidateData } = await req.json()

    // Calculate years of experience and extract industries
    const yearsOfExperience = calculateYearsOfExperience(candidateData.experience);
    const industries = extractIndustries(candidateData.experience);

    // Debug environment variables to understand what's available
    console.log('Summary function - Available env vars:', {
      SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
      SUPABASE_ANON_KEY: Deno.env.get('SUPABASE_ANON_KEY') ? 'Present' : 'Missing',
    })

    // Try multiple approaches to get the correct Supabase URL
    let supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('SUPABASE_PROJECT_URL')
    
    // If no env var, construct from request URL (edge functions run on the same domain)
    if (!supabaseUrl) {
      const requestUrl = new URL(req.url)
      supabaseUrl = `${requestUrl.protocol}//${requestUrl.host}`
      console.log('Summary - Constructed Supabase URL from request:', supabaseUrl)
    }

    console.log('Summary - Using Supabase URL:', supabaseUrl)

    // Use the anthropic-proxy function instead of direct API calls
    const proxyUrl = `${supabaseUrl}/functions/v1/anthropic-proxy`
    console.log('Summary - Calling anthropic-proxy at:', proxyUrl)

    const response = await fetchWithTimeout(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: `Based on the following candidate information, write a professional summary in exactly 2-3 sentences maximum that highlights their key qualifications, experience, and value proposition. IMPORTANT: Include their total years of experience and list their other industries/companies as bullet points.

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

Format your response as follows:
[2-3 sentence professional summary that mentions their ${yearsOfExperience} years of experience]

Other Industries/Companies:
${industries.length > 0 ? industries.map(company => `• ${company}`).join('\n') : '• No additional companies listed'}`
          }
        ]
      })
    }, 15000) // 15 second timeout

    console.log('Summary - Anthropic proxy response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Summary - Anthropic proxy error: ${response.status} - ${errorText}`)
      throw new Error(`Anthropic proxy error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Summary - Anthropic proxy response data:', data)
    
    let summary = 'Professional candidate with relevant experience and skills.'
    
    if (data.content && data.content.length > 0 && data.content[0].text) {
      summary = data.content[0].text.trim()
    }

    return new Response(
      JSON.stringify({ summary }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Detailed error generating summary:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    })
    
    // Return fallback summary on error - this ensures submission continues even if Anthropic fails
    const fallbackSummary = error instanceof Error && error.message.includes('timeout') 
      ? 'Experienced professional with strong background and relevant expertise for the role'
      : 'Experienced professional with a strong background in their field and relevant skills for the position.'
    
    return new Response(
      JSON.stringify({ summary: fallbackSummary }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  }
})