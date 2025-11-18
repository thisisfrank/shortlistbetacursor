// @ts-nocheck - Deno Edge Function (types not available in workspace)
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
    const payload = await req.json()
    
    // Get webhook URL from environment
    const webhookUrl = Deno.env.get('REQUEST_MORE_CANDIDATES_WEBHOOK_URL')
    
    if (!webhookUrl) {
      console.log('📞 No request more candidates webhook configured, skipping')
      return new Response(
        JSON.stringify({ success: true, skipped: true }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    console.log(`📞 Forwarding request more candidates webhook to Make.com`)
    console.log(`📦 Payload: ${JSON.stringify({
      jobId: payload.jobId,
      title: payload.title,
      additionalCandidatesRequested: payload.additionalCandidatesRequested,
      userEmail: payload.userEmail
    })}`)

    // Forward to Make.com
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ShortlistApp/1.0',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Webhook failed: ${response.status} - ${errorText}`)
      throw new Error(`Webhook failed: ${response.status}`)
    }

    console.log(`✅ Request more candidates webhook sent successfully to Make.com`)
    
    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('💥 Error in request-more-candidates-proxy:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

