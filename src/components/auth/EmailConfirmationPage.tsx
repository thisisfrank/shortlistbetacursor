import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { CheckCircle, AlertCircle, Mail, RefreshCw } from 'lucide-react';
import BoltIcon from '../../assets/v2.png';

export const EmailConfirmationPage: React.FC = () => {
  const { user, userProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  // Check for confirmation token in hash (Supabase uses hash fragments, not query params)
  useEffect(() => {
    const hash = window.location.hash;
    console.log('📧 Email confirmation page loaded, hash:', hash);
    
    if (hash && hash.includes('access_token')) {
      // Supabase is processing the confirmation
      console.log('📧 Confirmation token detected in URL, waiting for auth to process...');
      setConfirmed(true);
      setLoading(false);
    } else {
      // No token in URL - user navigated here directly or after signup
      console.log('📧 No confirmation token in URL');
      setLoading(false);
    }
  }, []);

  // Redirect to dashboard once user is authenticated after confirmation
  useEffect(() => {
    if (!authLoading && user && userProfile) {
      console.log('📧 User authenticated and profile loaded, redirecting to dashboard');
      // Redirect to appropriate dashboard based on role
      const redirectPath = userProfile.role === 'admin' 
        ? '/admin' 
        : userProfile.role === 'sourcer' 
        ? '/sourcer' 
        : '/client';
      
      // Immediate redirect - no waiting
      navigate(redirectPath, { replace: true });
    }
  }, [authLoading, user, userProfile, navigate]);

  const handleResendConfirmation = async () => {
    if (!user?.email) {
      setError('No email found. Please sign up again.');
      return;
    }

    setResendLoading(true);
    setError('');

    try {
      const { supabase } = await import('../../lib/supabase');
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) {
        throw error;
      }

      // Show success message
      setError('');
      // You could add a success state here if needed
    } catch (error: any) {
      console.error('Resend confirmation error:', error);
      setError('Failed to resend confirmation email. Please try again later.');
    } finally {
      setResendLoading(false);
    }
  };

  // If we have a token and confirmed successfully
  if (confirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-shadowforce via-shadowforce-light to-shadowforce flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <CheckCircle size={64} className="text-green-400 animate-pulse" />
                <div className="absolute inset-0 bg-green-400/30 blur-xl rounded-full"></div>
              </div>
            </div>
            <h1 className="text-2xl font-anton text-white-knight uppercase tracking-wide mb-4">
              Email Confirmed!
            </h1>
            <p className="text-guardian font-jakarta mb-6">
              Signing you in and redirecting to your dashboard...
            </p>
            <div className="mt-6">
              <div className="w-full bg-shadowforce rounded-full h-2">
                <div className="bg-supernova h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If we're still loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-shadowforce via-shadowforce-light to-shadowforce flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-6">
              <RefreshCw size={48} className="text-supernova animate-spin" />
            </div>
            <h1 className="text-2xl font-anton text-white-knight uppercase tracking-wide mb-4">
              Confirming Email...
            </h1>
            <p className="text-guardian font-jakarta">
              Please wait while we confirm your email address.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default state - show confirmation pending message
  return (
    <div className="min-h-screen bg-gradient-to-br from-shadowforce via-shadowforce-light to-shadowforce flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center mb-8">
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
            
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Mail size={64} className="text-supernova" />
                <div className="absolute inset-0 bg-supernova/30 blur-xl rounded-full"></div>
              </div>
            </div>
            
            <h1 className="text-2xl font-anton text-white-knight uppercase tracking-wide mb-4">
              Check Your Email
            </h1>
            <p className="text-guardian font-jakarta mb-6">
              We've sent a confirmation link to your email address. Please check your inbox and click the link to activate your account.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center">
              <AlertCircle className="text-red-400 mr-3 flex-shrink-0" size={20} />
              <p className="text-red-400 font-jakarta text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <Button
              onClick={handleResendConfirmation}
              fullWidth
              size="lg"
              isLoading={resendLoading}
              disabled={!user?.email}
              variant="outline"
            >
              Resend Confirmation Email
            </Button>
            
            <div className="text-center">
              <p className="text-guardian font-jakarta text-sm mb-2">
                Didn't receive the email? Check your spam folder.
              </p>
              <p className="text-guardian font-jakarta text-sm">
                Wrong email address?{' '}
                <button
                  onClick={() => {
                    signOut();
                    navigate('/signup');
                  }}
                  className="text-supernova hover:text-supernova-light font-semibold transition-colors"
                >
                  Sign up again
                </button>
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/login"
              className="text-supernova hover:text-supernova-light font-semibold transition-colors font-jakarta"
            >
              Back to Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
