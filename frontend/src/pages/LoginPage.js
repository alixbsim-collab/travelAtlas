import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) throw signInError;

      if (data.user) {
        // Successfully signed in
        navigate('/designer');
      }
    } catch (error) {
      if (error.message === 'Email not confirmed') {
        setError('Your email has not been confirmed yet. Please check your inbox for the confirmation link.');
      } else {
        setError(error.message || 'Failed to sign in. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md !p-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl text-charcoal-500 mb-2">
            Welcome Back
          </h1>
          <p className="text-platinum-600">
            Sign in to continue your journey
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

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
          />

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" className="mr-2 rounded border-platinum-300 text-coral-400 focus:ring-coral-200" />
              <span className="text-platinum-600">Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-coral-500 hover:text-coral-600 transition-colors">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm">
          <span className="text-platinum-600">Don't have an account? </span>
          <Link to="/register" className="text-coral-500 hover:text-coral-600 font-medium transition-colors">
            Sign up
          </Link>
        </div>
      </Card>
    </PageContainer>
  );
}

export default LoginPage;
