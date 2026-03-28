import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import PageContainer from '../components/layout/PageContainer';

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('Confirming your email...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // PKCE flow: exchange the code from the URL for a session
        const code = searchParams.get('code');
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }

        // Check if we now have a valid session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setStatus('Email confirmed! Redirecting...');
          setTimeout(() => navigate('/designer'), 1000);
        } else {
          // No code and no session — might be hash-based flow
          // Wait a moment for onAuthStateChange to pick up hash tokens
          setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (retrySession) {
              setStatus('Email confirmed! Redirecting...');
              setTimeout(() => navigate('/designer'), 1000);
            } else {
              setError('Could not verify your email. The link may have expired.');
            }
          }, 2000);
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError(err.message || 'Something went wrong. Please try again.');
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  if (error) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <div className="text-5xl mb-6">😕</div>
          <h1 className="text-2xl font-semibold text-charcoal-500 mb-2">
            Verification Failed
          </h1>
          <p className="text-platinum-600 max-w-md mb-6">{error}</p>
          <button
            onClick={() => navigate('/register')}
            className="text-coral-500 hover:text-coral-600 font-medium"
          >
            Back to Sign Up
          </button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-400 mb-6"></div>
        <h1 className="text-2xl font-semibold text-charcoal-500 mb-2">
          {status}
        </h1>
        <p className="text-platinum-600">
          You'll be redirected to your dashboard shortly.
        </p>
      </div>
    </PageContainer>
  );
}

export default AuthCallbackPage;
