import { Link, createFileRoute } from '@tanstack/react-router';
import { ChevronRight, LogOut, Moon, ScanFace, Sun, User } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isDemoMode } from '../lib/env';
import { type Theme, getTheme, toggleTheme } from '../lib/theme';

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, signOut } = useAuth();
  const [theme, setThemeState] = useState<Theme>(getTheme);

  function handleThemeToggle() {
    const next = toggleTheme();
    setThemeState(next);
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto py-6">
      <h1 className="font-heading text-2xl font-bold text-teal">Settings</h1>

      {/* Account section */}
      <section className="space-y-2">
        <h2 className="font-body text-xs uppercase tracking-wider text-cream/40 dark:text-cream/40 px-1">
          Account
        </h2>
        <div className="bg-dark-elevated dark:bg-dark-elevated bg-white/80 rounded-2xl divide-y divide-dark-border/30 dark:divide-dark-border/30">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-cream/60 dark:text-cream/60" />
              <div>
                <p className="font-body text-sm text-cream dark:text-cream text-dark">
                  {user?.user_metadata?.name ?? user?.email ?? 'Guest'}
                </p>
                {user?.email && (
                  <p className="font-body text-xs text-cream/40 dark:text-cream/40">{user.email}</p>
                )}
              </div>
            </div>
          </div>
          <Link
            to="/profile"
            className="flex items-center justify-between p-4 hover:bg-teal/5 transition-colors"
          >
            <span className="font-body text-sm text-cream dark:text-cream text-dark">
              Dietary preferences
            </span>
            <ChevronRight className="w-4 h-4 text-cream/40" />
          </Link>
          <Link
            to="/face-scan"
            className="flex items-center justify-between p-4 hover:bg-teal/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <ScanFace className="w-5 h-5 text-cream/60 dark:text-cream/60" />
              <span className="font-body text-sm text-cream dark:text-cream text-dark">
                Face scan
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-cream/40" />
          </Link>
        </div>
      </section>

      {/* Appearance section */}
      <section className="space-y-2">
        <h2 className="font-body text-xs uppercase tracking-wider text-cream/40 dark:text-cream/40 px-1">
          Appearance
        </h2>
        <div className="bg-dark-elevated dark:bg-dark-elevated bg-white/80 rounded-2xl">
          <button
            type="button"
            onClick={handleThemeToggle}
            className="w-full flex items-center justify-between p-4 hover:bg-teal/5 transition-colors rounded-2xl"
          >
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-cream/60 dark:text-cream/60" />
              ) : (
                <Sun className="w-5 h-5 text-cream/60 dark:text-cream/60" />
              )}
              <span className="font-body text-sm text-cream dark:text-cream text-dark">
                {theme === 'dark' ? 'Dark mode' : 'Light mode'}
              </span>
            </div>
            <span className="font-body text-xs text-cream/40 dark:text-cream/40 bg-dark-surface dark:bg-dark-surface px-2 py-1 rounded-lg">
              Tap to switch
            </span>
          </button>
        </div>
      </section>

      {/* About section */}
      <section className="space-y-2">
        <h2 className="font-body text-xs uppercase tracking-wider text-cream/40 dark:text-cream/40 px-1">
          About
        </h2>
        <div className="bg-dark-elevated dark:bg-dark-elevated bg-white/80 rounded-2xl divide-y divide-dark-border/30 dark:divide-dark-border/30">
          <div className="flex items-center justify-between p-4">
            <span className="font-body text-sm text-cream dark:text-cream text-dark">Version</span>
            <span className="font-body text-xs text-cream/40 dark:text-cream/40">0.9.0-beta</span>
          </div>
          {isDemoMode() && (
            <div className="flex items-center justify-between p-4">
              <span className="font-body text-sm text-cream dark:text-cream text-dark">Mode</span>
              <span className="font-body text-xs text-teal bg-teal/10 px-2 py-0.5 rounded-full">
                Demo
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Sign out */}
      <div className="pt-2">
        <button
          type="button"
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl
            text-red-400 hover:bg-red-400/10 transition-colors
            font-body text-sm
            focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-dark"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
