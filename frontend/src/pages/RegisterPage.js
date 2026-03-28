import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Mail, CheckCircle } from 'lucide-react';

function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Sign up with Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (signUpError) throw signUpError;

      // Check if email confirmation is required
      if (data?.user?.identities?.length === 0) {
        setError('An account with this email already exists');
        return;
      }

      // Success! Check if email confirmation is needed
      if (data.user && !data.session) {
        setConfirmationSent(true);
      } else {
        // Auto-logged in (no email confirmation required)
        navigate('/designer');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (confirmationSent) {
    return (
      <PageContainer className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md text-center !p-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center bg-coral-50">
            <Mail size={30} className="text-coral-400" />
          </div>
          <h1 className="text-2xl text-charcoal-500 mb-3">
            Check Your Email
          </h1>
          <p className="text-platinum-600 mb-2">
            We've sent a confirmation link to
          </p>
          <p className="font-medium text-charcoal-500 mb-6">{formData.email}</p>
          <p className="text-sm text-platinum-500 mb-6 leading-relaxed">
            Click the link in the email to activate your account. Check your spam folder if you don't see it.
          </p>
          <div className="flex items-center gap-2 justify-center text-sm text-platinum-500">
            <CheckCircle size={14} className="text-green-500" />
            Account created successfully
          </div>
          <div className="mt-6 pt-6 border-t border-platinum-100">
            <Link to="/login" className="text-coral-500 hover:text-coral-600 font-medium text-sm transition-colors">
              Go to Sign In
            </Link>
          </div>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md !p-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl text-charcoal-500 mb-2">
            Join The Travel Atlas
          </h1>
          <p className="text-platinum-600">
            Start planning your perfect adventure
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <Input
            label="Full Name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            required
          />

          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="your@email.com"
            required
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
            minLength={6}
          />

          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />

          <div className="text-sm text-platinum-600">
            <label className="flex items-start cursor-pointer">
              <input type="checkbox" className="mr-2.5 mt-1 rounded border-platinum-300 text-coral-400 focus:ring-coral-200" required />
              <span>
                I agree to the{' '}
                <Link to="/terms" className="text-coral-500 hover:text-coral-600 transition-colors">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-coral-500 hover:text-coral-600 transition-colors">
                  Privacy Policy
                </Link>
              </span>
            </label>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm">
          <span className="text-platinum-600">Already have an account? </span>
          <Link to="/login" className="text-coral-500 hover:text-coral-600 font-medium transition-colors">
            Sign in
          </Link>
        </div>
      </Card>
    </PageContainer>
  );
}

export default RegisterPage;
