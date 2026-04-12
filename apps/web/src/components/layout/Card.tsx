import type { ReactNode } from 'react';

type CardVariant = 'default' | 'elevated' | 'outlined';

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  className?: string;
}

const variantClasses: Record<CardVariant, string> = {
  default:
    'bg-white dark:bg-dark-surface border border-dark-border/30 dark:border-dark-border rounded-xl',
  elevated:
    'bg-white dark:bg-dark-elevated border border-dark-border/30 dark:border-dark-border rounded-xl shadow-sm',
  outlined: 'bg-transparent border border-dark-border/50 dark:border-dark-border rounded-xl',
};

export function Card({ children, variant = 'default', className = '' }: CardProps) {
  return <div className={`p-3 ${variantClasses[variant]} ${className}`}>{children}</div>;
}
