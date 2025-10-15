import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { FormInput } from '../forms/FormInput';
import { AlertCircle, CheckCircle } from 'lucide-react';
import BoltIcon from '../../assets/v2.png';
import { supabase } from '../../lib/supabase';

export const SignupPage: React.FC = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [emailExists, setEmailExists] = useState(false);

  // List of common personal email domains that should be rejected
  const personalEmailDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com',
    'aol.com', 'icloud.com', 'me.com', 'mac.com', 'protonmail.com',
    'yandex.com', 'mail.com', 'gmx.com', 'zoho.com', 'fastmail.com'
  ];

  const isBusinessEmail = (email: string): boolean => {
    const domain = email.toLowerCase().split('@')[1];
    return domain ? !personalEmailDomains.includes(domain) : false;
  };

  const checkEmailExists = async (email: string) => {
    try {
      console.log('🔍 Checking if email exists:', email);
      const { error } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('email', email.toLowerCase())
        .single();
      
      if (error) {
        // If error code is 'PGRST116', it means no row found (email doesn't exist)
        if (error.code === 'PGRST116') {
          console.log('✅ Email does not exist, can proceed with signup');
          return { exists: false, error: null };
        }
        // Other errors
        console.error('❌ Error checking email existence:', error);
        return { exists: false, error };
      }
      
      // If we get data back, the email exists
      console.log('⚠️ Email already exists in database');
      return { exists: true, error: null };
    } catch (error) {
      console.error('❌ Exception checking email existence:', error);
      return { exists: false, error };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 Signup form submitted');
    setLoading(true);
    setError('');
    setEmailExists(false);

    // Validation checks first
    if (!isBusinessEmail(email)) {
      setError('Please use a business email address. Personal email addresses (Gmail, Yahoo, Hotmail, etc.) are not allowed.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    // CRITICAL: Check if email exists BEFORE calling signUp
    console.log('🔍 Checking email existence before signup...');
    const { exists, error: checkError } = await checkEmailExists(email);
    
    if (checkError) {
      console.error('❌ Error checking email existence, but continuing with signup:', checkError);
      // Continue with signup if check fails (don't block signup due to check error)
    } else if (exists) {
      console.log('⚠️ Email already exists, showing email exists UI');
      setEmailExists(true);
      setError('');
      setLoading(false);
      return; // STOP HERE - do not proceed to signUp
    }

    // Only proceed with signup if email doesn't exist
    console.log('📝 Email is available, proceeding with signup...');
    const { data, error: signUpError } = await signUp(email, password, 'client', name);

    console.log('🔍 Signup response:', { data, error: signUpError, hasUser: !!data?.user });

    if (signUpError) {
      console.error('❌ Signup error:', signUpError);
      // Provide helpful error messages for signup errors
      let errorMessage = signUpError.message;
      if (signUpError.message.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (signUpError.message.includes('Password')) {
        errorMessage = 'Password must be at least 6 characters long.';
      } else if (signUpError.message.includes('already registered')) {
        // This should not happen now since we check first, but handle it
        setEmailExists(true);
        setError('');
        setLoading(false);
        return;
      }
      setError(errorMessage);
    } else if (data) {
      // With email confirmation enabled, data.user might be null but data.session will exist
      console.log('✅ Signup successful, redirecting to email confirmation page');
      // Store email temporarily for the confirmation page
      localStorage.setItem('pendingConfirmationEmail', email);
      // Redirect to dedicated email confirmation page
      navigate('/confirm-email');
    }

    setLoading(false);
  };

  // Note: success state removed since we now redirect to /confirm-email

  return (
    <div className="min-h-screen bg-gradient-to-br from-shadowforce via-shadowforce-light to-shadowforce flex items-center justify-center px-4 py-6">
      <Card className="w-full max-w-4xl">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <Link to="/">
                <div className="relative cursor-pointer">
                  <img
                    src={BoltIcon}
                    alt="Lightning Bolt"
                    className="animate-pulse"
                    style={{ width: '60px', height: '28px', filter: 'drop-shadow(0 0 8px #FFD600)', objectFit: 'contain' }}
                  />
                  <div className="absolute inset-0 bg-supernova/30 blur-xl"></div>
                </div>
              </Link>
            </div>
            <h1 className="text-2xl font-anton text-white-knight uppercase tracking-wide mb-1">
              Create Account
            </h1>
            <p className="text-guardian font-jakarta mt-1">
              "We don't rely on job boards anymore. Candidates are sent to us and we just schedule interviews from there."
            </p>
            <p className="text-guardian font-jakarta text-center mt-1">
              - Nate Reitcher, CEO of Collector
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center">
              <AlertCircle className="text-red-400 mr-3 flex-shrink-0" size={20} />
              <p className="text-red-400 font-jakarta text-sm">{error}</p>
            </div>
          )}

          {emailExists && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div className="flex items-center mb-3">
                <AlertCircle className="text-amber-400 mr-3 flex-shrink-0" size={20} />
                <p className="text-amber-400 font-jakarta text-sm font-semibold">
                  An account with this email already exists
                </p>
              </div>
              <p className="text-guardian font-jakarta text-sm mb-4">
                It looks like you already have an account with <span className="text-white-knight font-medium">{email}</span>. 
                Please try one of the options below:
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/login"
                  className="flex-1 bg-supernova hover:bg-supernova-light text-shadowforce font-semibold py-2 px-4 rounded-lg transition-colors text-center font-jakarta text-sm"
                >
                  Sign In Instead
                </Link>
                <Link
                  to="/forgot-password"
                  className="flex-1 bg-transparent hover:bg-white-knight/10 text-supernova border border-supernova/30 hover:border-supernova font-semibold py-2 px-4 rounded-lg transition-colors text-center font-jakarta text-sm"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First Row: Name and Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Full Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
              />

              <FormInput
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                hint="Business email required (no Gmail, Yahoo, etc.)"
                required
              />
            </div>

            {/* Second Row: Password and Confirm Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                hint="Must be at least 6 characters long"
                showPasswordToggle={true}
                required
              />

              <FormInput
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                showPasswordToggle={true}
                showPasswordMatch={confirmPassword.length > 0}
                isPasswordMatch={password === confirmPassword && password.length > 0}
                required
              />
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={loading}
              disabled={!name || !email || !password || !confirmPassword}
            >
              CREATE ACCOUNT
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-guardian font-jakarta">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-supernova hover:text-supernova-light font-semibold transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <p className="text-guardian/80 font-jakarta text-sm">
              By Creating an account you agree to our <Link to="/terms" className="text-supernova hover:text-supernova-light font-semibold transition-colors">Terms of Service</Link> and <Link to="/privacy" className="text-supernova hover:text-supernova-light font-semibold transition-colors">Privacy Policy</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};