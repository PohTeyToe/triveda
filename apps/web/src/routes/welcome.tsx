import { createFileRoute } from '@tanstack/react-router';
import { WelcomeLandingScreen } from '../components/onboarding/WelcomeLandingScreen';

export const Route = createFileRoute('/welcome')({
  component: WelcomeLandingScreen,
});
