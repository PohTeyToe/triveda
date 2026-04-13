import { createFileRoute } from '@tanstack/react-router';
import { WeeklyHerbScreen } from '../components/weekly-herb/WeeklyHerbScreen';

export const Route = createFileRoute('/weekly-herb')({
  component: WeeklyHerbPage,
});

function WeeklyHerbPage() {
  return <WeeklyHerbScreen />;
}
