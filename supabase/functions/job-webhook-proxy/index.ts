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
    const webhookUrl = Deno.env.get('JOB_WEBHOOK_URL')
    
    if (!webhookUrl) {
      console.log('📞 No webhook URL configured, skipping')
      return new Response(
        JSON.stringify({ success: true, skipped: true }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    console.log(`📞 Forwarding job webhook to Make.com`)
    console.log(`📦 Payload: ${JSON.stringify({
      jobId: payload.jobId,
      title: payload.title,
      userEmail: payload.userEmail
    })}`)

    // Forward to Make.com with retry logic
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

    console.log(`✅ Job webhook sent successfully to Make.com`)
    
    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('💥 Error in job-webhook-proxy:', error)
    
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

