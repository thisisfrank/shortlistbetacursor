import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

// Map Stripe price IDs to database tier IDs
const PRICE_TO_TIER_MAPPING: Record<string, string> = {
  'price_1Rl1MuFPYYAarocke0oZgczA': '88c433cf-0a8d-44de-82fa-71c7dcbe31ff',    // Tier 1 (Basic)
  'price_1Rl1N5FPYYAarock0dFT7x9Q': 'f871eb1b-6756-447d-a1c0-20a373d1d5a2',  // Tier 2 (Premium) 
  'price_1Rl1NJFPYYAarockbgLtNiKk': 'd8b7d6ae-8a44-49c9-9dc3-1c6b183815fd', // Tier 3 (Top Shelf)
};

const FREE_TIER_ID = '5841d1d6-20d7-4360-96f8-0444305fac5b';

// Function to update user tier based on subscription
async function updateUserTier(customerId: string, priceId: string | null, subscriptionStatus: string) {
  try {
    console.log(`🎯 Updating user tier for customer: ${customerId}, price: ${priceId}, status: ${subscriptionStatus}`);
    
    // TEMPORARY: Log price ID for mapping purposes
    if (priceId) {
      console.log(`🔍 PRICE ID DETECTED: ${priceId} - Add this to PRICE_TO_TIER_MAPPING`);
      console.log(`🗺️ Current mapping:`, JSON.stringify(PRICE_TO_TIER_MAPPING, null, 2));
    }
    
    // Get user ID from stripe_customers table
    const { data: customerData, error: customerError } = await supabase
      .from('stripe_customers')
      .select('user_id')
      .eq('customer_id', customerId)
      .single();

    if (customerError) {
      console.error('❌ Error finding user for customer:', customerId, customerError);
      return;
    }

    if (!customerData) {
      console.warn(`⚠️ No user found for Stripe customer: ${customerId}`);
      return;
    }

    const userId = customerData.user_id;
    console.log(`👤 Found user ID: ${userId} for customer: ${customerId}`);
    
    let targetTierId: string;

    // Determine target tier based on subscription status and price
    if (subscriptionStatus === 'active' || subscriptionStatus === 'trialing') {
      // Active subscription - map price to tier
      targetTierId = priceId ? PRICE_TO_TIER_MAPPING[priceId] || FREE_TIER_ID : FREE_TIER_ID;
      
      if (priceId && !PRICE_TO_TIER_MAPPING[priceId]) {
        console.warn(`⚠️ Unknown price ID: ${priceId}, defaulting to Free tier`);
      } else if (priceId) {
        console.log(`✅ Mapped price ${priceId} to tier ${targetTierId}`);
      }
    } else {
      // Inactive subscription - downgrade to Free
      targetTierId = FREE_TIER_ID;
      console.log(`⬇️ Inactive subscription, downgrading to Free tier: ${targetTierId}`);
    }

    console.log(`🎯 Target tier ID: ${targetTierId} for user: ${userId}`);

    // Update user tier
    const { data: updateData, error: tierUpdateError } = await supabase
      .from('user_profiles')
      .update({ tier_id: targetTierId })
      .eq('id', userId)
      .eq('role', 'client') // Only update client users
      .select('id, tier_id, email');

    if (tierUpdateError) {
      console.error('❌ Error updating user tier:', tierUpdateError);
      throw new Error(`Failed to update user tier: ${tierUpdateError.message}`);
    }

    if (updateData && updateData.length > 0) {
      console.log(`✅ Successfully updated user ${userId} to tier ${targetTierId}. Updated data:`, updateData[0]);
      
      // Update allotments for the new tier
      await updateUserAllotments(userId, targetTierId, subscriptionStatus === 'active');
    } else {
      console.warn(`⚠️ No rows were updated for user ${userId}. User might not be a client or doesn't exist.`);
    }
  } catch (error) {
    console.error(`💥 Error in updateUserTier:`, error);
    throw error;
  }
}

// Function to update user allotments based on tier
async function updateUserAllotments(userId: string, tierId: string, isNewSubscription: boolean = false) {
  try {
    console.log(`🎯 Updating allotments for user: ${userId}, tier: ${tierId}, new subscription: ${isNewSubscription}`);
    
    // Get tier details
    const { data: tierData, error: tierError } = await supabase
      .from('tiers')
      .select('monthly_candidate_allotment')
      .eq('id', tierId)
      .single();

    if (tierError || !tierData) {
      console.error('❌ Error getting tier data:', tierError);
      return;
    }

    // Calculate reset date (30 days from now)
    const resetDate = new Date();
    resetDate.setDate(resetDate.getDate() + 30);

    // Update user allotments (jobs are now unlimited)
    const { data: updateData, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        available_credits: tierData.monthly_candidate_allotment,
        credits_reset_date: resetDate.toISOString()
      })
      .eq('id', userId)
      .select('id, available_credits, credits_reset_date');

    if (updateError) {
      console.error('❌ Error updating client allotments:', updateError);
      throw new Error(`Failed to update allotments: ${updateError.message}`);
    }

    if (updateData && updateData.length > 0) {
      console.log(`✅ Successfully updated allotments for user ${userId}:`, updateData[0]);
    } else {
      console.warn(`⚠️ No client record found for user ${userId}`);
    }
  } catch (error) {
    console.error(`💥 Error in updateUserAllotments:`, error);
    throw error;
  }
}

Deno.serve(async (req) => {
  try {
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    // Simple test endpoint
    if (req.method === 'GET') {
      console.log('🧪 Test endpoint called');
      try {
        const { data: testQuery } = await supabase
          .from('tiers')
          .select('count')
          .limit(1);
        
        return Response.json({ 
          status: 'webhook_online', 
          database_connected: true,
          environment_vars: {
            has_stripe_secret: !!Deno.env.get('STRIPE_SECRET_KEY'),
            has_webhook_secret: !!Deno.env.get('STRIPE_WEBHOOK_SECRET'),
            has_supabase_url: !!Deno.env.get('SUPABASE_URL'),
            has_service_role: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
          }
        });
      } catch (dbError) {
        console.error('❌ Database test failed:', dbError);
        return Response.json({ 
          status: 'webhook_online', 
          database_connected: false, 
          error: dbError.message 
        });
      }
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // get the signature from the header
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.log('❌ No signature found in webhook request');
      return new Response('No signature found', { status: 400 });
    }

    // get the raw body
    const body = await req.text();

    // verify the webhook signature
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
      console.log('✅ Webhook signature verified successfully');
    } catch (error: any) {
      console.error(`❌ Webhook signature verification failed: ${error.message}`);
      return new Response(`Webhook signature verification failed: ${error.message}`, { status: 400 });
    }

    EdgeRuntime.waitUntil(handleEvent(event));

    return Response.json({ received: true });
  } catch (error: any) {
    console.error('💥 Error processing webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleEvent(event: Stripe.Event) {
  console.log(`🎉 WEBHOOK RECEIVED: ${event.type} at ${new Date().toISOString()}`);
  console.log(`📝 Event data:`, JSON.stringify(event.data.object, null, 2));
  
  const stripeData = event?.data?.object ?? {};

  if (!stripeData) {
    console.log(`❌ No stripe data in event`);
    return;
  }

  if (!('customer' in stripeData)) {
    console.log(`❌ No customer in stripe data`);
    return;
  }

  // for one time payments, we only listen for the checkout.session.completed event
  if (event.type === 'payment_intent.succeeded' && event.data.object.invoice === null) {
    return;
  }

  const { customer: customerId } = stripeData;

  if (!customerId || typeof customerId !== 'string') {
    console.error(`No customer received on event: ${JSON.stringify(event)}`);
  } else {
    let isSubscription = true;

    if (event.type === 'checkout.session.completed') {
      const { mode } = stripeData as Stripe.Checkout.Session;

      isSubscription = mode === 'subscription';

      console.info(`Processing ${isSubscription ? 'subscription' : 'one-time payment'} checkout session`);
    }

    const { mode, payment_status } = stripeData as Stripe.Checkout.Session;

    if (isSubscription) {
      console.info(`Starting subscription sync for customer: ${customerId}`);
      await syncCustomerFromStripe(customerId);
    } else if (mode === 'payment' && payment_status === 'paid') {
      try {
        // Extract the necessary information from the session
        const {
          id: checkout_session_id,
          payment_intent,
          amount_subtotal,
          amount_total,
          currency,
        } = stripeData as Stripe.Checkout.Session;

        // Insert the order into the stripe_orders table
        const { error: orderError } = await supabase.from('stripe_orders').insert({
          checkout_session_id,
          payment_intent_id: payment_intent,
          customer_id: customerId,
          amount_subtotal,
          amount_total,
          currency,
          payment_status,
          status: 'completed', // assuming we want to mark it as completed since payment is successful
        });

        if (orderError) {
          console.error('Error inserting order:', orderError);
          return;
        }
        console.info(`Successfully processed one-time payment for session: ${checkout_session_id}`);
      } catch (error) {
        console.error('Error processing one-time payment:', error);
      }
    }
  }
}

// based on the excellent https://github.com/t3dotgg/stripe-recommendations
async function syncCustomerFromStripe(customerId: string) {
  try {
    // fetch latest subscription data from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    // TODO verify if needed
    if (subscriptions.data.length === 0) {
      console.info(`No active subscriptions found for customer: ${customerId}`);
      const { error: noSubError } = await supabase.from('stripe_subscriptions').upsert(
        {
          customer_id: customerId,
          subscription_status: 'not_started',
        },
        {
          onConflict: 'customer_id',
        },
      );

      if (noSubError) {
        console.error('Error updating subscription status:', noSubError);
        throw new Error('Failed to update subscription status in database');
      }
    }

    // assumes that a customer can only have a single subscription
    const subscription = subscriptions.data[0];

    // store subscription state
    const { error: subError } = await supabase.from('stripe_subscriptions').upsert(
      {
        customer_id: customerId,
        subscription_id: subscription.id,
        price_id: subscription.items.data[0].price.id,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        ...(subscription.default_payment_method && typeof subscription.default_payment_method !== 'string'
          ? {
              payment_method_brand: subscription.default_payment_method.card?.brand ?? null,
              payment_method_last4: subscription.default_payment_method.card?.last4 ?? null,
            }
          : {}),
        status: subscription.status,
      },
      {
        onConflict: 'customer_id',
      },
    );

    if (subError) {
      console.error('Error syncing subscription:', subError);
      throw new Error('Failed to sync subscription in database');
    }

    // Update user tier based on the subscription
    const priceId = subscription.items.data[0].price.id;
    await updateUserTier(customerId, priceId, subscription.status);
    
    console.info(`Successfully synced subscription for customer: ${customerId}`);
  } catch (error) {
    console.error(`Failed to sync subscription for customer ${customerId}:`, error);
    throw error;
  }
}