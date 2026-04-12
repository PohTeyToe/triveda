import { useVirtualizer } from '@tanstack/react-virtual';
import { type ReactNode, useCallback, useEffect, useRef } from 'react';

interface ListShellProps<T> {
  items: T[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  renderItem: (item: T, index: number) => ReactNode;
  emptyState?: ReactNode;
  resultCount: number;
  resultLabel: string;
}

export function ListShell<T>({
  items,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  renderItem,
  emptyState,
  resultCount,
  resultLabel,
}: ListShellProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const lastFetchRef = useRef(0);

  const count = items.length + (hasNextPage ? 1 : 0);

  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });

  // Infinite scroll via IntersectionObserver on the sentinel
  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      if (!entry?.isIntersecting) return;

      const now = Date.now();
      if (now - lastFetchRef.current < 200) return;
      lastFetchRef.current = now;

      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: '200px',
    });
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [handleIntersection]);

  // Empty state
  if (items.length === 0 && !isFetchingNextPage && !hasNextPage) {
    return (
      <div>
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          No {resultLabel} found
        </div>
        {emptyState ?? (
          <div className="text-center py-12 text-light/40">
            <p>No results found.</p>
          </div>
        )}
      </div>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div>
      {/* ARIA live region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Showing {resultCount} {resultLabel}
      </div>

      {/* Scrollable list container */}
      <div ref={parentRef} role="list" className="h-[70vh] overflow-y-auto">
        <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
          {virtualItems.map((virtualItem) => {
            const isLoaderRow = virtualItem.index >= items.length;

            return (
              <div
                key={virtualItem.key}
                role="listitem"
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 left-0 w-full"
                style={{
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                {isLoaderRow ? (
                  <div ref={sentinelRef} className="py-4 space-y-2">
                    {isFetchingNextPage &&
                      Array.from({ length: 3 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-16 bg-dark-surface border border-dark-border rounded-xl animate-pulse"
                        />
                      ))}
                  </div>
                ) : (
                  (() => {
                    const item = items[virtualItem.index];
                    return item !== undefined ? renderItem(item, virtualItem.index) : null;
                  })()
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sentinel for when items list has no extra loader row */}
      {!hasNextPage && items.length > 0 && (
        <div className="text-center py-4 text-light/30 text-sm">All {resultLabel} loaded</div>
      )}
    </div>
  );
}
