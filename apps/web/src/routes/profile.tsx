import { createFileRoute } from '@tanstack/react-router';
import { ProfileSettingsScreen } from '../components/profile-browse/ProfileSettingsScreen';

export const Route = createFileRoute('/profile')({
  component: ProfilePage,
});

function ProfilePage() {
  return <ProfileSettingsScreen />;
}
