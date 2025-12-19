// @ts-nocheck - Deno Edge Function (types not available in workspace)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// GHL Webhook URLs (hardcoded - same as in ghlService.ts)
const GHL_WEBHOOKS: Record<string, string> = {
  'signup_thank_you': 'https://services.leadconnectorhq.com/hooks/QekUNBmcxjsxAKXluQc0/webhook-trigger/cecc5aea-aa4b-4c1a-9f45-4bff80833367',
  'job_submission': 'https://services.leadconnectorhq.com/hooks/QekUNBmcxjsxAKXluQc0/webhook-trigger/543083ea-d7ab-4ef5-8f87-dc35b3ed868b',
  'job_completion': 'https://services.leadconnectorhq.com/hooks/QekUNBmcxjsxAKXluQc0/webhook-trigger/2c183ff3-08a7-4fcc-bc4d-aa0d55a9f636',
  'plan_purchase': 'https://services.leadconnectorhq.com/hooks/QekUNBmcxjsxAKXluQc0/webhook-trigger/72bfee45-a750-4adb-b4d0-f492f641754c',
  'feedback': 'https://services.leadconnectorhq.com/hooks/QekUNBmcxjsxAKXluQc0/webhook-trigger/238d8a85-b4fc-4580-a379-102f69801702',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { webhookType, payload } = await req.json()
    
    // Validate webhook type
    const webhookUrl = GHL_WEBHOOKS[webhookType]
    if (!webhookUrl) {
      console.error(`❌ Invalid webhook type: ${webhookType}`)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Invalid webhook type: ${webhookType}. Valid types: ${Object.keys(GHL_WEBHOOKS).join(', ')}` 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log(`📞 Forwarding GHL webhook: ${webhookType}`)
    console.log(`📦 Payload preview: ${JSON.stringify({
      event: payload.event,
      userEmail: payload.userData?.email || payload.userProfile?.email || payload.userEmail || 'N/A',
    })}`)

    // Forward to GHL
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ShortlistApp/1.0',
      },
      body: JSON.stringify(payload),
    })

    const responseText = await response.text()
    
    if (!response.ok) {
      console.error(`❌ GHL webhook failed: ${response.status} - ${responseText}`)
      throw new Error(`GHL webhook failed: ${response.status} - ${responseText}`)
    }

    console.log(`✅ GHL ${webhookType} webhook sent successfully`)
    
    return new Response(
      JSON.stringify({ success: true, webhookType }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('💥 Error in ghl-webhook-proxy:', error)
    
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

