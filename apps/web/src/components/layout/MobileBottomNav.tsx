import { Link, useMatchRoute } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { ClipboardCheck, Compass, Home, Search, User } from 'lucide-react';
import { bottomNavEntrance } from '../../lib/animations';

const TAB_ITEMS = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/constitution', label: 'Profile', icon: Compass },
  { to: '/check-in', label: 'Check-in', icon: ClipboardCheck },
  { to: '/browse', label: 'Browse', icon: Search },
  { to: '/settings', label: 'Settings', icon: User },
] as const;

export function MobileBottomNav() {
  const matchRoute = useMatchRoute();

  return (
    <motion.nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-50 glass dark:glass glass-light"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      {...bottomNavEntrance}
    >
      <div className="flex justify-around items-center px-2 h-16">
        {TAB_ITEMS.map((item) => {
          const isActive = matchRoute({ to: item.to, fuzzy: item.to !== '/' });
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal ${
                isActive ? 'text-teal' : 'text-cream/40 dark:text-cream/40 hover:text-teal/70'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] leading-none font-body">{item.label}</span>
              {/* Teal dot indicator */}
              {isActive && (
                <motion.span
                  layoutId="nav-dot"
                  className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-teal"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
