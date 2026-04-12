import { Link } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/constitution', label: 'Constitution' },
  { to: '/profile', label: 'Profile' },
  { to: '/browse', label: 'Browse' },
  { to: '/settings', label: 'Settings' },
] as const;

export function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-dark-elevated/80 dark:bg-dark-elevated/80 border-b border-dark-border">
      <nav aria-label="Main navigation" className="px-4 py-2 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="font-heading text-xl font-bold text-teal focus:outline-none focus:ring-2 focus:ring-teal rounded"
        >
          Triveda
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-light/70 dark:text-light/70 hover:text-teal transition-colors focus:outline-none focus:ring-2 focus:ring-teal rounded px-1"
              activeProps={{
                className: 'text-teal border-b-2 border-teal',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side: theme toggle + hamburger */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-lg text-light/70 hover:bg-teal/10 transition-colors focus:outline-none focus:ring-2 focus:ring-teal"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="md:hidden overflow-hidden border-b border-dark-border bg-dark-elevated/95 backdrop-blur-md"
          >
            <div className="flex flex-col px-4 py-2 gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-sm text-light/70 hover:text-teal py-2 px-2 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-teal"
                  activeProps={{
                    className: 'text-teal bg-teal/10',
                  }}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
