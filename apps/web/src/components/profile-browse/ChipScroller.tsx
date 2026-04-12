import type { ReactNode } from 'react';

interface ChipScrollerProps {
  children: ReactNode;
  className?: string;
}

export function ChipScroller({ children, className = '' }: ChipScrollerProps) {
  return (
    <ul
      className={`flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide list-none m-0 p-0 ${className}`}
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {children}
    </ul>
  );
}
