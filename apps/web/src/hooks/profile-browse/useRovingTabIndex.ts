import { type RefObject, useCallback, useRef, useState } from 'react';

interface UseRovingTabIndexOptions {
  itemCount: number;
  containerRef: RefObject<HTMLElement | null>;
  onActivate?: (index: number) => void;
}

/**
 * Manages keyboard focus across a list of items using the roving tabindex pattern.
 */
export function useRovingTabIndex({
  itemCount,
  containerRef: _containerRef,
  onActivate,
}: UseRovingTabIndexOptions) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map());

  const focusItem = useCallback((index: number) => {
    setFocusedIndex(index);
    const el = itemRefs.current.get(index);
    if (el) {
      el.focus();
    }
  }, []);

  const getItemProps = useCallback(
    (index: number) => ({
      tabIndex: index === focusedIndex ? 0 : -1,
      onKeyDown: (e: React.KeyboardEvent) => {
        switch (e.key) {
          case 'ArrowDown': {
            e.preventDefault();
            const next = (index + 1) % itemCount;
            focusItem(next);
            break;
          }
          case 'ArrowUp': {
            e.preventDefault();
            const prev = (index - 1 + itemCount) % itemCount;
            focusItem(prev);
            break;
          }
          case 'Home': {
            e.preventDefault();
            focusItem(0);
            break;
          }
          case 'End': {
            e.preventDefault();
            focusItem(itemCount - 1);
            break;
          }
          case 'Enter':
          case ' ': {
            e.preventDefault();
            onActivate?.(index);
            break;
          }
        }
      },
      onFocus: () => setFocusedIndex(index),
      ref: (el: HTMLElement | null) => {
        if (el) {
          itemRefs.current.set(index, el);
        } else {
          itemRefs.current.delete(index);
        }
      },
    }),
    [focusedIndex, itemCount, focusItem, onActivate],
  );

  return { focusedIndex, getItemProps };
}
