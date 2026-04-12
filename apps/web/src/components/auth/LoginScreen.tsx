/**
 * Login screen -- Supabase magic link authentication.
 *
 * Single email field, no passwords. Supabase signInWithOtp creates
 * the account if it does not exist.
 */

import { Link } from '@tanstack/react-router';
import { useCallback, useState } from 'react';
import { isDemoMode } from '../../lib/env';
import { supabase } from '../../lib/supabase';
import { Spinner } from '../onboarding/Spinner';

interface LoginScreenProps {
  mode: 'login' | 'signup';
}

export function LoginScreen({ mode }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const heading = mode === 'signup' ? 'Create your Triveda account' : 'Sign in to Triveda';

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim()) return;

      setIsSending(true);
      setError(null);

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
      });

      setIsSending(false);

      if (otpError) {
        setError(otpError.message);
        return;
      }

      setIsSent(true);
      startResendCooldown();
    },
    [email],
  );

  const startResendCooldown = useCallback(() => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0) return;
    setIsSending(true);
    setError(null);

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
    });

    setIsSending(false);

    if (otpError) {
      setError(otpError.message);
      return;
    }

    startResendCooldown();
  }, [email, resendCooldown, startResendCooldown]);

  // Sent confirmation state
  if (isSent) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="max-w-sm w-full text-center space-y-6 p-6">
          <h1 className="font-heading text-2xl font-bold text-dark dark:text-light">
            Check your email
          </h1>
          <p className="font-body text-sm text-gray-600 dark:text-gray-400">
            We sent a sign-in link to{' '}
            <span className="font-medium text-dark dark:text-light">{email}</span>. Click the link
            in the email to continue.
          </p>

          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || isSending}
            className="font-body text-sm text-teal hover:text-teal-soft
              disabled:opacity-50 disabled:cursor-not-allowed
              focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 rounded px-2 py-1"
          >
            {isSending ? (
              <Spinner size="sm" />
            ) : resendCooldown > 0 ? (
              `Resend link (${resendCooldown}s)`
            ) : (
              'Resend link'
            )}
          </button>

          <div>
            <button
              type="button"
              onClick={() => {
                setIsSent(false);
                setEmail('');
              }}
              className="font-body text-sm text-gray-500 dark:text-gray-400 hover:text-teal transition-colors"
            >
              Use a different email
            </button>
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-400 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="max-w-sm w-full space-y-6 p-6">
        {/* Logo */}
        <div className="text-center">
          <span className="font-heading text-3xl font-bold text-teal">Triveda</span>
        </div>

        <h1 className="font-heading text-2xl font-bold text-center text-dark dark:text-light">
          {heading}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="email"
              className="block font-body text-sm font-medium text-dark dark:text-light mb-1"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl font-body text-sm
                bg-white dark:bg-dark-surface
                border border-gray-300 dark:border-dark-border
                text-dark dark:text-light
                placeholder:text-gray-400
                focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent
                transition-colors"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-400 dark:text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!email.trim() || isSending}
            className="w-full py-3 px-6 rounded-xl font-body font-medium text-base
              bg-teal text-dark hover:bg-teal-soft
              disabled:opacity-50 disabled:cursor-not-allowed
              focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2
              transition-colors flex items-center justify-center"
          >
            {isSending ? <Spinner /> : 'Send magic link'}
          </button>
        </form>

        {/* Toggle between login/signup */}
        <p className="text-center font-body text-sm text-gray-500 dark:text-gray-400">
          {mode === 'signup' ? (
            <>
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-teal hover:text-teal-soft focus-visible:ring-2 focus-visible:ring-teal rounded"
              >
                Sign in
              </Link>
            </>
          ) : (
            <>
              New here?{' '}
              <Link
                to="/signup"
                className="text-teal hover:text-teal-soft focus-visible:ring-2 focus-visible:ring-teal rounded"
              >
                Sign up
              </Link>
            </>
          )}
        </p>

        {/* Demo mode shortcut */}
        {!isDemoMode() && (
          <p className="text-center">
            <Link
              to="/quick-start"
              className="font-body text-sm text-gray-400 hover:text-teal transition-colors"
            >
              Continue as guest
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
