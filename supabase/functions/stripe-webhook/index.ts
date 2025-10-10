// @ts-nocheck - Deno edge function (not Node.js)
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

// Disable JWT verification for webhooks
Deno.env.set('SUPABASE_AUTH_VERIFY_JWT', 'false')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  // Use default http client for better Deno compatibility
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Map payment link URLs to database tier IDs (UPDATED with new payment links)
const PAYMENT_LINK_TO_TIER_MAPPING: Record<string, string> = {
  'https://buy.stripe.com/test_00w14neF09lNgjLd2h9R603': '88c433cf-0a8d-44de-82fa-71c7dcbe31ff',    // Starter - 100 credits
  'https://buy.stripe.com/test_6oU7sLgN89lNaZr8M19R604': 'f871eb1b-6756-447d-a1c0-20a373d1d5a2',  // Pro - 400 credits
  'https://buy.stripe.com/test_14AaEX40m0PhgjL1jz9R605': 'd8b7d6ae-8a44-49c9-9dc3-1c6b183815fd', // Beast Mode - 2500 credits
}

// Also keep price mapping as fallback for subscription events
const PRICE_TO_TIER_MAPPING: Record<string, string> = {
  'price_1S7TO3Hb6LdHADWYvWMTutrj': '88c433cf-0a8d-44de-82fa-71c7dcbe31ff',    // Basic tier
  'price_1S7TOGHb6LdHADWYAu8g3h3f': 'f871eb1b-6756-447d-a1c0-20a373d1d5a2',  // Premium tier
  'price_1S7TPaHb6LdHADWYhMgRw3YY': 'd8b7d6ae-8a44-49c9-9dc3-1c6b183815fd', // Top Shelf tier
}

// Map credit pack price IDs to credit amounts
const CREDIT_PACK_MAPPING: Record<string, number> = {
  'price_1SGU4JQZ6mxDPDqbVdt9aXBb': 100,   // 100 credits
  'price_1SGU5AQZ6mxDPDqb9PgcCeM5': 250,   // 250 credits
  'price_1SGU5bQZ6mxDPDqbRASYzbqQ': 500,   // 500 credits
}

const FREE_TIER_ID = '5841d1d6-20d7-4360-96f8-0444305fac5b'

// Function to identify tier from checkout session (for Payment Links)
async function getTierFromCheckoutSession(sessionId: string): Promise<string | null> {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'line_items.data.price']
    })
    
    console.log(`🔍 Analyzing checkout session: ${sessionId}`)
    
    // Method 1: Check if there's a payment link URL in session metadata
    if (session.metadata && session.metadata.payment_link_url) {
      const tierId = PAYMENT_LINK_TO_TIER_MAPPING[session.metadata.payment_link_url]
      if (tierId) {
        console.log(`✅ Found tier from payment link metadata: ${tierId}`)
        return tierId
      }
    }
    
    // Method 2: Get tier from price ID (fallback)
    if (session.line_items?.data?.[0]?.price?.id) {
      const priceId = session.line_items.data[0].price.id
      const tierId = PRICE_TO_TIER_MAPPING[priceId]
      if (tierId) {
        console.log(`✅ Found tier from price ID: ${priceId} -> ${tierId}`)
        return tierId
      }
      console.warn(`⚠️ Unknown price ID: ${priceId}`)
    }
    
    console.warn(`⚠️ Could not determine tier from checkout session ${sessionId}`)
    return null
    
  } catch (error) {
    console.error(`❌ Error retrieving checkout session ${sessionId}:`, error)
    return null
  }
}

async function cancelExistingSubscriptions(customerId: string, excludeSubscriptionId?: string) {
  try {
    console.log(`🔄 Checking for existing subscriptions for customer: ${customerId}`)
    
    // Get all active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 100
    })
    
    const subscriptionsToCancel = excludeSubscriptionId 
      ? subscriptions.data.filter(sub => sub.id !== excludeSubscriptionId)
      : subscriptions.data
    
    if (subscriptionsToCancel.length === 0) {
      console.log(`✅ No existing subscriptions to cancel for customer: ${customerId}`)
      return
    }
    
    console.log(`⚠️ Found ${subscriptionsToCancel.length} existing subscriptions to cancel`)
    
    // Cancel each existing subscription
    for (const subscription of subscriptionsToCancel) {
      try {
        await stripe.subscriptions.cancel(subscription.id)
        console.log(`✅ Canceled subscription: ${subscription.id}`)
      } catch (error) {
        console.error(`❌ Failed to cancel subscription ${subscription.id}:`, error)
      }
    }
    
  } catch (error) {
    console.error(`❌ Error checking/canceling existing subscriptions:`, error)
  }
}

async function updateUserTier(customerId: string, tierId: string | null, subscriptionStatus: string, newSubscriptionId?: string) {
  try {
    console.log(`🎯 Updating user tier for customer: ${customerId}, tier: ${tierId}, status: ${subscriptionStatus}`)
    
    // Get customer email from Stripe first
    const stripeCustomer = await stripe.customers.retrieve(customerId)
    
    if (!stripeCustomer || stripeCustomer.deleted || !stripeCustomer.email) {
      console.error('❌ No email found for Stripe customer:', customerId)
      return
    }

    const customerEmail = stripeCustomer.email
    console.log(`📧 Looking up user by email: ${customerEmail}`)

    // Find user by email (primary lookup method) - include current credits
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('id, email, stripe_customer_id, available_credits, tier_id')
      .eq('email', customerEmail)
      .single()

    if (userError || !userData) {
      console.error('❌ No user found with email:', customerEmail, userError)
      return
    }

    const userId = userData.id
    console.log(`👤 Found user ID: ${userId} for email: ${customerEmail}`)
    
    // IMPORTANT: Cancel existing subscriptions to prevent duplicates
    if (subscriptionStatus === 'active' && tierId !== FREE_TIER_ID) {
      console.log(`🚫 User upgrading to paid tier - checking for existing subscriptions to cancel`)
      await cancelExistingSubscriptions(customerId, newSubscriptionId)
    }
    
    // Update stripe_customer_id if it's not set (for future reference)
    if (!userData.stripe_customer_id) {
      const { error: updateCustomerError } = await supabase
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)

      if (!updateCustomerError) {
        console.log(`🔗 Linked user ${userId} to Stripe customer ${customerId}`)
      }
    }
    
    let targetTierId: string

    // Determine target tier based on subscription status
    if (subscriptionStatus === 'active' || subscriptionStatus === 'trialing') {
      targetTierId = tierId || FREE_TIER_ID
      console.log(`✅ Setting tier to: ${targetTierId}`)
    } else {
      targetTierId = FREE_TIER_ID
      console.log(`⬇️ Inactive subscription, downgrading to Free tier: ${targetTierId}`)
    }

    console.log(`🎯 Target tier ID: ${targetTierId} for user: ${userId}`)

    // Calculate new credit balance when upgrading
    let newCreditBalance = userData.available_credits || 0
    
    if (targetTierId !== FREE_TIER_ID && targetTierId !== userData.tier_id) {
      // User is upgrading to a paid tier - add credits from new tier
      const { data: tierData } = await supabase
        .from('tiers')
        .select('monthly_candidate_allotment')
        .eq('id', targetTierId)
        .single()
      
      if (tierData?.monthly_candidate_allotment) {
        const currentCredits = userData.available_credits || 0
        const tierCredits = tierData.monthly_candidate_allotment
        newCreditBalance = currentCredits + tierCredits
        
        console.log(`💳 Credit calculation: ${currentCredits} existing + ${tierCredits} from tier = ${newCreditBalance} total`)
        
        // Log credit transaction for audit trail
        await supabase.from('credit_transactions').insert({
          user_id: userId,
          transaction_type: 'addition',
          amount: tierCredits,
          description: `Tier upgrade credit bonus: ${tierCredits} credits added`
        })
      }
    }

    // Update user's tier, subscription status, and credits
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        tier_id: targetTierId,
        subscription_status: subscriptionStatus,
        stripe_customer_id: customerId,
        available_credits: newCreditBalance
      })
      .eq('id', userId)

    if (updateError) {
      console.error('❌ Error updating user tier:', updateError)
      throw new Error('Failed to update user tier in database')
    }

    console.log(`✅ Successfully updated user ${userId} to tier ${targetTierId} with ${newCreditBalance} credits`)
    
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
    const tierId = PRICE_TO_TIER_MAPPING[priceId] || null
    await updateUserTier(customerId, tierId, subscription.status, subscription.id)
    
    console.info(`✅ Successfully synced subscription for customer: ${customerId}`)
  } catch (error) {
    console.error(`💥 Failed to sync subscription for customer ${customerId}:`, error)
    throw error
  }
}

async function renewMonthlyCredits(customerId: string) {
  try {
    console.log(`💳 Starting credit renewal for customer: ${customerId}`)
    
    // Get customer email from Stripe
    const stripeCustomer = await stripe.customers.retrieve(customerId)
    
    if (!stripeCustomer || stripeCustomer.deleted || !stripeCustomer.email) {
      console.error('❌ No email found for Stripe customer:', customerId)
      return
    }

    const customerEmail = stripeCustomer.email
    console.log(`📧 Looking up user by email: ${customerEmail}`)

    // Get user with their tier information
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        email,
        available_credits,
        tier_id,
        tiers!inner(
          id,
          name,
          monthly_candidate_allotment
        )
      `)
      .eq('email', customerEmail)
      .single()

    if (userError || !userData) {
      console.error('❌ No user found with email:', customerEmail, userError)
      return
    }

    // Don't renew credits for free tier
    if (userData.tier_id === FREE_TIER_ID) {
      console.log(`⚠️ User is on free tier - skipping credit renewal`)
      return
    }

    const userId = userData.id
    const tierCredits = userData.tiers.monthly_candidate_allotment
    const currentCredits = userData.available_credits || 0
    const newCreditBalance = currentCredits + tierCredits

    console.log(`💰 Credit renewal: ${currentCredits} existing + ${tierCredits} tier credits = ${newCreditBalance} total`)

    // Calculate next renewal date (30 days from now)
    const nextResetDate = new Date()
    nextResetDate.setDate(nextResetDate.getDate() + 30)

    // Update user's credits and reset date
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        available_credits: newCreditBalance,
        credits_reset_date: nextResetDate.toISOString(),
        subscription_period_end: nextResetDate.toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('❌ Error updating user credits:', updateError)
      throw new Error('Failed to update user credits in database')
    }

    // Log credit transaction for audit trail
    await supabase.from('credit_transactions').insert({
      user_id: userId,
      transaction_type: 'addition',
      amount: tierCredits,
      description: `Monthly credit renewal: ${tierCredits} credits added`
    })

    console.log(`✅ Successfully renewed ${tierCredits} credits for user ${userId} (${userData.tiers.name} tier)`)
    
  } catch (error) {
    console.error(`💥 Error in renewMonthlyCredits:`, error)
    throw error
  }
}

async function addTopOffCredits(customerId: string, priceId: string) {
  try {
    console.log(`💰 Processing credit top-off for customer: ${customerId}, price: ${priceId}`)
    
    // Get credits amount from price ID
    const creditsToAdd = CREDIT_PACK_MAPPING[priceId]
    if (!creditsToAdd) {
      console.warn(`⚠️ Unknown credit pack price ID: ${priceId}`)
      return
    }
    
    console.log(`📦 Credit pack identified: ${creditsToAdd} credits`)
    
    // Get customer email from Stripe
    const stripeCustomer = await stripe.customers.retrieve(customerId)
    if (!stripeCustomer || stripeCustomer.deleted || !stripeCustomer.email) {
      console.error('❌ No email found for Stripe customer:', customerId)
      return
    }

    const customerEmail = stripeCustomer.email
    console.log(`📧 Looking up user by email: ${customerEmail}`)

    // Get user
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('id, available_credits, name')
      .eq('email', customerEmail)
      .single()

    if (userError || !userData) {
      console.error('❌ No user found:', userError)
      return
    }

    const currentCredits = userData.available_credits || 0
    const newBalance = currentCredits + creditsToAdd

    console.log(`💳 Credit calculation: ${currentCredits} existing + ${creditsToAdd} top-off = ${newBalance} total`)

    // Update credits
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ available_credits: newBalance })
      .eq('id', userData.id)

    if (updateError) {
      console.error('❌ Error updating credits:', updateError)
      throw updateError
    }

    // Log transaction
    await supabase.from('credit_transactions').insert({
      user_id: userData.id,
      transaction_type: 'addition',
      amount: creditsToAdd,
      description: `Credit top-off purchase: ${creditsToAdd} credits added`
    })

    console.log(`✅ Successfully added ${creditsToAdd} credits to user ${userData.id}, new balance: ${newBalance}`)
    
  } catch (error) {
    console.error(`💥 Error adding top-off credits:`, error)
    throw error
  }
}

serve(async (req) => {
  console.log(`🎯 Webhook called: ${req.method} ${req.url}`)
  console.log(`🔍 Headers:`, Object.fromEntries(req.headers.entries()))
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  // Add a simple GET endpoint for testing
  if (req.method === 'GET') {
    console.log('🧪 Webhook test endpoint called')
    return new Response(JSON.stringify({ 
      status: 'stripe_webhook_online',
      message: 'Stripe webhook function is running',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
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
        const session = stripeData as Stripe.Checkout.Session
        console.info(`✅ Checkout completed for customer: ${customerId}, mode: ${session.mode}`)
        
        if (session.mode === 'subscription') {
          // For subscription mode, get tier from checkout session
          const tierId = await getTierFromCheckoutSession(session.id)
          if (tierId) {
            // Pass the new subscription ID to avoid canceling it
            await updateUserTier(customerId, tierId, 'active', session.subscription as string)
            
            // Send plan purchase welcome email via GHL webhook
            try {
              // Get customer and user details
              const stripeCustomer = await stripe.customers.retrieve(customerId)
              if (stripeCustomer && !stripeCustomer.deleted && stripeCustomer.email) {
                // Get tier details from database
                const { data: tierData } = await supabase
                  .from('tiers')
                  .select('name, monthly_candidate_allotment')
                  .eq('id', tierId)
                  .single()
                
                // Get user name from database
                const { data: userData } = await supabase
                  .from('user_profiles')
                  .select('name')
                  .eq('email', stripeCustomer.email)
                  .single()
                
                if (tierData) {
                  const userName = userData?.name || stripeCustomer.email.split('@')[0]
                  
                  // Call GHL webhook to send welcome email
                  const ghlWebhookUrl = 'https://services.leadconnectorhq.com/hooks/QekUNBmcxjsxAKXluQc0/webhook-trigger/72bfee45-a750-4adb-b4d0-f492f641754c'
                  
                  const ghlPayload = {
                    event: 'plan_purchase_welcome',
                    userEmail: stripeCustomer.email,
                    userName: userName,
                    planDetails: {
                      tierName: tierData.name,
                      tierId: tierId,
                      creditsGranted: tierData.monthly_candidate_allotment,
                    },
                    clayReferralLink: 'https://clay.com?via=bae546',
                    clayReferralBonus: 3000,
                    welcomeMessage: `Welcome to ${tierData.name}! You now have ${tierData.monthly_candidate_allotment} candidate credits available.`,
                    timestamp: new Date().toISOString(),
                  }
                  
                  const ghlResponse = await fetch(ghlWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(ghlPayload),
                  })
                  
                  if (ghlResponse.ok) {
                    console.log('✅ Plan purchase welcome email triggered via GHL webhook')
                  } else {
                    console.warn(`⚠️ GHL webhook failed: ${ghlResponse.status}`)
                  }
                }
              }
            } catch (ghlError) {
              console.error('❌ Error sending plan purchase welcome email:', ghlError)
              // Don't fail the webhook if email notification fails
            }
          } else {
            console.warn(`⚠️ Could not determine tier for checkout session ${session.id}, syncing from Stripe`)
            await syncCustomerFromStripe(customerId)
          }
        } else if (session.mode === 'payment') {
          // For one-time payments, check if it's a credit pack purchase
          try {
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
            const priceId = lineItems.data[0]?.price?.id
            
            if (priceId && CREDIT_PACK_MAPPING[priceId]) {
              // This is a credit top-off purchase
              console.log(`🎯 Detected credit pack purchase: ${priceId}`)
              await addTopOffCredits(customerId, priceId)
            } else {
              // Existing one-time payment tier logic
              const tierId = await getTierFromCheckoutSession(session.id)
              if (tierId) {
                await updateUserTier(customerId, tierId, 'active')
              }
            }
          } catch (error) {
            console.error('❌ Error processing one-time payment:', error)
          }
        }
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = stripeData as Stripe.Subscription
        const priceId = subscription.items.data[0].price.id
        const tierId = PRICE_TO_TIER_MAPPING[priceId] || null
        console.info(`🔄 Processing subscription ${event.type} for customer: ${customerId}`)
        // Pass the subscription ID to avoid canceling the current one
        await updateUserTier(customerId, tierId, subscription.status, subscription.id)
        break

      case 'customer.subscription.deleted':
        console.info(`🔄 Processing subscription cancellation for customer: ${customerId}`)
        await updateUserTier(customerId, FREE_TIER_ID, 'canceled')
        break

      case 'invoice.payment_failed':
        console.info(`💳 Payment failed for customer: ${customerId}`)
        await updateUserTier(customerId, FREE_TIER_ID, 'past_due')
        break

      case 'invoice.payment_succeeded':
        const invoice = stripeData as Stripe.Invoice
        console.info(`✅ Payment succeeded for customer: ${customerId}`)
        
        // Check if this is a recurring payment (not the first invoice)
        // billing_reason 'subscription_cycle' means it's a renewal
        if (invoice.billing_reason === 'subscription_cycle') {
          console.log(`🔄 Recurring payment detected - processing credit renewal`)
          await renewMonthlyCredits(customerId)
        } else {
          console.log(`ℹ️ First payment or manual invoice - no credit renewal needed`)
        }
        
        // Still sync subscription status
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