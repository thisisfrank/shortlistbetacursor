import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { FormInput } from '../forms/FormInput';
import { AlertCircle, CheckCircle } from 'lucide-react';
import BoltIcon from '../../assets/v2.png';
import { supabase } from '../../lib/supabase';

export const ResetPasswordPage: React.FC = () => {
  const { updatePassword, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [waitingForAuth, setWaitingForAuth] = useState(true);
  const [isValidSession, setIsValidSession] = useState(false);

  // Debug: Log when component mounts
  useEffect(() => {
    const urlInfo = {
      fullURL: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      queryParams: Object.fromEntries(new URLSearchParams(window.location.search)),
      hashParams: window.location.hash ? Object.fromEntries(new URLSearchParams(window.location.hash.substring(1))) : {}
    };
    
    console.log('🔑 ResetPasswordPage component mounted!', urlInfo);
    console.log('🔍 DETAILED URL ANALYSIS:', {
      hasAccessTokenInQuery: window.location.search.includes('access_token'),
      hasAccessTokenInHash: window.location.hash.includes('access_token'),
      hasTypeRecoveryInQuery: window.location.search.includes('type=recovery'),
      hasTypeRecoveryInHash: window.location.hash.includes('type=recovery'),
      fullHref: window.location.href
    });
  }, []);

  useEffect(() => {
    const handlePasswordRecovery = async () => {
      console.log('🔑 ResetPasswordPage mounted, checking auth state:', {
        hasUser: !!user,
        userEmail: user?.email,
        authLoading,
        search: window.location.search,
        hash: window.location.hash
      });

      // Check for recovery tokens in URL query parameters (Supabase sends them there)
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token');
      const type = urlParams.get('type');
      
      // Also check hash as fallback (some configurations might use hash)
      if (!accessToken && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hashAccessToken = hashParams.get('access_token');
        const hashRefreshToken = hashParams.get('refresh_token');
        const hashType = hashParams.get('type');
        
        if (hashAccessToken && hashRefreshToken && hashType === 'recovery') {
          console.log('🔑 Found recovery tokens in hash (fallback)');
          return handleTokens(hashAccessToken, hashRefreshToken, hashParams);
        }
      }
      
      if (accessToken && refreshToken && type === 'recovery') {
        console.log('🔑 Found recovery tokens in query params');
        return handleTokens(accessToken, refreshToken, urlParams);
      } else if (user) {
        console.log('✅ User already authenticated for password reset:', user.email);
        setIsValidSession(true);
        setError('');
      } else if (!authLoading) {
        console.warn('⚠️ No recovery tokens found and user not authenticated');
        setError('Invalid reset link. Please request a new password reset from the login page.');
      }

      setWaitingForAuth(false);
    };

    const handleTokens = async (accessToken: string, refreshToken: string, params: URLSearchParams) => {
      // Check for error in URL first
      const error = params.get('error');
      const errorDescription = params.get('error_description');
      
      if (error) {
        console.error('❌ URL contains error:', error, errorDescription);
        setError(`Reset link error: ${errorDescription || error}`);
        setWaitingForAuth(false);
        return;
      }

      try {
        console.log('🔑 Setting session with recovery tokens...');
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          console.error('❌ Error setting session:', sessionError);
          setError('Invalid or expired reset link. Please request a new password reset.');
        } else {
          console.log('✅ Session set successfully for password recovery');
          setIsValidSession(true);
          setError('');
        }
      } catch (err) {
        console.error('❌ Exception setting session:', err);
        setError('Failed to authenticate reset link. Please request a new password reset.');
      }
      
      setWaitingForAuth(false);
    };

    // Wait for auth to initialize, then handle recovery
    if (!authLoading) {
      handlePasswordRecovery();
    }
  }, [user, authLoading]);

  // Show loading state while waiting for auth
  if (waitingForAuth || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-shadowforce via-shadowforce-light to-shadowforce flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin mx-auto mb-4 w-8 h-8 border-4 border-supernova border-t-transparent rounded-full"></div>
            <p className="text-guardian font-jakarta">Verifying reset link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state if session is invalid
  if (error && !isValidSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-shadowforce via-shadowforce-light to-shadowforce flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <AlertCircle size={64} className="text-red-400" />
                <div className="absolute inset-0 bg-red-400/30 blur-xl rounded-full"></div>
              </div>
            </div>
            <h1 className="text-2xl font-anton text-white-knight uppercase tracking-wide mb-4">
              Invalid Reset Link
            </h1>
            <p className="text-guardian font-jakarta mb-6">
              {error}
            </p>
            <Link
              to="/forgot-password"
              className="inline-block px-6 py-3 bg-supernova text-shadowforce font-jakarta font-semibold rounded-lg hover:bg-supernova-light transition-colors"
            >
              Request New Reset Link
            </Link>
            <div className="mt-4">
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
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!user) {
        setError('You must be authenticated to reset your password.');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }

      console.log('🔑 Attempting to update password...');
      const { error: updateError } = await updatePassword(password);

      if (updateError) {
        console.error('❌ Password update error:', updateError);
        setError('Failed to update password. Please try again.');
      } else {
        console.log('✅ Password updated successfully');
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      console.error('💥 Unexpected error during password update:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-shadowforce via-shadowforce-light to-shadowforce flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <CheckCircle size={64} className="text-green-400" />
                <div className="absolute inset-0 bg-green-400/30 blur-xl rounded-full"></div>
              </div>
            </div>
            <h1 className="text-2xl font-anton text-white-knight uppercase tracking-wide mb-4">
              Password Updated!
            </h1>
            <p className="text-guardian font-jakarta mb-6">
              Your password has been successfully updated. You're being redirected to the login page.
            </p>
            <div className="animate-pulse">
              <div className="w-full bg-shadowforce rounded-full h-2">
                <div className="bg-supernova h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <h1 className="text-2xl font-anton text-white-knight uppercase tracking-wide mb-2">
              Set New Password
            </h1>
            <p className="text-guardian font-jakarta">
              Enter your new password below
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center">
              <AlertCircle className="text-red-400 mr-3 flex-shrink-0" size={20} />
              <p className="text-red-400 font-jakarta text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <FormInput
              label="New Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your new password"
              hint="Must be at least 6 characters long"
              showPasswordToggle={true}
              required
            />

            <FormInput
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
              showPasswordToggle={true}
              showPasswordMatch={confirmPassword.length > 0}
              isPasswordMatch={password === confirmPassword && password.length > 0}
              required
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={loading}
              disabled={!password || !confirmPassword || !user}
            >
              UPDATE PASSWORD
            </Button>
          </form>

          {!user && (
            <div className="mt-6 text-center space-y-4">
              <button
                onClick={() => {
                  const hash = window.location.hash;
                  const fullUrl = window.location.href;
                  console.log('🔍 MANUAL URL CHECK:', {
                    hash,
                    fullUrl,
                    pathname: window.location.pathname,
                    search: window.location.search,
                    hasRecovery: hash.includes('type=recovery'),
                    params: hash ? Object.fromEntries(new URLSearchParams(hash.substring(1))) : {}
                  });
                  alert('Check console for URL details');
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-jakarta"
              >
                Test URL Detection
              </button>
              <Link
                to="/forgot-password"
                className="block text-supernova hover:text-supernova-light font-semibold transition-colors font-jakarta"
              >
                Request a new password reset
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 