import { useState, useEffect } from 'react';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

function mapDbProfileToUserProfile(profile: any): UserProfile {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name || '',
    role: profile.role,
    tierId: profile.tier_id || '5841d1d6-20d7-4360-96f8-0444305fac5b', // Free tier ID from production
    availableCredits: profile.available_credits,
    jobsRemaining: profile.jobs_remaining,
    creditsResetDate: profile.credits_reset_date ? new Date(profile.credits_reset_date) : null,
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
  console.log('🚨 IMMEDIATE URL CAPTURE:', {
    url: currentUrl,
    hash: currentHash,
    pathname: window.location.pathname,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    let isMounted = true;
    let authTimeout: NodeJS.Timeout;

    // Check for password recovery in URL before initializing auth
    const checkForPasswordRecovery = () => {
      const hash = window.location.hash;
      const fullUrl = window.location.href;
      const pathname = window.location.pathname;
      const hasTypeRecovery = hash.includes('type=recovery');
      
      console.log('🔍 Checking URL for password recovery:', { 
        hash, 
        fullUrl,
        hasTypeRecovery,
        pathname,
        search: window.location.search,
        hashLength: hash.length,
        rawHash: hash
      });
      
      if (hash && hash.includes('type=recovery')) {
        console.log('🔑 Password recovery detected in URL');
        // Extract parameters
        const params = new URLSearchParams(hash.substring(1));
        const type = params.get('type');
        const accessToken = params.get('access_token');
        
        console.log('🔑 Recovery parameters:', { type, hasAccessToken: !!accessToken });
        
        if (type === 'recovery' && accessToken) {
          // Only redirect if we're NOT already on the reset-password page
          if (pathname !== '/reset-password') {
            console.log('🔑 Valid recovery link detected, redirecting to /reset-password with tokens preserved');
            // Preserve the entire hash when redirecting
            window.location.href = `/reset-password${hash}`;
            return true; // Indicates we found recovery and are redirecting
          } else {
            console.log('🔑 Already on reset-password page with valid recovery tokens');
            return false; // Don't exit early, let auth initialize normally
          }
        }
      }
      return false;
    };

    // Check for recovery first
    const isPasswordRecovery = checkForPasswordRecovery();
    if (isPasswordRecovery) {
      return; // Exit early if password recovery
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

    // Listen for auth state changes (including password recovery)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      console.log('🔐 Auth state change:', event);
      
      if (event === 'PASSWORD_RECOVERY') {
        console.log('🔑 Password recovery event detected, redirecting to reset page');
        // Redirect to reset password page
        window.location.href = '/reset-password';
        return;
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
                    name: currentUser.email?.split('@')[0] || 'User',
                    role: 'client',
                    tier_id: '5841d1d6-20d7-4360-96f8-0444305fac5b',
                    available_credits: 20,
                    jobs_remaining: 1,
                    credits_reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                  });
                  
                  if (createError) {
                    console.error('❌ Failed to create user profile:', createError);
                    setUserProfile(null);
                  } else {
                    console.log('✅ Created missing user profile');
                    setUserProfile({
                      id: currentUser.id,
                      email: currentUser.email || '',
                      name: currentUser.email?.split('@')[0] || 'User',
                      role: 'client',
                      tierId: '5841d1d6-20d7-4360-96f8-0444305fac5b',
                      availableCredits: 20,
                      jobsRemaining: 1,
                      creditsResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
                name: currentUser.email?.split('@')[0] || 'User',
                role: 'client',
                tier_id: '5841d1d6-20d7-4360-96f8-0444305fac5b',
                available_credits: 20,
                jobs_remaining: 1,
                credits_reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              });
              
              if (createError) {
                console.error('❌ Failed to create user profile:', createError);
                setUserProfile(null);
              } else {
                console.log('✅ Created missing user profile');
                setUserProfile({
                  id: currentUser.id,
                  email: currentUser.email || '',
                  name: currentUser.email?.split('@')[0] || 'User',
                  role: 'client',
                  tierId: '5841d1d6-20d7-4360-96f8-0444305fac5b',
                  availableCredits: 20,
                  jobsRemaining: 1,
                  creditsResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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

  const signUp = async (email: string, password: string, role: 'client' | 'sourcer' = 'client', name: string = '') => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setLoading(false);
        return { data: null, error };
      }
      // Insert user profile after sign up
      // Upsert user profile after sign up (overwrites trigger-created profile with correct name)
      if (data.user) {
        const { error: profileError } = await supabase.from('user_profiles').upsert({
          id: data.user.id,
          email,
          name,
          role,
          tier_id: '5841d1d6-20d7-4360-96f8-0444305fac5b',
          available_credits: 20,
          jobs_remaining: 1,
          credits_reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
        
        if (profileError) {
          console.error('❌ Profile creation error:', profileError);
        }
        
        setUser(data.user);
        setUserProfile({
          id: data.user.id,
          email,
          name,
          role,
          tierId: '5841d1d6-20d7-4360-96f8-0444305fac5b',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
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
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (error) {
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