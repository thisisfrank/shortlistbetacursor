import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') || 'your_anthropic_api_key_here',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
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
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`)
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
    console.error('Error generating summary:', error)
    
    // Return fallback summary on error
    const fallbackSummary = 'Experienced professional with a strong background in their field and relevant skills for the position.'
    
    return new Response(
      JSON.stringify({ summary: fallbackSummary }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  }
})