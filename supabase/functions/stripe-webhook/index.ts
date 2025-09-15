import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-12-18.acacia',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
)

// Map Stripe price IDs to database tier IDs
const PRICE_TO_TIER_MAPPING: Record<string, string> = {
  'price_1S7TO3Hb6LdHADWYvWMTutrj': '88c433cf-0a8d-44de-82fa-71c7dcbe31ff',    // Tier 1 (Basic)
  'price_1S7TOGHb6LdHADWYAu8g3h3f': 'f871eb1b-6756-447d-a1c0-20a373d1d5a2',  // Tier 2 (Premium) 
  'price_1S7TPaHb6LdHADWYhMgRw3YY': 'd8b7d6ae-8a44-49c9-9dc3-1c6b183815fd', // Tier 3 (Top Shelf)
}

const FREE_TIER_ID = '5841d1d6-20d7-4360-96f8-0444305fac5b'

async function updateUserTier(customerId: string, priceId: string | null, subscriptionStatus: string) {
  try {
    console.log(`🎯 Updating user tier for customer: ${customerId}, price: ${priceId}, status: ${subscriptionStatus}`)
    
    // Get user ID from user_profiles table
    const { data: customerData, error: customerError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (customerError) {
      console.error('❌ Error finding user for customer:', customerId, customerError)
      return
    }

    if (!customerData) {
      console.warn(`⚠️ No user found for Stripe customer: ${customerId}`)
      return
    }

    const userId = customerData.id
    console.log(`👤 Found user ID: ${userId} for customer: ${customerId}`)
    
    let targetTierId: string

    // Determine target tier based on subscription status and price
    if (subscriptionStatus === 'active' || subscriptionStatus === 'trialing') {
      targetTierId = priceId ? PRICE_TO_TIER_MAPPING[priceId] || FREE_TIER_ID : FREE_TIER_ID
      
      if (priceId && !PRICE_TO_TIER_MAPPING[priceId]) {
        console.warn(`⚠️ Unknown price ID: ${priceId}, defaulting to Free tier`)
      } else if (priceId) {
        console.log(`✅ Mapped price ${priceId} to tier ${targetTierId}`)
      }
    } else {
      targetTierId = FREE_TIER_ID
      console.log(`⬇️ Inactive subscription, downgrading to Free tier: ${targetTierId}`)
    }

    console.log(`🎯 Target tier ID: ${targetTierId} for user: ${userId}`)

    // Update user's tier and subscription status
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        tier_id: targetTierId,
        subscription_status: subscriptionStatus,
        stripe_customer_id: customerId
      })
      .eq('id', userId)

    if (updateError) {
      console.error('❌ Error updating user tier:', updateError)
      throw new Error('Failed to update user tier in database')
    }

    console.log(`✅ Successfully updated user ${userId} to tier ${targetTierId}`)
    
  } catch (error) {
    console.error(`💥 Error in updateUserTier:`, error)
    throw error
  }
}

async function syncCustomerFromStripe(customerId: string) {
  try {
    console.log(`🔄 Syncing customer from Stripe: ${customerId}`)

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
    })

    if (subscriptions.data.length === 0) {
      console.info(`⚠️ No subscriptions found for customer: ${customerId}`)
      return
    }

    const subscription = subscriptions.data[0]
    console.log(`📋 Subscription found: ${subscription.id}, status: ${subscription.status}`)

    const priceId = subscription.items.data[0].price.id
    await updateUserTier(customerId, priceId, subscription.status)
    
    console.info(`✅ Successfully synced subscription for customer: ${customerId}`)
  } catch (error) {
    console.error(`💥 Failed to sync subscription for customer ${customerId}:`, error)
    throw error
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  // Only accept POST requests for webhook
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })
  }

  try {
    // Get Stripe signature
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      console.log('❌ No Stripe signature found')
      return new Response('No signature found', { 
        status: 400, 
        headers: corsHeaders 
      })
    }

    // Get raw body
    const body = await req.text()

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = await stripe.webhooks.constructEventAsync(
        body, 
        signature, 
        Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
      )
      console.log('✅ Webhook signature verified successfully')
    } catch (error: any) {
      console.error(`❌ Webhook signature verification failed: ${error.message}`)
      return new Response(`Signature verification failed: ${error.message}`, { 
        status: 400, 
        headers: corsHeaders 
      })
    }

    // Process the event
    console.log(`🎉 WEBHOOK RECEIVED: ${event.type} at ${new Date().toISOString()}`)
    console.log(`📝 Event data:`, JSON.stringify(event.data.object, null, 2))
    
    const stripeData = event?.data?.object ?? {}

    if (!stripeData || !('customer' in stripeData)) {
      console.log(`❌ No customer data in event`)
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { customer: customerId } = stripeData

    if (!customerId || typeof customerId !== 'string') {
      console.error(`❌ Invalid customer ID: ${customerId}`)
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Handle subscription events
    switch (event.type) {
      case 'checkout.session.completed':
        const { mode } = stripeData as Stripe.Checkout.Session
        if (mode === 'subscription') {
          console.info(`🔄 Processing subscription checkout for customer: ${customerId}`)
          await syncCustomerFromStripe(customerId)
        }
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = stripeData as Stripe.Subscription
        const priceId = subscription.items.data[0].price.id
        console.info(`🔄 Processing subscription ${event.type} for customer: ${customerId}`)
        await updateUserTier(customerId, priceId, subscription.status)
        break

      case 'customer.subscription.deleted':
        console.info(`🔄 Processing subscription cancellation for customer: ${customerId}`)
        await updateUserTier(customerId, null, 'canceled')
        break

      case 'invoice.payment_failed':
        console.info(`💳 Payment failed for customer: ${customerId}`)
        await updateUserTier(customerId, null, 'past_due')
        break

      case 'invoice.payment_succeeded':
        console.info(`✅ Payment succeeded for customer: ${customerId}`)
        await syncCustomerFromStripe(customerId)
        break

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('💥 Error processing webhook:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})