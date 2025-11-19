// @ts-nocheck - Deno Edge Function (types not available in workspace)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to extract LinkedIn profile ID from URL
const extractProfileId = (linkedinUrl: string): string | null => {
  try {
    // Handle various LinkedIn URL formats:
    // https://www.linkedin.com/in/john-doe/
    // https://linkedin.com/in/john-doe
    // http://www.linkedin.com/in/john-doe/
    const match = linkedinUrl.match(/linkedin\.com\/in\/([^\/\?]+)/i)
    return match ? match[1] : null
  } catch (error) {
    console.error('Error extracting profile ID:', error)
    return null
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestData = await req.json()
    const { linkedinUrl, premium = true } = requestData
    
    if (!linkedinUrl) {
      return new Response(
        JSON.stringify({ error: 'LinkedIn URL is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }
    
    // Get ScrapingDog API key from environment
    const scrapingDogApiKey = Deno.env.get('SCRAPINGDOG_API_KEY')
    
    if (!scrapingDogApiKey) {
      throw new Error('SCRAPINGDOG_API_KEY environment variable not set')
    }

    // Extract profile ID from LinkedIn URL
    const profileId = extractProfileId(linkedinUrl)
    
    if (!profileId) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid LinkedIn URL format',
          details: 'Could not extract profile ID from URL. Expected format: linkedin.com/in/username',
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }
    
    // Build ScrapingDog LinkedIn Profile API URL
    const apiUrl = `https://api.scrapingdog.com/profile?api_key=${scrapingDogApiKey}&id=${profileId}&type=profile&premium=${premium}`
    
    console.log(`🔍 Scraping LinkedIn profile: ${linkedinUrl} (ID: ${profileId})`)

    // Call ScrapingDog LinkedIn Profile API
    const response = await fetch(apiUrl)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`ScrapingDog API error: ${response.status} - ${errorText}`)
      
      return new Response(
        JSON.stringify({ 
          error: `ScrapingDog API error: ${response.status}`,
          details: errorText,
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: response.status,
        },
      )
    }

    // Parse the JSON response from ScrapingDog
    const responseData = await response.json()
    
    // ScrapingDog returns an array of profiles, get the first one
    const profileData = Array.isArray(responseData) ? responseData[0] : responseData
    
    // DEBUG: Log the experience data to see what we're actually getting
    console.log(`✅ Successfully scraped profile: ${profileData?.fullName || profileData?.first_name || 'Unknown'}`)
    console.log('📊 Experience data received:', JSON.stringify(profileData?.experience, null, 2))
    
    return new Response(
      JSON.stringify({ 
        profile: profileData,
        success: true,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in scrapingdog-proxy:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

