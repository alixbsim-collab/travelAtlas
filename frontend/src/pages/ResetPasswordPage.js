import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Lock, CheckCircle } from 'lucide-react';

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // Listen for the PASSWORD_RECOVERY event from Supabase
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
    });

    // Also check if we already have a session (user clicked link and session was set)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.');
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
            Password Updated!
          </h1>
          <p className="text-platinum-600 mb-4">
            Your password has been successfully reset. Redirecting you to sign in...
          </p>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md !p-8">
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center bg-naples-100">
            <Lock size={26} className="text-naples-500" />
          </div>
          <h1 className="text-3xl font-semibold text-charcoal-500 mb-2">
            Set New Password
          </h1>
          <p className="text-platinum-600">
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {!sessionReady && (
            <div className="bg-amber-50 border border-amber-200 text-amber-600 px-4 py-3 rounded-xl text-sm">
              Verifying your reset link... If this takes too long, try requesting a new reset email.
            </div>
          )}

          <Input
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <Button type="submit" className="w-full" size="lg" disabled={loading || !sessionReady}>
            {loading ? 'Updating...' : 'Reset Password'}
          </Button>
        </form>
      </Card>
    </PageContainer>
  );
}

export default ResetPasswordPage;
