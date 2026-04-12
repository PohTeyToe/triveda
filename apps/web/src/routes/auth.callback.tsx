/**
 * Auth callback route -- handles the Supabase magic link redirect.
 *
 * Extracts access_token and refresh_token from the URL hash fragment,
 * sets the session, and redirects to / (which then redirects based on profile).
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Spinner } from '../components/onboarding/Spinner';
import { supabase } from '../lib/supabase';

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      try {
        // Supabase JS v2 auto-detects the hash fragment and sets the session
        const { error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          setError(sessionError.message);
          navigate({ to: '/login', search: { error: 'callback_failed' } });
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          navigate({ to: '/' });
        } else {
          navigate({ to: '/login', search: { error: 'callback_failed' } });
        }
      } catch {
        setError('Authentication failed');
        navigate({ to: '/login', search: { error: 'callback_failed' } });
      }
    }

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <p className="font-body text-sm text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3">
      <Spinner />
      <p className="font-body text-sm text-gray-400 dark:text-gray-400">Signing you in...</p>
    </div>
  );
}
