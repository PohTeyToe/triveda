import { Link, useMatchRoute } from '@tanstack/react-router';
import { Compass, Home, Search, Settings, User } from 'lucide-react';

const TAB_ITEMS = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/daily', label: 'Daily', icon: Compass },
  { to: '/browse', label: 'Browse', icon: Search },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const;

export function MobileBottomNav() {
  const matchRoute = useMatchRoute();

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-dark-elevated dark:bg-dark-elevated border-t border-dark-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex justify-around items-center px-2 py-2">
        {TAB_ITEMS.map((item) => {
          const isActive = matchRoute({ to: item.to, fuzzy: item.to !== '/' });
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal ${
                isActive
                  ? 'text-teal drop-shadow-[0_0_6px_rgba(20,184,166,0.4)]'
                  : 'text-light/50 hover:text-teal'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
