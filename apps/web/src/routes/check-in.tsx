import { createFileRoute } from '@tanstack/react-router';
import { CheckInScreen } from '../components/check-in/CheckInScreen';

export const Route = createFileRoute('/check-in')({
  component: CheckInPage,
});

function CheckInPage() {
  return <CheckInScreen />;
}
