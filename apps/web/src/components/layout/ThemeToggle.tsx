import { AnimatePresence, motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { type Theme, getTheme, toggleTheme } from '../../lib/theme';

export function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>(getTheme);

  function handleToggle() {
    const next = toggleTheme();
    setThemeState(next);
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="p-2 rounded-lg text-teal hover:bg-teal/10 transition-colors focus:outline-none focus:ring-2 focus:ring-teal"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === 'dark' ? (
          <motion.span
            key="sun"
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="block"
          >
            <Sun className="w-5 h-5" />
          </motion.span>
        ) : (
          <motion.span
            key="moon"
            initial={{ opacity: 0, rotate: 90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: -90 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="block"
          >
            <Moon className="w-5 h-5" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
