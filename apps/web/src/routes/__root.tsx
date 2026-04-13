import { Outlet, createRootRoute, useRouterState } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { AnimatePresence, motion } from 'framer-motion';
import { MobileBottomNav } from '../components/layout/MobileBottomNav';
import { Navigation } from '../components/layout/Navigation';
import { AuthProvider } from '../contexts/AuthContext';
import { pageTransitionProps } from '../lib/animations';

/** Routes where nav chrome should be hidden (immersive flows) */
const HIDE_NAV_ROUTES = new Set([
  '/welcome',
  '/quick-start',
  '/login',
  '/signup',
  '/auth/callback',
]);

function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hideNav = HIDE_NAV_ROUTES.has(pathname);

  return (
    <AuthProvider>
      {/* Grain texture overlay */}
      <div className="grain" />

      <div className="min-h-screen flex flex-col">
        {!hideNav && <Navigation />}

        {/* Main content -- top padding for fixed nav, bottom for mobile nav */}
        <main className={`flex-1 ${hideNav ? '' : 'pt-12 pb-20 md:pb-0'}`}>
          <div className="mx-auto max-w-lg px-4">
            <AnimatePresence mode="wait">
              <motion.div key={pathname} {...pageTransitionProps}>
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {!hideNav && <MobileBottomNav />}

        {/* Dev tools */}
        {import.meta.env.DEV && <TanStackRouterDevtools />}
      </div>
    </AuthProvider>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});
