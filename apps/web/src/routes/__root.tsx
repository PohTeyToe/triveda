import { Outlet, createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { Container } from '../components/layout/Container';
import { MobileBottomNav } from '../components/layout/MobileBottomNav';
import { Navigation } from '../components/layout/Navigation';

function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      {/* Main content — top padding for fixed nav, bottom padding for mobile nav */}
      <main className="flex-1 pt-12 pb-16 md:pb-0">
        <Container>
          <Outlet />
        </Container>
      </main>

      <MobileBottomNav />

      {/* Dev tools — only in development */}
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </div>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});
