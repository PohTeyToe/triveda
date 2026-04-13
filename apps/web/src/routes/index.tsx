import { createFileRoute } from '@tanstack/react-router';
import { DailyCardHomeScreen } from '../components/daily-card';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const { user } = useAuth();
  return <DailyCardHomeScreen userId={user?.id} apiUrl={`${API_BASE}/api/v1`} />;
}
