import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  try {
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    // Simple test endpoint
    if (req.method === 'GET') {
      console.log('🧪 Daily renewals test endpoint called');
      return Response.json({ 
        status: 'daily_renewals_online',
        message: 'Daily renewals function is running'
      });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    console.log('🔄 Starting daily renewal process...');

    // Get all users whose reset date has passed
    const { data: expiredUsers, error } = await supabase
      .from('user_profiles')
      .select(`
        id,
        email,
        credits_reset_date,

        available_credits,
        tier_id,
        tiers!inner(
          id,
          name,

          monthly_candidate_allotment
        )
      `)
      .lt('credits_reset_date', new Date().toISOString())
      .eq('role', 'client');

    if (error) {
      console.error('❌ Error fetching expired clients:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    console.log(`🔄 Processing ${expiredUsers?.length || 0} expired users`);

    const results = {
      processed: 0,
      errors: 0,
      details: [] as any[]
    };

    // Update allotments for each expired user
    for (const user of expiredUsers || []) {
      try {
        const resetDate = new Date();
        resetDate.setDate(resetDate.getDate() + 30);

        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            available_credits: user.tiers.monthly_candidate_allotment,
            credits_reset_date: resetDate.toISOString()
          })
          .eq('id', user.id);

        if (updateError) {
          console.error(`❌ Error updating user ${user.id}:`, updateError);
          results.errors++;
          results.details.push({
            user_id: user.id,
            email: user.email,
            error: updateError.message
          });
        } else {
          console.log(`✅ Renewed allotments for user ${user.id} (${user.email})`);
          console.log(`   Tier: ${user.tiers.name}`);
          console.log(`   Credits: ${user.available_credits} → ${user.tiers.monthly_candidate_allotment}`);
          console.log(`   Next reset: ${resetDate.toISOString()}`);
          
          results.processed++;
          results.details.push({
            user_id: user.id,
            email: user.email,
            tier: user.tiers.name,
            old_credits: user.available_credits,
            new_credits: user.tiers.monthly_candidate_allotment,
            next_reset: resetDate.toISOString()
          });
        }
      } catch (userError) {
        console.error(`💥 Unexpected error processing user ${user.id}:`, userError);
        results.errors++;
        results.details.push({
          user_id: user.id,
          email: user.email,
          error: userError instanceof Error ? userError.message : 'Unknown error'
        });
      }
    }

    console.log(`✅ Daily renewal complete: ${results.processed} processed, ${results.errors} errors`);

    return new Response(JSON.stringify({ 
      success: true, 
      processed: results.processed,
      errors: results.errors,
      details: results.details,
      timestamp: new Date().toISOString()
    }));

  } catch (error) {
    console.error('💥 Error in daily renewals:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), { status: 500 });
  }
}); 