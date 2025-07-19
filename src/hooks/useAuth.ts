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
    // SIMPLE: Get session and listen for changes
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        
        setUserProfile(profile);
      }
      setLoading(false);
    };

    initAuth();

    // SIMPLE: Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

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