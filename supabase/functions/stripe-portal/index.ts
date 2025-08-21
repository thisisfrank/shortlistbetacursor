import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-12-18.acacia',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

function corsResponse(body: string | object | null, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

Deno.serve(async (req) => {
  try {
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return corsResponse(null, 204);
    }

    // Simple test endpoint
    if (req.method === 'GET') {
      console.log('🧪 Stripe portal test endpoint called');
      return corsResponse({ 
        status: 'stripe_portal_online',
        message: 'Stripe portal function is running'
      });
    }

    if (req.method !== 'POST') {
      return corsResponse({ error: 'Method not allowed' }, 405);
    }

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser(token);

    if (getUserError) {
      return corsResponse({ error: 'Failed to authenticate user' }, 401);
    }

    if (!user) {
      return corsResponse({ error: 'User not found' }, 404);
    }

    console.log(`🔍 Creating portal session for user: ${user.id}`);

    // Get customer ID from user profile
    const { data: customer, error: getCustomerError } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (getCustomerError || !customer || !customer.stripe_customer_id) {
      console.error('❌ Error finding customer:', getCustomerError);
      return corsResponse({ error: 'No subscription found for this user' }, 404);
    }

    console.log(`✅ Found customer: ${customer.stripe_customer_id}`);

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.stripe_customer_id,
      return_url: `${req.headers.get('origin') || 'http://localhost:3000'}/subscription`,
    });

    console.log(`✅ Created portal session: ${session.url}`);

    return corsResponse({ url: session.url });

  } catch (error) {
    console.error('💥 Error in stripe portal function:', error);
    return corsResponse({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
}); 