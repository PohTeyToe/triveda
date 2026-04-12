/**
 * QuickStartQuestion -- renders a single question with answer options.
 *
 * Presentational component: receives React Hook Form register from parent.
 * Used by both QuickStartScreen (3 instances) and DailyProfilingQuestion (1 instance).
 *
 * Supports single_choice (radio cards), multi_choice (checkbox cards),
 * and scale (segmented buttons).
 */

import { useId } from 'react';
import type { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import type { Question } from '../../lib/query-options';

interface QuickStartQuestionProps {
  question: Question;
  fieldName: string;
  // biome-ignore lint/suspicious/noExplicitAny: reusable form component
  register: UseFormRegister<any>;
  // biome-ignore lint/suspicious/noExplicitAny: reusable form component
  setValue?: UseFormSetValue<any>;
  selectedValue?: string | string[] | number;
  error?: string;
  /** Called when any option is selected, before RHF onChange fires */
  onValueChange?: (value: string) => void;
}

export function QuickStartQuestion({
  question,
  fieldName,
  register,
  setValue,
  selectedValue,
  error,
  onValueChange,
}: QuickStartQuestionProps) {
  const baseId = useId();
  const questionTextId = `${baseId}-question`;
  const descriptionId = `${baseId}-desc`;
  const errorId = `${baseId}-error`;

  if (question.type === 'scale') {
    return (
      <ScaleQuestion
        question={question}
        fieldName={fieldName}
        setValue={setValue}
        selectedValue={selectedValue as number | undefined}
        error={error}
        questionTextId={questionTextId}
        descriptionId={descriptionId}
        errorId={errorId}
      />
    );
  }

  if (question.type === 'multi_choice') {
    return (
      <MultiChoiceQuestion
        question={question}
        fieldName={fieldName}
        register={register}
        selectedValue={selectedValue as string[] | undefined}
        error={error}
        questionTextId={questionTextId}
        descriptionId={descriptionId}
        errorId={errorId}
        onValueChange={onValueChange}
      />
    );
  }

  // Default: single_choice
  return (
    <SingleChoiceQuestion
      question={question}
      fieldName={fieldName}
      register={register}
      selectedValue={selectedValue as string | undefined}
      error={error}
      questionTextId={questionTextId}
      descriptionId={descriptionId}
      errorId={errorId}
      onValueChange={onValueChange}
    />
  );
}

// ---------------------------------------------------------------------------
// Single Choice (Radio Cards)
// ---------------------------------------------------------------------------

function SingleChoiceQuestion({
  question,
  fieldName,
  register,
  selectedValue,
  error,
  questionTextId,
  descriptionId,
  errorId,
  onValueChange,
}: {
  question: Question;
  fieldName: string;
  // biome-ignore lint/suspicious/noExplicitAny: reusable form component
  register: UseFormRegister<any>;
  selectedValue?: string;
  error?: string;
  questionTextId: string;
  descriptionId: string;
  errorId: string;
  onValueChange?: (value: string) => void;
}) {
  const registration = register(fieldName);

  return (
    <div className="space-y-2">
      <h3
        id={questionTextId}
        className="font-heading text-lg font-semibold text-dark dark:text-light"
      >
        {question.text}
      </h3>

      {question.description && (
        <p id={descriptionId} className="font-body text-sm text-gray-400 dark:text-gray-400">
          {question.description}
        </p>
      )}

      <div
        role="radiogroup"
        aria-labelledby={questionTextId}
        aria-describedby={
          [question.description ? descriptionId : '', error ? errorId : '']
            .filter(Boolean)
            .join(' ') || undefined
        }
        className="flex flex-col gap-2"
      >
        {question.options.map((option) => {
          const isSelected = selectedValue === option.value;
          return (
            <label
              key={option.value}
              className={`
                relative flex items-center min-h-[44px] py-3 px-4 rounded-xl
                cursor-pointer select-none touch-manipulation
                transition-all duration-150
                ${
                  isSelected
                    ? 'ring-2 ring-teal bg-teal/5 dark:bg-dark-elevated'
                    : 'bg-white dark:bg-dark-surface border border-dark-border/30 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-elevated/50'
                }
              `}
            >
              <input
                type="radio"
                value={option.value}
                {...registration}
                onChange={(e) => {
                  onValueChange?.(option.value);
                  registration.onChange(e);
                }}
                className="sr-only"
                aria-checked={isSelected}
              />
              <span className="font-body text-sm text-dark dark:text-light">{option.label}</span>
              <span
                className={`
                  absolute right-4 w-4 h-4 rounded-full border-2 transition-colors
                  ${isSelected ? 'border-teal bg-teal' : 'border-gray-400 dark:border-gray-600'}
                `}
              >
                {isSelected && <span className="absolute inset-0.5 rounded-full bg-white" />}
              </span>
            </label>
          );
        })}
      </div>

      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-400 dark:text-red-400 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Multi Choice (Checkbox Cards)
// ---------------------------------------------------------------------------

function MultiChoiceQuestion({
  question,
  fieldName,
  register,
  selectedValue,
  error,
  questionTextId,
  descriptionId,
  errorId,
  onValueChange,
}: {
  question: Question;
  fieldName: string;
  // biome-ignore lint/suspicious/noExplicitAny: reusable form component
  register: UseFormRegister<any>;
  selectedValue?: string[];
  error?: string;
  questionTextId: string;
  descriptionId: string;
  errorId: string;
  onValueChange?: (value: string) => void;
}) {
  const selected = new Set(selectedValue ?? []);
  const registration = register(fieldName);

  return (
    <div className="space-y-2">
      <fieldset>
        <legend
          id={questionTextId}
          className="font-heading text-lg font-semibold text-dark dark:text-light"
        >
          {question.text}
        </legend>

        {question.description && (
          <p id={descriptionId} className="font-body text-sm text-gray-400 dark:text-gray-400">
            {question.description}
          </p>
        )}

        <div className="flex flex-col gap-2 mt-2" aria-describedby={error ? errorId : undefined}>
          {question.options.map((option) => {
            const isSelected = selected.has(option.value);
            return (
              <label
                key={option.value}
                className={`
                  relative flex items-center min-h-[44px] py-3 px-4 rounded-xl
                  cursor-pointer select-none touch-manipulation
                  transition-all duration-150
                  ${
                    isSelected
                      ? 'ring-2 ring-teal bg-teal/5 dark:bg-dark-elevated'
                      : 'bg-white dark:bg-dark-surface border border-dark-border/30 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-elevated/50'
                  }
                `}
              >
                <input
                  type="checkbox"
                  value={option.value}
                  {...registration}
                  onChange={(e) => {
                    onValueChange?.(option.value);
                    registration.onChange(e);
                  }}
                  className="sr-only"
                  aria-checked={isSelected}
                />
                <span
                  className={`
                    mr-3 w-4 h-4 rounded border-2 flex items-center justify-center
                    transition-colors
                    ${isSelected ? 'border-teal bg-teal' : 'border-gray-400 dark:border-gray-600'}
                  `}
                >
                  {isSelected && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <title>Selected</title>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </span>
                <span className="font-body text-sm text-dark dark:text-light">{option.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-400 dark:text-red-400 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scale (Segmented Buttons)
// ---------------------------------------------------------------------------

function ScaleQuestion({
  question,
  fieldName,
  setValue,
  selectedValue,
  error,
  questionTextId,
  descriptionId,
  errorId,
}: {
  question: Question;
  fieldName: string;
  // biome-ignore lint/suspicious/noExplicitAny: reusable form component
  setValue?: UseFormSetValue<any>;
  selectedValue?: number;
  error?: string;
  questionTextId: string;
  descriptionId: string;
  errorId: string;
}) {
  const firstLabel = question.options[0]?.label ?? '';
  const lastLabel = question.options[question.options.length - 1]?.label ?? '';

  return (
    <div className="space-y-2">
      <h3
        id={questionTextId}
        className="font-heading text-lg font-semibold text-dark dark:text-light"
      >
        {question.text}
      </h3>

      {question.description && (
        <p id={descriptionId} className="font-body text-sm text-gray-400 dark:text-gray-400">
          {question.description}
        </p>
      )}

      <div
        role="radiogroup"
        aria-labelledby={questionTextId}
        aria-describedby={error ? errorId : undefined}
      >
        <div className="flex gap-1 flex-wrap">
          {question.options.map((option) => {
            const numVal = Number(option.value);
            const isSelected = selectedValue === numVal;
            return (
              <button
                key={option.value}
                type="button"
                aria-checked={isSelected}
                onClick={() => setValue?.(fieldName, numVal)}
                className={`
                  min-h-[44px] min-w-[44px] px-3 py-2 rounded-lg font-body text-sm
                  transition-colors focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2
                  ${
                    isSelected
                      ? 'bg-teal text-white'
                      : 'border border-dark-border/50 dark:border-dark-border text-dark dark:text-light hover:bg-dark-surface/50'
                  }
                `}
              >
                {option.value}
              </button>
            );
          })}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-400 font-body">{firstLabel}</span>
          <span className="text-xs text-gray-400 font-body">{lastLabel}</span>
        </div>
      </div>

      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-400 dark:text-red-400 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
