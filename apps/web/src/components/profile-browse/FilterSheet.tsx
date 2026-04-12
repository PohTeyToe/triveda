import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Drawer } from 'vaul';
import { useFilterSheet } from '../../hooks/profile-browse';
import { ChipSelect } from './ChipSelect';

// ---- Season options (Ritu) ----

const SEASON_OPTIONS = [
  { value: 'shishira', label: 'Late Winter (Shishira)' },
  { value: 'vasanta', label: 'Spring (Vasanta)' },
  { value: 'grishma', label: 'Summer (Grishma)' },
  { value: 'varsha', label: 'Monsoon (Varsha)' },
  { value: 'sharad', label: 'Autumn (Sharad)' },
  { value: 'hemanta', label: 'Early Winter (Hemanta)' },
];

// ---- Types ----

export interface BrowseFilters {
  category: string | null;
  season: string | null;
  search: string;
}

interface FilterSheetProps {
  tab: 'foods' | 'herbs';
  filters: BrowseFilters;
  onFiltersChange: (partial: Partial<BrowseFilters>) => void;
  categories: { value: string; label: string }[];
  resultCount: number;
}

// ---- Filter Content (shared between mobile and desktop) ----

function FilterContent({
  tab,
  filters,
  onFiltersChange,
  categories,
}: Omit<FilterSheetProps, 'resultCount'>) {
  const [localSearch, setLocalSearch] = useState(filters.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local search with external changes
  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onFiltersChange({ search: value });
    }, 300);
  };

  const activeCount = [filters.category, filters.season, filters.search].filter(Boolean).length;

  const clearAll = () => {
    setLocalSearch('');
    onFiltersChange({ category: null, season: null, search: '' });
  };

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-light/30" />
        <input
          type="search"
          value={localSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={`Search ${tab}...`}
          aria-label={`Search ${tab}`}
          className="w-full min-h-11 pl-10 pr-4 py-2 rounded-xl bg-dark-surface border border-dark-border text-sm text-light placeholder:text-light/30 focus:outline-none focus:ring-2 focus:ring-teal"
        />
      </div>

      {/* Category */}
      <div>
        <p className="text-xs text-light/40 mb-2 font-medium uppercase tracking-wide">Category</p>
        <ChipSelect
          options={categories}
          value={filters.category}
          onChange={(value) => onFiltersChange({ category: value })}
          label="Category"
        />
      </div>

      {/* Season (foods only) */}
      {tab === 'foods' && (
        <div>
          <p className="text-xs text-light/40 mb-2 font-medium uppercase tracking-wide">Season</p>
          <ChipSelect
            options={SEASON_OPTIONS}
            value={filters.season}
            onChange={(value) => onFiltersChange({ season: value })}
            label="Season"
          />
        </div>
      )}

      {/* Clear all */}
      {activeCount > 0 && (
        <button
          type="button"
          onClick={clearAll}
          aria-label="Clear all filters"
          className="text-sm text-teal hover:text-teal-soft transition-colors"
        >
          Clear all ({activeCount})
        </button>
      )}
    </div>
  );
}

// ---- Main Component ----

export function FilterSheet(props: FilterSheetProps) {
  const { isDesktop, isOpen, onOpen, onClose } = useFilterSheet();

  const activeCount = [props.filters.category, props.filters.season, props.filters.search].filter(
    Boolean,
  ).length;

  // Desktop: static sidebar
  if (isDesktop) {
    return (
      <aside className="w-[280px] shrink-0 sticky top-14 self-start">
        <FilterContent
          tab={props.tab}
          filters={props.filters}
          onFiltersChange={props.onFiltersChange}
          categories={props.categories}
        />
      </aside>
    );
  }

  // Mobile: Vaul bottom sheet
  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        aria-expanded={isOpen}
        aria-controls="filter-sheet"
        className="flex items-center gap-2 min-h-11 px-4 py-2 rounded-xl bg-dark-surface border border-dark-border text-sm text-light/70 hover:bg-dark-border transition-colors focus:outline-none focus:ring-2 focus:ring-teal"
      >
        <SlidersHorizontal className="w-4 h-4" />
        Filters
        {activeCount > 0 && (
          <span className="bg-teal text-dark text-xs font-medium px-1.5 py-0.5 rounded-full">
            {activeCount}
          </span>
        )}
      </button>

      <Drawer.Root
        open={isOpen}
        onOpenChange={(open) => (open ? onOpen() : onClose())}
        snapPoints={[0.5, 1]}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-dark/50 z-[90]" />
          <Drawer.Content
            id="filter-sheet"
            className="fixed bottom-0 left-0 right-0 z-[91] bg-dark-elevated rounded-t-2xl border-t border-dark-border"
          >
            <div className="mx-auto w-12 h-1.5 rounded-full bg-dark-border mt-3 mb-4" />
            <div className="px-4 pb-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg font-bold">Filters</h2>
                <Drawer.Close asChild>
                  <button
                    type="button"
                    aria-label="Close filters"
                    className="p-2 rounded-lg text-light/40 hover:text-light hover:bg-dark-border transition-colors focus:outline-none focus:ring-2 focus:ring-teal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </Drawer.Close>
              </div>
              <FilterContent
                tab={props.tab}
                filters={props.filters}
                onFiltersChange={props.onFiltersChange}
                categories={props.categories}
              />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
