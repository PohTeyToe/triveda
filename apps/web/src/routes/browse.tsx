import { createFileRoute, useSearch } from '@tanstack/react-router';
import { Toaster } from 'sonner';
import { BrowseScreen } from '../components/profile-browse/BrowseScreen';
import { FoodDetailScreen } from '../components/profile-browse/FoodDetailScreen';
import { HerbDetailScreen } from '../components/profile-browse/HerbDetailScreen';

interface BrowseSearch {
  tab: string;
  food: string;
  herb: string;
}

export const Route = createFileRoute('/browse')({
  component: BrowsePage,
  validateSearch: (search: Record<string, unknown>): BrowseSearch => ({
    tab: (search.tab as string) ?? 'foods',
    food: (search.food as string) ?? '',
    herb: (search.herb as string) ?? '',
  }),
});

function BrowsePage() {
  const search = useSearch({ from: '/browse' });

  // Detail view: food
  if (search.food) {
    return <FoodDetailScreen foodId={search.food} />;
  }

  // Detail view: herb
  if (search.herb) {
    return <HerbDetailScreen herbId={search.herb} />;
  }

  // Browse list
  return (
    <>
      <BrowseScreen />
      <Toaster position="bottom-center" />
    </>
  );
}
