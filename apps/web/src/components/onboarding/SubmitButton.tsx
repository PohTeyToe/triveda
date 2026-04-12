/**
 * Shared submit button with spinner state.
 *
 * Primary variant: full-width teal (Quick Start).
 * Secondary variant: auto-width outlined (Daily Profiling).
 */

import { Spinner } from './Spinner';

interface SubmitButtonProps {
  text: string;
  isPending: boolean;
  isDisabled: boolean;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function SubmitButton({
  text,
  isPending,
  isDisabled,
  onClick,
  variant = 'primary',
}: SubmitButtonProps) {
  const base =
    'font-body font-medium rounded-xl transition-all duration-150 focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center';

  const variants = {
    primary: 'w-full py-3 px-6 text-base bg-teal text-dark dark:text-dark hover:bg-teal-soft',
    secondary: 'py-2 px-5 text-sm border border-teal text-teal hover:bg-teal/10',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled || isPending}
      className={`${base} ${variants[variant]}`}
    >
      {isPending ? <Spinner size={variant === 'primary' ? 'md' : 'sm'} /> : text}
    </button>
  );
}
