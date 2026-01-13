// @ts-nocheck - Deno Edge Function (types not available in workspace)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const APIFY_ACTOR_ID = 'dev_fusion~linkedin-profile-scraper'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestData = await req.json()
    const { linkedinUrls } = requestData
    
    if (!linkedinUrls || !Array.isArray(linkedinUrls) || linkedinUrls.length === 0) {
      return new Response(
        JSON.stringify({ error: 'linkedinUrls array is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }
    
    // Get Apify API token from environment (secure, server-side)
    const apifyApiToken = Deno.env.get('APIFY_API_TOKEN')
    
    if (!apifyApiToken) {
      throw new Error('APIFY_API_TOKEN environment variable not set')
    }

    console.log(`🔍 Scraping ${linkedinUrls.length} LinkedIn profiles via Apify`)
    linkedinUrls.forEach((url: string, index: number) => {
      console.log(`  ${index + 1}. ${url}`)
    })

    // Call Apify Actor API (synchronous run that returns dataset items directly)
    const response = await fetch(
      `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items?token=${apifyApiToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileUrls: linkedinUrls
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Apify API error: ${response.status} - ${errorText}`)
      
      return new Response(
        JSON.stringify({ 
          error: `Apify API error: ${response.status}`,
          details: errorText,
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: response.status,
        },
      )
    }

    const profiles = await response.json()
    
    console.log(`✅ Successfully scraped ${profiles.length} profiles from Apify`)
    if (profiles.length < linkedinUrls.length) {
      console.warn(`⚠️ WARNING: Only ${profiles.length} out of ${linkedinUrls.length} profiles were returned`)
    }
    
    return new Response(
      JSON.stringify({ 
        profiles,
        success: true,
        count: profiles.length,
        requestedCount: linkedinUrls.length,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in apify-proxy:', error)
    
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
