import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { FormInput } from '../forms/FormInput';
import { Zap, AlertCircle } from 'lucide-react';
import BoltIcon from '../../assets/v2.png';

export const LoginPage: React.FC = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(() => {
    // Get error from sessionStorage on component mount
    return sessionStorage.getItem('loginError') || '';
  });

  // Simple function to set error and persist it
  const setErrorPersistent = (message: string) => {
    sessionStorage.setItem('loginError', message);
    setError(message);
  };

  // Clear error from storage when component mounts (fresh page load)
  useEffect(() => {
    const clearError = () => {
      sessionStorage.removeItem('loginError');
      setError('');
    };
    // Clear error after 30 seconds or on successful operations
    const timer = setTimeout(clearError, 30000);
    return () => clearTimeout(timer);
  }, []);

  // Check for profile missing flag and redirect to signup
  useEffect(() => {
    const profileMissing = localStorage.getItem('profileMissing');
    if (profileMissing === 'true') {
      localStorage.removeItem('profileMissing');
      setErrorPersistent('Account not found. Please sign up first.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setErrorPersistent('Please enter both email and password');
      return;
    }
    
          setLoading(true);
      sessionStorage.removeItem('loginError'); // Clear persistent error
      setError(''); // Clear temporary error

    try {
      const { data, error: signInError } = await signIn(email, password);
      
      console.log('🔐 Sign in result:', { data, error: signInError });

      if (signInError) {
        console.error('❌ Sign in error:', signInError);
        
        // Enhanced error handling with more specific messages
        let errorMessage = 'Login failed. Please try again.';
        
        if (signInError.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password.\nPlease check your credentials and try again.';
        } else if (signInError.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and click the confirmation link before signing in.';
        } else if (signInError.message.includes('Too many requests')) {
          errorMessage = 'Too many login attempts. Please wait a few minutes before trying again.';
        } else if (signInError.message.includes('timeout')) {
          errorMessage = 'Connection timeout. Please check your internet connection and try again.';
        } else if (signInError.message.includes('Network error')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (signInError.message) {
          // Use the actual error message if it's user-friendly
          errorMessage = signInError.message;
        }
        
        setErrorPersistent(errorMessage);
      } else if (data?.user) {
        console.log('✅ Login successful, redirecting...');
        // Check for redirect parameter
        const redirectTo = new URLSearchParams(location.search).get('redirect_to');
        navigate(redirectTo || '/');
      } else {
        setErrorPersistent('Login failed. Please check your email and password.');
      }
    } catch (error) {
      console.error('💥 Unexpected login error:', error);
      setErrorPersistent('An unexpected error occurred. Please try again in a few moments.');
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
              Welcome Back
            </h1>
            <p className="text-guardian font-jakarta">
              Sign in to your Super Recruiter account
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
              <div className="flex flex-col items-center justify-center mb-3">
                <AlertCircle className="text-red-400 mb-3 flex-shrink-0" size={20} />
                <p className="text-red-400 font-jakarta text-sm whitespace-pre-line">{error}</p>
              </div>
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
              showPasswordToggle={true}
              required
            />

            <div className="text-center mb-4">
              <Link
                to="/forgot-password"
                className="text-supernova hover:text-supernova-light font-semibold transition-colors text-sm font-jakarta"
              >
                Forgot your password?
              </Link>
            </div>

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