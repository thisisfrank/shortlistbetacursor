import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'client' | 'sourcer' | 'admin';
  tierId: string;
  availableCredits: number;
  jobsRemaining: number;
  creditsResetDate: Date | null;
  hasReceivedFreeShortlist: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function mapDbProfileToUserProfile(profile: any): UserProfile {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name || '',
    role: profile.role,
    tierId: profile.tier_id || 'tier-free',
    availableCredits: profile.available_credits ?? 0,
    jobsRemaining: profile.jobs_remaining ?? 0,
    creditsResetDate: profile.credits_reset_date ? new Date(profile.credits_reset_date) : null,
    hasReceivedFreeShortlist: !!profile.has_received_free_shortlist,
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

  useEffect(() => {
    let isMounted = true;
    let authTimeout: NodeJS.Timeout;
    // REMOVE Supabase onAuthStateChange event listener for true sticky session
    // Only update user/session on explicit login/logout/signup
    // No event listeners for tab switch, focus, or session events

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

    // Initialize auth (only on mount)
    initAuth();

    return () => {
      console.log('🔐 Cleaning up auth (sticky session mode)...');
      isMounted = false;
      if (authTimeout) {
        clearTimeout(authTimeout);
      }
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
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        if (profileError) {
          setUserProfile(null);
        } else {
          setUserProfile(mapDbProfileToUserProfile(profile));
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
      if (data.user) {
        await supabase.from('user_profiles').insert({
          id: data.user.id,
          email,
          name,
          role,
          tier_id: 'tier-free',
          available_credits: 0,
          jobs_remaining: 0,
          credits_reset_date: null,
          has_received_free_shortlist: false,
        });
        setUser(data.user);
        setUserProfile({
          id: data.user.id,
          email,
          name,
          role,
          tierId: 'tier-free',
          availableCredits: 0,
          jobsRemaining: 0,
          creditsResetDate: null,
          hasReceivedFreeShortlist: false,
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

  return {
    user,
    userProfile,
    loading,
    signOutLoading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };
};