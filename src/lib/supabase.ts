import { createClient } from '@supabase/supabase-js';

// Debug environment variables
console.log('🔍 Environment check:', {
  NODE_ENV: import.meta.env.MODE,
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing',
  SUPABASE_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
  ALL_ENV_VARS: Object.keys(import.meta.env)
});

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    url: supabaseUrl ? 'Set' : 'Missing',
    key: supabaseAnonKey ? 'Set' : 'Missing'
  });
  
  // Create a mock client for development/demo purposes
  console.warn('Creating mock Supabase client - some features will not work');
}

// Create a mock client when environment variables are missing
const createMockSupabaseClient = () => ({
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    signUp: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
  },
  from: () => ({
    select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }),
    insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }) }) }),
    update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }) }) }) }),
    delete: () => ({ eq: () => Promise.resolve({ error: { message: 'Supabase not configured' } }) })
  })
});

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : createMockSupabaseClient() as any;

export type Database = {
  public: {
    Tables: {
      // Tables are now managed via Supabase dashboard
      // user_profiles contains stripe_customer_id, subscription_status, and subscription_period_end
      // tiers table contains subscription tier information
      // All Stripe data is now consolidated into user_profiles for simplicity
    };
    Views: {
      // Views are managed via Supabase dashboard
    };
  };
};