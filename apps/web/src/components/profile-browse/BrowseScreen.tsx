import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useCallback, useState } from 'react';
import {
  prefetchFoodDetail,
  prefetchHerbDetail,
  useFoodsBrowse,
  useHerbsBrowse,
} from '../../hooks/profile-browse';
import type { BrowseFood, BrowseHerb } from '../../lib/types';
import { type BrowseFilters, FilterSheet } from './FilterSheet';
import { FoodCard } from './FoodCard';
import { HerbCard } from './HerbCard';
import { ListShell } from './ListShell';
import { TabShell } from './TabShell';

// ---- Category Constants ----

const FOOD_CATEGORIES = [
  { value: 'grains', label: 'Grains' },
  { value: 'vegetables', label: 'Vegetables' },
  { value: 'fruits', label: 'Fruits' },
  { value: 'legumes', label: 'Legumes' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'nuts-seeds', label: 'Nuts & Seeds' },
  { value: 'spices', label: 'Spices' },
  { value: 'oils-fats', label: 'Oils & Fats' },
  { value: 'beverages', label: 'Beverages' },
  { value: 'sweeteners', label: 'Sweeteners' },
  { value: 'animal-protein', label: 'Animal Protein' },
  { value: 'condiments', label: 'Condiments' },
];

const HERB_CATEGORIES = [
  { value: 'adaptogen', label: 'Adaptogen' },
  { value: 'nervine', label: 'Nervine' },
  { value: 'digestive', label: 'Digestive' },
  { value: 'hepatic', label: 'Hepatic' },
  { value: 'diuretic', label: 'Diuretic' },
  { value: 'anti-inflammatory', label: 'Anti-inflammatory' },
  { value: 'immunomodulator', label: 'Immunomodulator' },
  { value: 'circulatory', label: 'Circulatory' },
  { value: 'respiratory', label: 'Respiratory' },
  { value: 'reproductive', label: 'Reproductive' },
  { value: 'alterative', label: 'Alterative' },
  { value: 'demulcent', label: 'Demulcent' },
];

const TABS = [
  { id: 'foods', label: 'Foods' },
  { id: 'herbs', label: 'Herbs' },
];

// ---- Default filter state ----

const DEFAULT_FILTERS: BrowseFilters = {
  category: null,
  season: null,
  search: '',
};

// ---- Foods Tab Content ----

function FoodsTab({ filters }: { filters: BrowseFilters }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { allItems, hasNextPage, isFetchingNextPage, fetchNextPage } = useFoodsBrowse({
    category: filters.category,
    season: filters.season,
    search: filters.search || undefined,
  });

  const handleNavigate = useCallback(
    (foodId: string) => {
      navigate({ to: '/browse', search: { tab: 'foods', food: foodId, herb: '' } });
    },
    [navigate],
  );

  const handlePrefetch = useCallback(
    (foodId: string) => {
      prefetchFoodDetail(queryClient, foodId);
    },
    [queryClient],
  );

  return (
    <ListShell<BrowseFood>
      items={allItems}
      hasNextPage={hasNextPage ?? false}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      resultCount={allItems.length}
      resultLabel="foods"
      renderItem={(food) => (
        <FoodCard
          key={food.id}
          food={food}
          onNavigate={handleNavigate}
          onPrefetch={handlePrefetch}
        />
      )}
      emptyState={
        <div className="text-center py-12 text-light/40">
          <p>No foods in this category.</p>
        </div>
      }
    />
  );
}

// ---- Herbs Tab Content ----

function HerbsTab({ filters }: { filters: BrowseFilters }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { allItems, hasNextPage, isFetchingNextPage, fetchNextPage } = useHerbsBrowse({
    category: filters.category,
    search: filters.search || undefined,
  });

  const handleNavigate = useCallback(
    (herbId: string) => {
      navigate({ to: '/browse', search: { tab: 'herbs', food: '', herb: herbId } });
    },
    [navigate],
  );

  const handlePrefetch = useCallback(
    (herbId: string) => {
      prefetchHerbDetail(queryClient, herbId);
    },
    [queryClient],
  );

  return (
    <ListShell<BrowseHerb>
      items={allItems}
      hasNextPage={hasNextPage ?? false}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      resultCount={allItems.length}
      resultLabel="herbs"
      renderItem={(herb) => (
        <HerbCard
          key={herb.id}
          herb={herb}
          onNavigate={handleNavigate}
          onPrefetch={handlePrefetch}
        />
      )}
      emptyState={
        <div className="text-center py-12 text-light/40">
          <p>No herbs in this category.</p>
        </div>
      }
    />
  );
}

// ---- Main BrowseScreen ----

export function BrowseScreen() {
  // Read tab from URL search params (default to "foods")
  const search = useSearch({ strict: false }) as Record<string, string>;
  const navigate = useNavigate();
  const activeTab = search?.tab === 'herbs' ? 'herbs' : 'foods';

  const [foodFilters, setFoodFilters] = useState<BrowseFilters>({ ...DEFAULT_FILTERS });
  const [herbFilters, setHerbFilters] = useState<BrowseFilters>({ ...DEFAULT_FILTERS });

  const currentFilters = activeTab === 'foods' ? foodFilters : herbFilters;
  const currentCategories = activeTab === 'foods' ? FOOD_CATEGORIES : HERB_CATEGORIES;

  const handleTabChange = useCallback(
    (tabId: string) => {
      navigate({ to: '/browse', search: { tab: tabId, food: '', herb: '' } });
    },
    [navigate],
  );

  const handleFiltersChange = useCallback(
    (partial: Partial<BrowseFilters>) => {
      if (activeTab === 'foods') {
        setFoodFilters((prev) => ({ ...prev, ...partial }));
      } else {
        setHerbFilters((prev) => ({ ...prev, ...partial }));
      }
    },
    [activeTab],
  );

  return (
    <div className="py-6">
      <h1 className="font-heading text-2xl font-bold text-teal mb-4">Browse</h1>

      {/* Filter bar (mobile) or sidebar layout */}
      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <FilterSheet
            tab={activeTab}
            filters={currentFilters}
            onFiltersChange={handleFiltersChange}
            categories={currentCategories}
            resultCount={0}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Mobile filter button */}
          <div className="lg:hidden mb-4">
            <FilterSheet
              tab={activeTab}
              filters={currentFilters}
              onFiltersChange={handleFiltersChange}
              categories={currentCategories}
              resultCount={0}
            />
          </div>

          <TabShell tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange}>
            {activeTab === 'foods' ? (
              <FoodsTab filters={foodFilters} />
            ) : (
              <HerbsTab filters={herbFilters} />
            )}
          </TabShell>
        </div>
      </div>
    </div>
  );
}
