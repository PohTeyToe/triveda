import type { ReactNode } from 'react';

interface GridDashboardProps {
  children: ReactNode;
  className?: string;
}

export function GridDashboard({ children, className = '' }: GridDashboardProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ${className}`}>
      {children}
    </div>
  );
}
