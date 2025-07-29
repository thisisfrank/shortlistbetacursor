import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { FormInput } from '../forms/FormInput';
import { Zap, AlertCircle, CheckCircle } from 'lucide-react';
import BoltIcon from '../../assets/v2.png';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 Signup form submitted');
    setLoading(true);
    setError('');

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

    console.log('📝 Attempting signup with role: client');
    const { data, error: signUpError } = await signUp(email, password, 'client', name);

    if (signUpError) {
      console.error('❌ Signup error:', signUpError);
      // Provide more helpful error messages
      let errorMessage = signUpError.message;
      if (signUpError.message.includes('already registered')) {
        errorMessage = 'An account with this email already exists. Please use a different email or try signing in instead.';
      } else if (signUpError.message.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (signUpError.message.includes('Password')) {
        errorMessage = 'Password must be at least 6 characters long.';
      }
      setError(errorMessage);
    } else if (data.user) {
      console.log('✅ Signup successful, showing success state');
      setSuccess(true);
      // Auto-redirect after successful signup since email confirmation is disabled
      setTimeout(() => {
        console.log('🏠 Redirecting to home page');
        // Check for redirect parameter
        const redirectTo = new URLSearchParams(window.location.search).get('redirect_to');
        navigate(redirectTo || '/');
      }, 2000);
    }

    setLoading(false);
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
              Account Created!
            </h1>
            <p className="text-guardian font-jakarta mb-6">
              Your account has been successfully created. You're being redirected to the dashboard.
            </p>
            <div className="mb-6">
              <Link
                to="/login"
                className="text-supernova hover:text-supernova-light font-semibold transition-colors font-jakarta"
              >
                Or click here to sign in manually
              </Link>
            </div>
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
              Create Client Account
            </h1>
            <p className="text-guardian font-jakarta">
              Start posting jobs and finding top talent
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
              placeholder="Enter your business email"
              hint="Business email required (no Gmail, Yahoo, etc.)"
              required
            />

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

            <div className="text-center py-4">
              <p className="text-guardian/80 font-jakarta text-sm">
                By Creating an account you agree to our <Link to="/terms" className="text-supernova hover:text-supernova-light font-semibold transition-colors">Terms of Service</Link> and <Link to="/privacy" className="text-supernova hover:text-supernova-light font-semibold transition-colors">Privacy Policy</Link>
              </p>
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

          <div className="mt-8 text-center">
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
        </CardContent>
      </Card>
    </div>
  );
};