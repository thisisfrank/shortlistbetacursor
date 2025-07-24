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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { candidateData }: { candidateData: CandidateData } = await req.json()

    // Get Supabase URL for calling the anthropic-proxy function
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured')
    }

    // Use the anthropic-proxy function instead of direct API calls
    const response = await fetchWithTimeout(`${supabaseUrl}/functions/v1/anthropic-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
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
    }, 15000) // 15 second timeout

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Anthropic proxy error: ${response.status} - ${errorText}`)
      throw new Error(`Anthropic proxy error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
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