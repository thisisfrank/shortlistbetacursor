import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { FormInput } from '../forms/FormInput';
import { Zap, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Debug: Log error state changes
  useEffect(() => {
    console.log('🔍 Error state changed to:', error);
  }, [error]);

  // Check for profile missing flag and redirect to signup
  useEffect(() => {
    const profileMissing = localStorage.getItem('profileMissing');
    if (profileMissing === 'true') {
      localStorage.removeItem('profileMissing');
      setError('Account not found. Please sign up first.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await signIn(email, password);
      
      console.log('🔐 Sign in result:', { data, error: signInError });

      if (signInError) {
        console.error('❌ Sign in error:', signInError);
        // Provide a more user-friendly error message that suggests signing up
        const errorMessage = signInError.message === 'Invalid login credentials' 
          ? 'Account not found. Please check your email or sign up for a new account.'
          : signInError.message || 'Login failed. Please try again.';
        setError(errorMessage);
        console.log('🚨 Setting error message:', errorMessage);
      } else if (data?.user) {
        console.log('✅ Login successful, redirecting...');
        // Check for redirect parameter
        const redirectTo = new URLSearchParams(location.search).get('redirect_to');
        navigate(redirectTo || '/');
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('💥 Unexpected login error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-shadowforce via-shadowforce-light to-shadowforce flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Zap size={48} className="text-supernova fill-current" />
                <div className="absolute inset-0 bg-supernova/30 blur-xl rounded-full"></div>
              </div>
            </div>
            <h1 className="text-2xl font-anton text-white-knight uppercase tracking-wide mb-2">
              Welcome Back
            </h1>
            <p className="text-guardian font-jakarta">
              Sign in to your Super Recruiter account
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center">
              <AlertCircle className="text-red-400 mr-3 flex-shrink-0" size={20} />
              <p className="text-red-400 font-jakarta text-sm">{error}</p>
            </div>
          )}
          
          {/* Debug: Show error state */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-2 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-400">
              Debug: Error state = "{error}"
            </div>
          )}
          
          {/* Test error display - always show this in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center">
              <AlertCircle className="text-red-400 mr-3 flex-shrink-0" size={20} />
              <p className="text-red-400 font-jakarta text-sm">Test error message - this should always show in development</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <FormInput
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />

            <FormInput
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={loading}
              disabled={!email || !password}
            >
              SIGN IN
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-guardian font-jakarta">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-supernova hover:text-supernova-light font-semibold transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};