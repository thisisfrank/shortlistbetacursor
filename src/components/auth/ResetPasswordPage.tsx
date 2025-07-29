import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { FormInput } from '../forms/FormInput';
import { AlertCircle, CheckCircle } from 'lucide-react';
import BoltIcon from '../../assets/v2.png';

export const ResetPasswordPage: React.FC = () => {
  const { updatePassword, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [waitingForAuth, setWaitingForAuth] = useState(true);

  useEffect(() => {
    console.log('🔑 ResetPasswordPage mounted, checking user auth state:', {
      hasUser: !!user,
      userEmail: user?.email,
      authLoading,
      pathname: window.location.pathname,
      hash: window.location.hash
    });
    
    // Wait a bit for auth to initialize
    const authTimer = setTimeout(() => {
      setWaitingForAuth(false);
      
      if (!user && !authLoading) {
        console.warn('⚠️ User not authenticated on reset password page');
        setError('Invalid reset session. Please request a new password reset.');
      } else if (user) {
        console.log('✅ User authenticated for password reset:', user.email);
        setError(''); // Clear any previous errors
      }
    }, 2000); // Wait 2 seconds for auth to settle

    return () => clearTimeout(authTimer);
  }, [user, authLoading]);

  // Show loading state while waiting for auth
  if (waitingForAuth || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-shadowforce via-shadowforce-light to-shadowforce flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-supernova"></div>
            </div>
            <h1 className="text-xl font-anton text-white-knight uppercase tracking-wide mb-2">
              Authenticating...
            </h1>
            <p className="text-guardian font-jakarta">
              Please wait while we verify your reset session
            </p>
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