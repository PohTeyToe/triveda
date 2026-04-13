import { Link } from '@tanstack/react-router';
import { LeafIcon } from './LeafIcon';
import { ThemeToggle } from './ThemeToggle';

export function Navigation() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 glass dark:glass glass-light">
      <nav
        aria-label="Main navigation"
        className="px-4 py-2.5 flex items-center justify-between max-w-lg mx-auto"
      >
        {/* Logo: leaf + wordmark */}
        <Link
          to="/"
          className="flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal rounded"
        >
          <LeafIcon className="w-5 h-5 text-teal" />
          <span className="font-heading text-lg font-bold tracking-tight text-teal">Triveda</span>
        </Link>

        {/* Right side */}
        <ThemeToggle />
      </nav>
    </header>
  );
}
