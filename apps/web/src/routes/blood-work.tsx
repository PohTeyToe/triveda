import { createFileRoute, useSearch } from '@tanstack/react-router';
import { BloodWorkHistoryScreen } from '../components/blood-work/BloodWorkHistoryScreen';
import { BloodWorkResultsScreen } from '../components/blood-work/BloodWorkResultsScreen';
import { BloodWorkUploadScreen } from '../components/blood-work/BloodWorkUploadScreen';

interface BloodWorkSearch {
  view: string;
  report: string;
}

export const Route = createFileRoute('/blood-work')({
  component: BloodWorkPage,
  validateSearch: (search: Record<string, unknown>): BloodWorkSearch => ({
    view: (search.view as string) ?? '',
    report: (search.report as string) ?? '',
  }),
});

function BloodWorkPage() {
  const search = useSearch({ from: '/blood-work' });

  // Results view: /blood-work?report=<reportId>
  if (search.report) {
    return <BloodWorkResultsScreen reportId={search.report} />;
  }

  // Upload view: /blood-work?view=upload
  if (search.view === 'upload') {
    return <BloodWorkUploadScreen />;
  }

  // Default: history/landing
  return <BloodWorkHistoryScreen />;
}
