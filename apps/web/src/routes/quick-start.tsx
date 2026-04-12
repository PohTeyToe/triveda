import { createFileRoute } from '@tanstack/react-router';
import { QuickStartScreen } from '../components/onboarding/QuickStartScreen';

export const Route = createFileRoute('/quick-start')({
  component: QuickStartPage,
});

function QuickStartPage() {
  return <QuickStartScreen />;
}
