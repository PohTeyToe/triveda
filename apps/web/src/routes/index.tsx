import { createFileRoute } from '@tanstack/react-router';
import { DailyCardHomeScreen } from '../components/daily-card';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  // In production, userId and authToken come from Supabase auth context.
  // For now, pass undefined -- TraditionStreamProvider handles missing auth gracefully.
  return <DailyCardHomeScreen />;
}
