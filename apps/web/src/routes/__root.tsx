import { Link, Outlet, createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { type Theme, getTheme, toggleTheme } from '../lib/theme';

function RootLayout() {
  const [theme, setThemeState] = useState<Theme>(getTheme);

  function handleToggle() {
    const next = toggleTheme();
    setThemeState(next);
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-dark-border bg-dark-elevated dark:bg-dark-elevated px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-heading text-xl font-bold text-teal">
          Triveda
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link to="/" className="text-light/70 hover:text-teal transition-colors">
            Home
          </Link>
          <Link to="/constitution" className="text-light/70 hover:text-teal transition-colors">
            Constitution
          </Link>
          <Link to="/daily" className="text-light/70 hover:text-teal transition-colors">
            Daily
          </Link>
          <Link to="/browse" className="text-light/70 hover:text-teal transition-colors">
            Browse
          </Link>
          <Link to="/profile" className="text-light/70 hover:text-teal transition-colors">
            Profile
          </Link>
        </nav>
        <button
          type="button"
          onClick={handleToggle}
          className="p-2 rounded-lg bg-dark-surface hover:bg-dark-border transition-colors"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-teal" />
          ) : (
            <Moon className="w-5 h-5 text-teal" />
          )}
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 border-t border-dark-border bg-dark-elevated px-2 py-2 flex justify-around">
        <Link to="/" className="text-xs text-light/70 hover:text-teal">
          Home
        </Link>
        <Link to="/constitution" className="text-xs text-light/70 hover:text-teal">
          Constitution
        </Link>
        <Link to="/daily" className="text-xs text-light/70 hover:text-teal">
          Daily
        </Link>
        <Link to="/browse" className="text-xs text-light/70 hover:text-teal">
          Browse
        </Link>
        <Link to="/profile" className="text-xs text-light/70 hover:text-teal">
          Profile
        </Link>
      </nav>

      {/* Dev tools — only in development */}
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </div>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});
