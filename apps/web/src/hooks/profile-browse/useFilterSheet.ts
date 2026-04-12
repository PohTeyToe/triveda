import { useCallback, useEffect, useState } from 'react';

/**
 * Manages responsive breakpoint detection and sheet open/close state
 * for the FilterSheet component.
 */
export function useFilterSheet() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(mql.matches);

    const handler = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
    };

    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const onOpen = useCallback(() => {
    if (!isDesktop) setIsOpen(true);
  }, [isDesktop]);

  const onClose = useCallback(() => {
    if (!isDesktop) setIsOpen(false);
  }, [isDesktop]);

  return {
    isDesktop,
    isOpen: isDesktop ? true : isOpen,
    onOpen,
    onClose,
  };
}
