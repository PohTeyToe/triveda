import type { ReactNode } from 'react';

type CardVariant = 'default' | 'elevated' | 'highest';

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  className?: string;
}

/**
 * Tonal card -- uses background-shift layering only.
 * No 1px borders per design system "no-line rule."
 */
const variantClasses: Record<CardVariant, string> = {
  default: 'bg-light-muted dark:bg-dark-elevated rounded-2xl',
  elevated: 'bg-light-surface dark:bg-dark-surface-high rounded-2xl ambient-shadow',
  highest: 'bg-light-surface-high dark:bg-dark-surface-highest rounded-2xl ambient-shadow',
};

export function Card({ children, variant = 'default', className = '' }: CardProps) {
  return <div className={`p-4 ${variantClasses[variant]} ${className}`}>{children}</div>;
}
