import { createFileRoute } from '@tanstack/react-router';
import { ConstitutionCardScreen } from '../components/onboarding/ConstitutionCardScreen';

export const Route = createFileRoute('/constitution')({
  component: ConstitutionPage,
});

function ConstitutionPage() {
  return <ConstitutionCardScreen />;
}
