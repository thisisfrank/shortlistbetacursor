import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  role: 'client' | 'sourcer' | 'admin';
  created_at: string;
  updated_at: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // ✅ DEFENSIVE: Add retry mechanism for profile fetches
  const fetchUserProfile = async (userId: string, retryCount = 0): Promise<UserProfile | null> => {
    const maxRetries = 3;
    
    try {
      console.log(`🔍 Fetching user profile (attempt ${retryCount + 1}/${maxRetries + 1})...`);
      
      // ✅ HEALTH CHECK: Test Supabase connection first
      if (retryCount === 0) {
        try {
          const { data: healthCheck } = await supabase
            .from('user_profiles')
            .select('id')
            .limit(1);
          console.log('✅ Supabase connection healthy');
        } catch (healthError) {
          console.error('⚠️ Supabase connection issue detected:', healthError);
          // If connection is bad, wait longer before retry
          if (retryCount < maxRetries) {
            const delay = 5000; // 5s delay for connection issues
            console.log(`🔄 Connection issue detected, waiting ${delay/1000}s before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchUserProfile(userId, retryCount + 1);
          }
        }
      }
      
      const profilePromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      // ✅ INCREASED: Extended timeout to handle Supabase latency
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 15000) // ✅ Increased to 15s
      );
      
      const { data: profile, error } = await Promise.race([profilePromise, timeoutPromise]) as any;
      
      if (error) {
        console.error('⚠️ Profile fetch error:', error);
        if (retryCount < maxRetries) {
          // ✅ EXPONENTIAL BACKOFF: Increase delay with each retry
          const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
          console.log(`🔄 Retrying profile fetch in ${delay/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchUserProfile(userId, retryCount + 1);
        }
        return null;
      }
      
      if (profile) {
        console.log('✅ Profile fetched successfully:', profile);
        return {
          id: profile.id,
          email: profile.email,
          role: profile.role,
          created_at: profile.created_at,
          updated_at: profile.updated_at
        };
      }
      
      return null;
    } catch (error) {
      console.error('💥 Profile fetch failed:', error);
      if (retryCount < maxRetries) {
        // ✅ EXPONENTIAL BACKOFF: Increase delay with each retry
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`🔄 Retrying profile fetch in ${delay/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchUserProfile(userId, retryCount + 1);
      }
      return null;
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      console.log('🔍 Getting initial session...');
      
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        console.log('🔗 Supabase URL:', supabaseUrl);
        console.log('🔑 Has Anon Key:', !!supabaseAnonKey);
        
        // Check if environment variables are missing
        if (!supabaseUrl || !supabaseAnonKey) {
          console.error('❌ Missing Supabase environment variables');
          setUser(null);
          setUserProfile(null);
          setLoading(false);
          return;
        }
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('📡 Session response received:', { hasSession: !!session, error: sessionError });
        
        if (sessionError) {
          console.error('❌ Error getting session:', sessionError);
          setUser(null);
          setUserProfile(null);
          setLoading(false);
          return;
        }
        
        const currentUser = session?.user ?? null;
        console.log('👤 Initial session user:', currentUser?.email || 'No user');
        
        setUser(currentUser);
        
        if (currentUser) {
          console.log('📋 User found, fetching profile...');
          
          const profile = await fetchUserProfile(currentUser.id);
          if (profile) {
            setUserProfile(profile);
          } else {
            console.log('⚠️ No user profile found, waiting for trigger to create it');
            setUserProfile(null);
          }
        } else {
          console.log('🚫 No user session found');
          setUserProfile(null);
        }
      } catch (error) {
        console.error('💥 Error in getInitialSession:', error);
        setUser(null);
        setUserProfile(null);
      }
      
      setLoading(false);
      console.log('🏁 Auth initialization complete');
    };

    getInitialSession();

    // ✅ DEFENSIVE: Improved auth state change handler
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event);
        
        // ✅ DEFENSIVE: Handle refresh token errors gracefully
        if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refreshed successfully');
          return;
        }
        
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          console.log('👤 Auth change - fetching profile for:', currentUser.email);
          
          const profile = await fetchUserProfile(currentUser.id);
          if (profile) {
            setUserProfile(profile);
          } else {
            console.log('⚠️ Auth change - No profile found, waiting for trigger');
            // ✅ FALLBACK: Don't set profile to null immediately, keep previous state
            // This prevents navigation issues during temporary network problems
            if (!userProfile) {
              setUserProfile(null);
            }
          }
        } else {
          console.log('🚫 Auth change - No user');
          setUserProfile(null);
        }
        
        // ✅ DEFENSIVE: Clear any previous auth errors on successful state change
        if (event === 'SIGNED_IN') {
          setAuthError(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting sign in for:', email);
      setLoading(true);
      setAuthError(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      
      console.log('🔐 Sign in result:', { success: !error, error: error?.message });
      
      if (error) {
        setAuthError(error.message);
      }
      
      // Don't set loading to false here - let the auth state change handle it
      // This prevents the flickering issue
      
      return { data, error };
    } catch (error) {
      console.error('💥 Sign in error:', error);
      setAuthError('Network error. Please try again.');
      setLoading(false);
      return { 
        data: null, 
        error: { message: 'Network error. Please try again.' } 
      };
    }
  };

  const signUp = async (email: string, password: string, role: 'client' | 'sourcer' = 'client') => {
    try {
      console.log('📝 Attempting sign up for:', email);
      setLoading(true);
      setAuthError(null);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined
        },
      });
      
      console.log('📝 Signup result:', { success: !error, error: error?.message, hasUser: !!data.user });
      
      if (!error && data.user) {
        console.log('👤 User created, updating profile role...');
        
        try {
          // Wait a moment for the trigger to create the profile
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Update user profile with selected role (the profile is auto-created by trigger)
          const { error: profileError } = await supabase
            .from('user_profiles')
            .update({ role })
            .eq('id', data.user.id);
          
          if (profileError) {
            console.error('⚠️ Error updating user profile:', profileError);
          } else {
            console.log('✅ User profile role updated successfully');
          }
        } catch (profileUpdateError) {
          console.error('💥 Error in profile update:', profileUpdateError);
        }
      }
      
      if (error) {
        setAuthError(error.message);
      }
      
      return { data, error };
    } catch (error) {
      console.error('💥 Signup error:', error);
      setAuthError('Network error. Please try again.');
      setLoading(false);
      return { 
        data: null, 
        error: { message: 'Network error. Please try again.' } 
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('🚪 Signing out...');
    
    // Set sign-out loading state
    setSignOutLoading(true);
    setAuthError(null);
    
    try {
      const { error } = await supabase.auth.signOut();
      console.log('🚪 Supabase signOut result:', { error });
      
      // Clear local state after successful sign-out
      setUser(null);
      setUserProfile(null);
      setLoading(false);
      localStorage.removeItem('sourcerName');
      localStorage.removeItem('savedSourcers');
      
      return { error };
    } catch (error) {
      console.error('💥 Sign out error:', error);
      setAuthError('Error signing out');
      return { error: { message: 'Error signing out' } };
    } finally {
      setSignOutLoading(false);
    }
  };

  return {
    user,
    userProfile,
    loading,
    signOutLoading,
    authError, // ✅ Expose auth errors for UI feedback
    signIn,
    signUp,
    signOut,
  };
};