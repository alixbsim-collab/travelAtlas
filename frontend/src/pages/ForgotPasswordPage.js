import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;

      setSuccess(true);
    } catch (error) {
      setError(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <PageContainer className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md text-center !p-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center bg-green-50">
            <CheckCircle size={30} className="text-green-500" />
          </div>
          <h1 className="text-2xl font-semibold text-charcoal-500 mb-3">
            Check Your Email
          </h1>
          <p className="text-platinum-600 mb-6">
            We've sent a password reset link to <strong>{email}</strong>.
            Click the link in the email to reset your password.
          </p>
          <p className="text-sm text-platinum-500 mb-6">
            Didn't receive the email? Check your spam folder or try again.
          </p>
          <div className="space-y-3">
            <Button onClick={() => setSuccess(false)} variant="outline" className="w-full">
              Try Another Email
            </Button>
            <Link to="/login">
              <Button variant="primary" className="w-full">
                Back to Sign In
              </Button>
            </Link>
          </div>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md !p-8">
        <Link to="/login" className="inline-flex items-center gap-2 text-platinum-600 hover:text-coral-500 mb-6 text-sm transition-colors">
          <ArrowLeft size={16} />
          Back to Sign In
        </Link>

        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center bg-naples-100">
            <Mail size={26} className="text-naples-500" />
          </div>
          <h1 className="text-3xl font-semibold text-charcoal-500 mb-2">
            Forgot Password?
          </h1>
          <p className="text-platinum-600">
            No worries! Enter your email and we'll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
          />

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm">
          <span className="text-platinum-600">Remember your password? </span>
          <Link to="/login" className="text-coral-500 hover:text-coral-600 font-medium transition-colors">
            Sign in
          </Link>
        </div>
      </Card>
    </PageContainer>
  );
}

export default ForgotPasswordPage;
