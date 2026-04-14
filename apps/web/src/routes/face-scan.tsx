import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '../contexts/AuthContext';
import { FaceScanScreen } from '../features/face-scan/FaceScanScreen';

export const Route = createFileRoute('/face-scan')({
  component: FaceScanPage,
});

function FaceScanPage() {
  const { user } = useAuth();
  return <FaceScanScreen userId={user?.id ?? 'demo-user-id'} />;
}
