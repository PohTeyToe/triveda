import { Plus, X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

interface ChipMultiSelectProps {
  options: { value: string; label: string }[];
  values: string[];
  onChange: (values: string[]) => void;
  label: string;
  allowCustom?: boolean;
  customPlaceholder?: string;
}

export function ChipMultiSelect({
  options,
  values,
  onChange,
  label,
  allowCustom = false,
  customPlaceholder = 'Add other',
}: ChipMultiSelectProps) {
  const [showInput, setShowInput] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const predefinedValues = options.map((o) => o.value);

  const toggleChip = useCallback(
    (chipValue: string) => {
      if (values.includes(chipValue)) {
        onChange(values.filter((v) => v !== chipValue));
      } else {
        onChange([...values, chipValue]);
      }
    },
    [values, onChange],
  );

  const addCustom = useCallback(() => {
    const trimmed = customValue.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setCustomValue('');
    setShowInput(false);
  }, [customValue, values, onChange]);

  const removeCustom = useCallback(
    (chipValue: string) => {
      onChange(values.filter((v) => v !== chipValue));
    },
    [values, onChange],
  );

  const customChips = values.filter((v) => !predefinedValues.includes(v));

  return (
    <fieldset aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = values.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => toggleChip(option.value)}
            className={`min-h-11 px-4 py-2 rounded-full text-sm font-body transition-colors focus:outline-none focus:ring-2 focus:ring-teal ${
              isSelected
                ? 'bg-teal/15 text-teal font-medium'
                : 'bg-dark-surface-high text-cream/50 hover:bg-dark-surface-high/80'
            }`}
          >
            {option.label}
          </button>
        );
      })}

      {customChips.map((chip) => (
        <span
          key={chip}
          className="min-h-11 px-4 py-2 rounded-full text-sm font-body bg-teal/15 text-teal font-medium inline-flex items-center gap-1"
        >
          {chip}
          <button
            type="button"
            onClick={() => removeCustom(chip)}
            aria-label={`Remove ${chip}`}
            className="ml-1 rounded-full p-0.5 hover:bg-teal/20 focus:outline-none focus:ring-2 focus:ring-teal"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}

      {allowCustom && !showInput && (
        <button
          type="button"
          onClick={() => {
            setShowInput(true);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          aria-label={customPlaceholder}
          className="min-h-11 px-4 py-2 rounded-full text-sm font-body bg-dark-surface-high text-cream/50 hover:bg-dark-surface-high/80 transition-colors focus:outline-none focus:ring-2 focus:ring-teal inline-flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      )}

      {allowCustom && showInput && (
        <input
          ref={inputRef}
          type="text"
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addCustom();
            }
            if (e.key === 'Escape') {
              setCustomValue('');
              setShowInput(false);
            }
          }}
          onBlur={addCustom}
          placeholder={customPlaceholder}
          className="min-h-11 px-4 py-2 rounded-full text-sm font-body bg-dark-surface-high text-cream focus:outline-none focus:ring-2 focus:ring-teal"
        />
      )}
    </fieldset>
  );
}
