import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { FormInput } from '../forms/FormInput';
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: resetError } = await resetPassword(email);

    if (resetError) {
      console.error('Password reset error:', resetError);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to send password reset email. Please try again.';
      
      if (resetError.message?.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (resetError.message?.includes('rate limit')) {
        errorMessage = 'Too many reset attempts. Please wait a few minutes before trying again.';
      } else if (resetError.message?.includes('User not found') || resetError.message?.includes('not found')) {
        errorMessage = 'No account found with this email address. Please check your email or sign up for a new account.';
      } else if (resetError.message?.includes('email not confirmed')) {
        errorMessage = 'Your email address is not confirmed. Please check your inbox for the confirmation email first.';
      } else if (resetError.message) {
        errorMessage = `Reset failed: ${resetError.message}`;
      }
      
      setError(errorMessage);
    } else {
      console.log('Password reset email sent successfully');
      setSuccess(true);
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
              Email Sent!
            </h1>
            <p className="text-guardian font-jakarta mb-6">
              We've sent a password reset link to <strong>{email}</strong>. Please check your inbox (and spam folder) and click the link to reset your password. The link will expire in 1 hour.
            </p>
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-blue-400 font-jakarta text-sm">
                <strong>Next steps:</strong><br />
                1. Check your email inbox<br />
                2. Click the reset link in the email<br />
                3. Enter your new password<br />
                4. Sign in with your new password
              </p>
            </div>
            <Link
              to="/login"
              className="text-supernova hover:text-supernova-light font-semibold transition-colors font-jakarta"
            >
              Back to Sign In
            </Link>
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
                    src="/screenshots/v2.png"
                    alt="Lightning Bolt"
                    className="animate-pulse"
                    style={{ width: '60px', height: '28px', filter: 'drop-shadow(0 0 8px #FFD600)', objectFit: 'contain' }}
                  />
                  <div className="absolute inset-0 bg-supernova/30 blur-xl"></div>
                </div>
              </Link>
            </div>
            <h1 className="text-2xl font-anton text-white-knight uppercase tracking-wide mb-2">
              Reset Password
            </h1>
            <p className="text-guardian font-jakarta">
              Enter your email address and we'll send you a link to reset your password
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
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={loading}
              disabled={!email}
            >
              SEND RESET LINK
            </Button>
          </form>

          <div className="mt-8 text-center">
            <Link
              to="/login"
              className="text-guardian hover:text-supernova font-jakarta transition-colors inline-flex items-center"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 