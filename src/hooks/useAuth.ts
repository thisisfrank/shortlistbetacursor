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
          
          try {
            // Add timeout to prevent hanging
            // Try a simpler query first to debug the issue
            console.log('🔍 Querying profile with ID:', currentUser.id);
            
            const profilePromise = supabase
              .from('user_profiles')
              .select('id, email, role, created_at, updated_at')
              .eq('id', currentUser.id)
              .maybeSingle();
            
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile fetch timeout')), 30000)
            );
            
            const { data: profile, error } = await Promise.race([profilePromise, timeoutPromise]) as any;
            
            console.log('📊 Profile query result:', { hasProfile: !!profile, error: error });
            
            if (error) {
              console.error('⚠️ Error fetching user profile:', error);
              console.log('🔍 Error details:', { code: error.code, message: error.message, details: error.details });
              
              // Log all errors for debugging since we know the profile exists
              console.log('🔍 All error details:', { 
                code: error.code, 
                message: error.message, 
                details: error.details,
                hint: error.hint 
              });
              
              // For now, let's just set the profile to null and continue
              // This will allow the user to proceed while we debug the query issue
              setUserProfile(null);
              
              setUserProfile(null);
            } else {
              if (profile) {
                console.log('✅ User profile found:', profile);
                const userProfile: UserProfile = {
                  id: profile.id,
                  email: profile.email,
                  role: profile.role,
                  created_at: profile.created_at,
                  updated_at: profile.updated_at
                };
                setUserProfile(userProfile);
              } else {
                console.log('⚠️ No user profile found, waiting for trigger to create it');
                setUserProfile(null);
              }
            }
          } catch (profileError) {
            console.error('💥 Profile fetch failed:', profileError);
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

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          console.log('👤 Auth change - fetching profile for:', currentUser.email);
          
          try {
            // Add timeout for auth state changes too
            // Try a simpler query first to debug the issue
            console.log('🔍 Auth change - Querying profile with ID:', currentUser.id);
            
            const profilePromise = supabase
              .from('user_profiles')
              .select('id, email, role, created_at, updated_at')
              .eq('id', currentUser.id)
              .maybeSingle();
            
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile fetch timeout')), 30000)
            );
            
            const { data: profile, error } = await Promise.race([profilePromise, timeoutPromise]) as any;
            
            if (error) {
              console.error('⚠️ Auth change - Error fetching user profile:', error);
              console.log('🔍 Auth change - Error details:', { code: error.code, message: error.message, details: error.details });
              
              // Log all errors for debugging since we know the profile exists
              console.log('🔍 Auth change - All error details:', { 
                code: error.code, 
                message: error.message, 
                details: error.details,
                hint: error.hint 
              });
              
              // For now, let's just set the profile to null and continue
              // This will allow the user to proceed while we debug the query issue
              setUserProfile(null);
              
              setUserProfile(null);
            } else {
              if (profile) {
                console.log('✅ Auth change - Profile found:', profile);
                const userProfile: UserProfile = {
                  id: profile.id,
                  email: profile.email,
                  role: profile.role,
                  created_at: profile.created_at,
                  updated_at: profile.updated_at
                };
                setUserProfile(userProfile);
              } else {
                console.log('⚠️ Auth change - No profile found, waiting for trigger');
                setUserProfile(null);
              }
            }
          } catch (profileError) {
            console.error('💥 Auth change profile fetch failed:', profileError);
            setUserProfile(null);
          }
        } else {
          console.log('🚫 Auth change - No user');
          setUserProfile(null);
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
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      
      console.log('🔐 Sign in result:', { success: !error, error: error?.message });
      
      // Don't set loading to false here - let the auth state change handle it
      // This prevents the flickering issue
      
      return { data, error };
    } catch (error) {
      console.error('💥 Sign in catch error:', error);
      setLoading(false); // Only set loading to false on error
      return { 
        data: null, 
        error: { message: 'Network error. Please try again.' } 
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
    console.log('🚪 Signing out...');
    
    // Set sign-out loading state
    setSignOutLoading(true);
    
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
    signIn,
    signUp,
    signOut,
  };
};