import { useCallback, useRef } from 'react';

interface ChipSelectProps {
  options: { value: string; label: string }[];
  value: string | null;
  onChange: (value: string | null) => void;
  label: string;
}

export function ChipSelect({ options, value, onChange, label }: ChipSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      const container = containerRef.current;
      if (!container) return;
      const buttons = container.querySelectorAll<HTMLButtonElement>('[role="radio"]');

      let nextIndex: number | null = null;
      if (e.key === 'ArrowRight') {
        nextIndex = (index + 1) % options.length;
      } else if (e.key === 'ArrowLeft') {
        nextIndex = (index - 1 + options.length) % options.length;
      }

      if (nextIndex !== null) {
        e.preventDefault();
        buttons[nextIndex]?.focus();
      }
    },
    [options.length],
  );

  return (
    <div ref={containerRef} role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option, index) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected || (value === null && index === 0) ? 0 : -1}
            onClick={() => onChange(isSelected ? null : option.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`min-h-11 px-4 py-2 rounded-full text-sm font-body transition-colors focus:outline-none focus:ring-2 focus:ring-teal ${
              isSelected
                ? 'bg-teal text-dark font-medium'
                : 'bg-dark-surface text-white/60 dark:bg-dark-surface dark:text-white/60 hover:bg-dark-border'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
