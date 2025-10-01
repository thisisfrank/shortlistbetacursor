import { useState, useEffect } from 'react';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { ghlService } from '../services/ghlService';

function mapDbProfileToUserProfile(profile: any): UserProfile {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name || '',
    company: profile.company || undefined,
    avatar: profile.avatar || '👤',
    role: profile.role,
    tierId: profile.tier_id || '5841d1d6-20d7-4360-96f8-0444305fac5b', // Free tier ID from production
    availableCredits: profile.available_credits,
    creditsResetDate: profile.credits_reset_date ? new Date(profile.credits_reset_date) : null,
    stripeCustomerId: profile.stripe_customer_id,
    subscriptionStatus: profile.subscription_status || 'free',
    subscriptionPeriodEnd: profile.subscription_period_end ? new Date(profile.subscription_period_end) : null,
    createdAt: profile.created_at ? new Date(profile.created_at) : new Date(),
    updatedAt: profile.updated_at ? new Date(profile.updated_at) : new Date(),
  };
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  // IMMEDIATE URL CAPTURE - before anything else happens
  const currentUrl = window.location.href;
  const currentHash = window.location.hash;
  const currentSearch = window.location.search;
  console.log('🚨 IMMEDIATE URL CAPTURE:', {
    url: currentUrl,
    hash: currentHash,
    search: currentSearch,
    pathname: window.location.pathname,
    hasAccessToken: currentSearch.includes('access_token') || currentHash.includes('access_token'),
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    let isMounted = true;
    let authTimeout: NodeJS.Timeout;

    // Check for password recovery and email confirmation in URL before initializing auth
    const checkForSpecialAuth = () => {
      const hash = window.location.hash;
      const search = window.location.search;
      const fullUrl = window.location.href;
      const pathname = window.location.pathname;
      
      // Check for recovery in query params (primary) or hash (fallback)
      const queryParams = new URLSearchParams(search);
      const hashParams = new URLSearchParams(hash.substring(1));
      
      const hasTypeRecoveryQuery = queryParams.get('type') === 'recovery';
      const hasTypeRecoveryHash = hashParams.get('type') === 'recovery';
      const hasTypeSignupHash = hashParams.get('type') === 'signup';
      
      console.log('🔍 Checking URL for password recovery:', { 
        search,
        hash, 
        fullUrl,
        hasTypeRecoveryQuery,
        hasTypeRecoveryHash,
        hasTypeSignupHash,
        pathname,
        searchIncludes: search.includes('access_token'),
        hashIncludes: hash.includes('access_token')
      });
      
      // Handle password recovery (check query params first, then hash)
      if (hasTypeRecoveryQuery || hasTypeRecoveryHash) {
        console.log('🔑 Password recovery detected in URL');
        
        const params = hasTypeRecoveryQuery ? queryParams : hashParams;
        const accessToken = params.get('access_token');
        
        console.log('🔑 Recovery parameters:', { 
          type: params.get('type'), 
          hasAccessToken: !!accessToken,
          source: hasTypeRecoveryQuery ? 'query' : 'hash'
        });
        
        if (accessToken) {
          // Only redirect if we're NOT already on the reset-password page
          if (pathname !== '/reset-password') {
            console.log('🔑 Valid recovery link detected, redirecting to /reset-password with tokens preserved');
            // Preserve the tokens in the URL when redirecting
            const tokenString = hasTypeRecoveryQuery ? search : hash;
            window.location.href = `/reset-password${tokenString}`;
            return true; // Indicates we found recovery and are redirecting
          } else {
            console.log('🔑 Already on reset-password page with valid recovery tokens');
            return false; // Don't exit early, let auth initialize normally
          }
        }
      }
      
      // Handle email confirmation
      // Supabase handles email confirmation automatically via the auth tokens in the URL hash
      // Just let it process naturally and the user will be signed in
      // The LandingPage will redirect them to their dashboard once authenticated
      
      return false;
    };

    // Check for special auth (recovery or confirmation) first
    const isSpecialAuth = checkForSpecialAuth();
    if (isSpecialAuth) {
      return; // Exit early if special auth handling
    }

    const initAuth = async () => {
      try {
        console.log('🔐 Initializing auth...');
        // Set a timeout to prevent infinite loading
        authTimeout = setTimeout(() => {
          if (isMounted) {
            console.warn('⚠️ Auth initialization timeout - setting loading to false');
            setLoading(false);
            setAuthInitialized(true);
          }
        }, 15000); // 15 second timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Auth session timeout')), 20000);
        });
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        const currentUser = session?.user ?? null;
        if (!isMounted) return;
        console.log('🔐 Session found:', !!currentUser);
        setUser(currentUser);
        if (currentUser) {
          console.log('🔐 Loading user profile...');
          const profilePromise = supabase
            .from('user_profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
          const profileTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Profile fetch timeout')), 8000);
          });
          const { data: profile, error } = await Promise.race([profilePromise, profileTimeoutPromise]) as any;
          if (!isMounted) return;
          if (error) {
            console.error('❌ Error loading user profile:', error);
            setUserProfile(null);
          } else {
            console.log('✅ User profile loaded:', profile?.role);
            setUserProfile(mapDbProfileToUserProfile(profile));
          }
        } else {
          setUserProfile(null);
        }
      } catch (error) {
        console.error('💥 Auth initialization error:', error);
        if (isMounted) {
          setUser(null);
          setUserProfile(null);
        }
      } finally {
        if (authTimeout) {
          clearTimeout(authTimeout);
        }
        if (isMounted) {
          setLoading(false);
          setAuthInitialized(true);
        }
      }
    };

    // Listen for auth state changes (including password recovery and email confirmation)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      console.log('🔐 Auth state change:', event);
      
      if (event === 'PASSWORD_RECOVERY') {
        console.log('🔑 Password recovery event detected, redirecting to reset page');
        // Redirect to reset password page
        window.location.href = '/reset-password';
        return;
      }
      
      // Handle email confirmation
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        console.log('📧 Email confirmation successful, user signed in');
        // This will be handled by the SIGNED_IN case below
      }
      
      if (event === 'SIGNED_IN') {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser && isMounted) {
          // Load user profile for signed in user
          supabase
            .from('user_profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single()
            .then(async ({ data: profile, error }: { data: any; error: any }) => {
              if (!isMounted) return;
              if (error) {
                console.error('❌ Error loading user profile:', error);
                // If profile doesn't exist, try to create one
                if (error.code === 'PGRST116') {
                  console.log('🔄 User profile not found, attempting to create one...');
                  const { error: createError } = await supabase.from('user_profiles').upsert({
                    id: currentUser.id,
                    email: currentUser.email,
                    name: '', // Leave name empty for user to set
                    company: null, // No company info available in fallback scenario
                    avatar: '👤', // Default avatar
                    role: 'client',
                    tier_id: '5841d1d6-20d7-4360-96f8-0444305fac5b',
                    available_credits: 20,
                    // No credits_reset_date for free tier - one-time credits only
                  });
                  
                  if (createError) {
                    console.error('❌ Failed to create user profile:', createError);
                    setUserProfile(null);
                  } else {
                    console.log('✅ Created missing user profile');
                    setUserProfile({
                      id: currentUser.id,
                      email: currentUser.email || '',
                      name: '', // Leave name empty for user to set
                      avatar: '👤', // Default avatar
                      role: 'client',
                      tierId: '5841d1d6-20d7-4360-96f8-0444305fac5b',
                      availableCredits: 20,
                      creditsResetDate: null, // No reset date for free tier - one-time credits
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    });
                  }
                } else {
                  setUserProfile(null);
                }
              } else {
                console.log('✅ User profile loaded:', profile?.role);
                setUserProfile(mapDbProfileToUserProfile(profile));
              }
            });
        }
      }
      
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserProfile(null);
      }
    });

    // Initialize auth (only on mount)
    initAuth();

    return () => {
      console.log('🔐 Cleaning up auth...');
      isMounted = false;
      if (authTimeout) {
        clearTimeout(authTimeout);
      }
      subscription.unsubscribe();
    };
  }, []);

  // EXPLICIT signIn, signUp, signOut, refreshProfile only update user/session/profile
  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting sign in for:', email);
      console.log('🔐 Current loading state before signIn:', loading);
      setLoading(true);
      console.log('🔐 Loading state set to true');
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Sign in timeout')), 10000); // 10 second timeout
      });
      const { data, error } = await Promise.race([
        supabase.auth.signInWithPassword({ email, password }),
        timeoutPromise
      ]) as any;
      if (error) {
        setLoading(false);
        return { data: null, error };
      }
      // Set user and profile after sign in
      const currentUser = data.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
          
          if (profileError) {
            console.error('❌ Error loading user profile:', profileError);
            // If profile doesn't exist, try to create one
            if (profileError.code === 'PGRST116') {
              console.log('🔄 User profile not found, attempting to create one...');
              const { error: createError } = await supabase.from('user_profiles').upsert({
                id: currentUser.id,
                email: currentUser.email,
                name: '', // Leave name empty for user to set
                company: null, // No company info available in fallback scenario
                avatar: '👤', // Default avatar
                role: 'client',
                tier_id: '5841d1d6-20d7-4360-96f8-0444305fac5b',
                available_credits: 20,
                // No credits_reset_date for free tier - one-time credits only
              });
              
              if (createError) {
                console.error('❌ Failed to create user profile:', createError);
                setUserProfile(null);
              } else {
                console.log('✅ Created missing user profile');
                setUserProfile({
                  id: currentUser.id,
                  email: currentUser.email || '',
                  name: '', // Leave name empty for user to set
                  avatar: '👤', // Default avatar
                  role: 'client',
                  tierId: '5841d1d6-20d7-4360-96f8-0444305fac5b',
                  availableCredits: 20,
                  creditsResetDate: null, // No reset date for free tier - one-time credits
                  createdAt: new Date(),
                  updatedAt: new Date(),
                });
              }
            } else {
              setUserProfile(null);
            }
          } else {
            setUserProfile(mapDbProfileToUserProfile(profile));
          }
        } catch (error) {
          console.error('❌ Unexpected error loading user profile:', error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
      return { data, error: null };
    } catch (error) {
      console.log('?? Sign in catch error:', error);
      setLoading(false);
      return { data: null, error };
    }
  };

  const signUp = async (email: string, password: string, role: 'client' | 'sourcer' = 'client', name: string = '', company: string = '') => {
    setLoading(true);
    try {
      // Simple signup - let database trigger handle profile creation after email confirmation
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            // Store signup data in user metadata for the trigger to use
            name,
            company: company || null,
            role
          }
        }
      });
      
      if (error) {
        setLoading(false);
        return { data: null, error };
      }

      // Don't create profile here - database trigger will handle it after email confirmation
      // Don't set user state - auth state change handler will handle it after confirmation
      console.log('📧 Signup successful, email confirmation required');
      
      setLoading(false);
      return { data, error: null };
    } catch (error) {
      setLoading(false);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    setSignOutLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      setUser(null);
      setUserProfile(null);
      setSignOutLoading(false);
      return { error };
    } catch (error) {
      setSignOutLoading(false);
      return { error };
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) {
        setUserProfile(null);
      } else {
        setUserProfile(mapDbProfileToUserProfile(profile));
      }
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      // Get the appropriate redirect URL based on environment
      const baseUrl = window.location.origin;
      const redirectUrl = `${baseUrl}/reset-password`;
      
      console.log('🔑 Sending password reset email to:', email);
      console.log('🔑 Redirect URL:', redirectUrl);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      
      if (error) {
        console.error('❌ Reset password error:', error);
      } else {
        console.log('✅ Reset password email sent successfully');
      }
      
      return { error };
    } catch (error) {
      console.error('💥 Reset password exception:', error);
      return { error };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      console.log('🔑 updatePassword called, updating user password...');
      
      // Add timeout to prevent hanging
      const updatePromise = supabase.auth.updateUser({
        password: newPassword
      });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Password update timeout')), 10000); // 10 second timeout
      });
      
      const { error } = await Promise.race([updatePromise, timeoutPromise]) as any;
      
      if (error) {
        console.error('❌ Supabase updateUser error:', error);
      } else {
        console.log('✅ Supabase updateUser successful');
      }
      
      return { error };
    } catch (error) {
      console.error('💥 updatePassword catch error:', error);
      return { error };
    }
  };

  const clearAllAuth = async () => {
    setSignOutLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      setUser(null);
      setUserProfile(null);
      setSignOutLoading(false);
      return { error };
    } catch (error) {
      setSignOutLoading(false);
      return { error };
    }
  };

  return {
    user,
    userProfile,
    loading,
    signOutLoading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    resetPassword,
    updatePassword,
    clearAllAuth,
  };
};