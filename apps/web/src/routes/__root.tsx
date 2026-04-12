import { Outlet, createRootRoute, useRouterState } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { AnimatePresence, motion } from 'framer-motion';
import { Container } from '../components/layout/Container';
import { MobileBottomNav } from '../components/layout/MobileBottomNav';
import { Navigation } from '../components/layout/Navigation';
import { SeasonalTransitionCard } from '../components/profile-browse/SeasonalTransitionCard';
import { AuthProvider } from '../contexts/AuthContext';
import { pageTransitionProps } from '../lib/animations';

/** Routes where the bottom nav should be hidden */
const HIDE_NAV_ROUTES = new Set(['/quick-start', '/login', '/signup', '/auth/callback']);

function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hideNav = HIDE_NAV_ROUTES.has(pathname);

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Navigation />

        {/* Main content -- top padding for fixed nav, bottom padding for mobile nav */}
        <main className={`flex-1 pt-12 ${hideNav ? 'pb-0' : 'pb-16 md:pb-0'}`}>
          <Container>
            <AnimatePresence mode="wait">
              <motion.div key={pathname} {...pageTransitionProps}>
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </Container>
        </main>

        {!hideNav && <MobileBottomNav />}

        {/* Seasonal transition overlay (global) */}
        <SeasonalTransitionCard />

        {/* Dev tools -- only in development */}
        {import.meta.env.DEV && <TanStackRouterDevtools />}
      </div>
    </AuthProvider>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});
