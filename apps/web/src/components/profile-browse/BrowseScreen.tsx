import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Search, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  prefetchFoodDetail,
  prefetchHerbDetail,
  useFoodsBrowse,
  useHerbsBrowse,
} from '../../hooks/profile-browse';
import { useLlmExtendFood } from '../../hooks/useLlmExtendFood';
import { staggerContainer } from '../../lib/animations';
import type { BrowseFood, BrowseHerb } from '../../lib/types';
import { type BrowseFilters, FilterSheet } from './FilterSheet';
import { FoodCard } from './FoodCard';
import { HerbCard } from './HerbCard';
import { ListShell } from './ListShell';
import { LlmExtendPanel } from './LlmExtendPanel';
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

// ---- Inline search chip with debounce ----

function SearchChip({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [local, setLocal] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const handleChange = (v: string) => {
    setLocal(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onChange(v), 300);
  };

  return (
    <div className="relative shrink-0">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30 pointer-events-none" />
      <input
        type="search"
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-h-[44px] w-40 pl-9 pr-4 py-2 rounded-full bg-dark-elevated ghost-border text-sm font-body text-cream placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-teal"
      />
    </div>
  );
}

// ---- Filter chip row ----

function FilterChipRow({
  categories,
  activeCategory,
  onCategoryChange,
  search,
  onSearchChange,
  tab,
}: {
  categories: { value: string; label: string }[];
  activeCategory: string | null;
  onCategoryChange: (value: string | null) => void;
  search: string;
  onSearchChange: (value: string) => void;
  tab: string;
}) {
  return (
    <div className="overflow-x-auto scrollbar-hide mb-4">
      <div className="flex gap-2 pb-1">
        <SearchChip value={search} onChange={onSearchChange} placeholder={`Search ${tab}...`} />

        <button
          type="button"
          onClick={() => onCategoryChange(null)}
          className={`rounded-full px-4 py-2 text-sm font-body whitespace-nowrap transition-colors min-h-[44px] flex items-center ${
            activeCategory === null
              ? 'bg-teal text-dark font-medium'
              : 'bg-dark-elevated text-cream/60 hover:bg-dark-surface-high'
          }`}
        >
          All
        </button>

        {categories.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => onCategoryChange(activeCategory === cat.value ? null : cat.value)}
            className={`rounded-full px-4 py-2 text-sm font-body whitespace-nowrap transition-colors min-h-[44px] flex items-center ${
              activeCategory === cat.value
                ? 'bg-teal text-dark font-medium'
                : 'bg-dark-elevated text-cream/60 hover:bg-dark-surface-high'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---- Foods Tab Content ----

interface FoodsTabProps {
  filters: BrowseFilters;
  onGenerateFood: (query: string) => void;
}

function FoodsTab({ filters, onGenerateFood }: FoodsTabProps) {
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

  const hasActiveSearch = !!filters.search?.trim();

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
        hasActiveSearch ? (
          <div className="text-center py-12" data-testid="foods-zero-result">
            <p className="font-body text-cream/70 mb-1">
              No foods found for &ldquo;{filters.search}&rdquo;
            </p>
            <p className="text-sm text-cream/40 mb-4">Want Triveda to learn about this food?</p>
            <button
              type="button"
              onClick={() => filters.search && onGenerateFood(filters.search)}
              className="inline-flex items-center gap-2 rounded-full border border-teal text-teal px-5 py-2.5 text-sm font-body font-medium hover:bg-teal/10 transition-colors min-h-[44px]"
              data-testid="generate-food-button"
            >
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              Generate entry via AI
            </button>
          </div>
        ) : (
          <div className="text-center py-12 text-cream/40">
            <p className="font-body">No foods in this category.</p>
          </div>
        )
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
        <div className="text-center py-12 text-cream/40">
          <p className="font-body">No herbs in this category.</p>
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

  // ---- LLM extend panel state ----
  const llm = useLlmExtendFood();
  const [llmPanelOpen, setLlmPanelOpen] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());

  const handleGenerateFood = useCallback(
    (query: string) => {
      llm.trigger(query);
      setLlmPanelOpen(true);
    },
    [llm],
  );

  const handleClosePanel = useCallback(() => {
    setLlmPanelOpen(false);
    // Reset on close so a future trigger starts fresh
    llm.reset();
  }, [llm]);

  const handleSaveGenerated = useCallback(() => {
    if (!llm.generatedFood) return;
    const id = llm.generatedFood.id;
    if (savedIds.has(id)) return;
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    toast.success('Saved to your browse history.');
  }, [llm.generatedFood, savedIds]);

  const handleNavigateToMatch = useCallback(
    (foodId: string) => {
      setLlmPanelOpen(false);
      llm.reset();
      navigate({ to: '/browse', search: { tab: 'foods', food: foodId, herb: '' } });
    },
    [llm, navigate],
  );

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
    <motion.div className="py-6" variants={staggerContainer} initial="hidden" animate="visible">
      {/* Header */}
      <h1 className="font-heading text-2xl font-bold text-teal tracking-tight mb-4">Browse</h1>

      {/* Filter chips row */}
      <FilterChipRow
        categories={currentCategories}
        activeCategory={currentFilters.category}
        onCategoryChange={(value) => handleFiltersChange({ category: value })}
        search={currentFilters.search}
        onSearchChange={(value) => handleFiltersChange({ search: value })}
        tab={activeTab}
      />

      {/* Desktop sidebar + main content */}
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
              <FoodsTab filters={foodFilters} onGenerateFood={handleGenerateFood} />
            ) : (
              <HerbsTab filters={herbFilters} />
            )}
          </TabShell>
        </div>
      </div>

      {/* LLM-on-demand extend panel */}
      <LlmExtendPanel
        isOpen={llmPanelOpen}
        onClose={handleClosePanel}
        status={llm.status}
        progress={llm.progress}
        generatedFood={llm.generatedFood}
        error={llm.error}
        query={llm.query}
        onRetry={llm.retry}
        onSave={handleSaveGenerated}
        onNavigateToMatch={handleNavigateToMatch}
        isSaved={llm.generatedFood ? savedIds.has(llm.generatedFood.id) : false}
      />
    </motion.div>
  );
}
