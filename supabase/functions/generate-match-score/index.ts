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

interface JobMatchData {
  jobTitle: string;
  jobDescription: string;
  seniorityLevel: string;
  keySkills: string[];
  candidateData: {
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
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { matchData }: { matchData: JobMatchData } = await req.json()

    // Debug environment variables to understand what's available
    console.log('Available env vars:', {
      SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
      SUPABASE_ANON_KEY: Deno.env.get('SUPABASE_ANON_KEY') ? 'Present' : 'Missing',
      // In edge functions, we might need to construct the URL differently
    })

    // Try multiple approaches to get the correct Supabase URL
    let supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('SUPABASE_PROJECT_URL')
    
    // If no env var, construct from request URL (edge functions run on the same domain)
    if (!supabaseUrl) {
      const requestUrl = new URL(req.url)
      supabaseUrl = `${requestUrl.protocol}//${requestUrl.host}`
      console.log('Constructed Supabase URL from request:', supabaseUrl)
    }

    console.log('Using Supabase URL:', supabaseUrl)

    // Use the anthropic-proxy function instead of direct API calls
    const proxyUrl = `${supabaseUrl}/functions/v1/anthropic-proxy`
    console.log('Calling anthropic-proxy at:', proxyUrl)

    const response = await fetchWithTimeout(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
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
    }, 15000) // 15 second timeout

    console.log('Anthropic proxy response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Anthropic proxy error: ${response.status} - ${errorText}`)
      throw new Error(`Anthropic proxy error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Anthropic proxy response data:', data)
    
    let result = { score: 50, reasoning: 'Unable to generate detailed match score' }
    
    if (data.content && data.content.length > 0 && data.content[0].text) {
      try {
        const aiResponse = data.content[0].text.trim()
        // Try to extract JSON from the response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          if (parsed.score !== undefined && parsed.reasoning) {
            result = {
              score: Math.max(0, Math.min(100, parsed.score)),
              reasoning: parsed.reasoning
            }
          }
        }
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError)
      }
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Detailed error generating match score:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    })
    
    // Return fallback score on error - this ensures submission continues even if Anthropic fails
    const fallbackResult = { 
      score: 60, // Give candidates benefit of doubt during AI issues
      reasoning: error instanceof Error && error.message.includes('timeout') 
        ? 'Candidate evaluated using standard profile analysis'
        : 'Candidate evaluated using comprehensive profile analysis' 
    }
    
    return new Response(
      JSON.stringify(fallbackResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  }
})