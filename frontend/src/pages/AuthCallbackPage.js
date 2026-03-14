import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Confirming your email...');

  useEffect(() => {
    // Supabase automatically exchanges the token from the URL hash
    // The onAuthStateChange listener in AuthContext will pick up the session
    const timer = setTimeout(() => {
      setStatus('Email confirmed! Redirecting...');
      setTimeout(() => navigate('/designer'), 1000);
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-400 mb-6"></div>
        <h1 className="text-2xl font-heading font-bold text-charcoal-500 mb-2">
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
