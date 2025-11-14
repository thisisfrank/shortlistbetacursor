import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestData = await req.json()
    const { linkedinUrl, dynamic = true, premium = true } = requestData
    
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

    // Encode the LinkedIn URL
    const encodedUrl = encodeURIComponent(linkedinUrl)
    
    // Build ScrapingDog API URL with dynamic rendering enabled for JavaScript
    const apiUrl = `https://api.scrapingdog.com/scrape?api_key=${scrapingDogApiKey}&url=${encodedUrl}&dynamic=${dynamic}&premium=${premium}`
    
    console.log(`🔍 Scraping LinkedIn profile: ${linkedinUrl}`)

    // Call ScrapingDog API
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

    const html = await response.text()
    console.log(`✅ Successfully scraped profile (${html.length} characters)`)
    
    return new Response(
      JSON.stringify({ 
        html,
        success: true,
        length: html.length
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

