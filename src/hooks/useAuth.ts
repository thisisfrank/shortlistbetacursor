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
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let authSubscription: any = null;

    const initAuth = async () => {
      try {
        console.log('🔐 Initializing auth...');
        
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        
        if (!isMounted) return;
        
        console.log('🔐 Session found:', !!currentUser);
        setUser(currentUser);
        
        if (currentUser) {
          console.log('🔐 Loading user profile...');
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
          
          if (!isMounted) return;
          
          if (error) {
            console.error('❌ Error loading user profile:', error);
            setUserProfile(null);
          } else {
            console.log('✅ User profile loaded:', profile?.role);
            setUserProfile(profile);
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
        if (isMounted) {
          setLoading(false);
          setAuthInitialized(true);
        }
      }
    };

    const setupAuthListener = () => {
      console.log('🔐 Setting up auth state listener...');
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
        console.log('🔐 Auth state change:', event, !!session?.user);
        
        // Skip initial session event - we handle it in initAuth
        if (event === 'INITIAL_SESSION') {
          console.log('🔐 Skipping INITIAL_SESSION event');
          return;
        }
        
        if (!isMounted) return;
        
        try {
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          
          if (currentUser) {
            console.log('🔐 Loading profile for auth change...');
            const { data: profile, error } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', currentUser.id)
              .single();
            
            if (!isMounted) return;
            
            if (error) {
              console.error('❌ Error loading profile in auth change:', error);
              setUserProfile(null);
              // Don't set loading to false here - let the signIn function handle it
            } else {
              console.log('✅ Profile loaded in auth change:', profile?.role);
              setUserProfile(profile);
              // Don't set loading to false here - let the signIn function handle it
            }
          } else {
            console.log('🔐 User signed out, clearing profile');
            setUserProfile(null);
            // Don't set loading to false here - let the signIn function handle it
          }
        } catch (error) {
          console.error('💥 Auth change error:', error);
          if (isMounted) {
            setUserProfile(null);
            // Don't set loading to false here - let the signIn function handle it
          }
        }
      });
      
      authSubscription = subscription;
    };

    // Initialize auth
    initAuth().then(() => {
      if (isMounted) {
        setupAuthListener();
      }
    });

    return () => {
      console.log('🔐 Cleaning up auth listener...');
      isMounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

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
      
      const signInPromise = supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      
      const { data, error } = await Promise.race([signInPromise, timeoutPromise]) as any;
      
      console.log('🔐 Sign in result:', { success: !error, error: error?.message });
      
      // Always set loading to false after sign-in attempt
      console.log('🔐 Setting loading to false after sign-in attempt');
      setLoading(false);
      
      return { data, error };
    } catch (error) {
      console.error('💥 Sign in catch error:', error);
      console.log('🔐 Setting loading to false after catch error');
      setLoading(false);
      return { 
        data: null, 
        error: { message: error instanceof Error ? error.message : 'Network error. Please try again.' } 
      };
    }
  };

  const signUp = async (email: string, password: string, role: 'client' | 'sourcer' = 'client') => {
    console.log('📝 Attempting signup with:', { email, passwordLength: password.length, role });
    setLoading(true);
    
    try {
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
      
      return { data, error };
    } catch (error) {
      console.error('💥 Signup error:', error);
      return { 
        data: null, 
        error: { message: 'Network error. Please try again.' } 
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('🚪 Starting sign out process...');
    
    // Set sign-out loading state
    setSignOutLoading(true);
    
    try {
      // Clear local storage first
      localStorage.removeItem('sourcerName');
      localStorage.removeItem('savedSourcers');
      
      console.log('🚪 Calling Supabase signOut...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Supabase signOut error:', error);
        throw error;
      }
      
      console.log('✅ Supabase signOut successful');
      
      // Clear local state
      setUser(null);
      setUserProfile(null);
      setLoading(false);
      
      console.log('✅ Local state cleared');
      
      return { error: null };
    } catch (error) {
      console.error('💥 Sign out error:', error);
      
      // Even if Supabase fails, clear local state to prevent stuck loading
      setUser(null);
      setUserProfile(null);
      setLoading(false);
      
      return { 
        error: { 
          message: error instanceof Error ? error.message : 'Error signing out' 
        } 
      };
    } finally {
      console.log('🚪 Sign out process complete, clearing loading state');
      setSignOutLoading(false);
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
  };
};