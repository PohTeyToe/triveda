import { createFileRoute } from '@tanstack/react-router';
import { LoginScreen } from '../components/auth/LoginScreen';

export const Route = createFileRoute('/signup')({
  component: SignupPage,
});

function SignupPage() {
  return <LoginScreen mode="signup" />;
}
