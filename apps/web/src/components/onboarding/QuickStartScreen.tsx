/**
 * QuickStartScreen -- one question at a time with slide transitions.
 *
 * Three questions shown sequentially. Steps 0-1 auto-advance 400ms
 * after selection. Step 2 shows "See my profile" button.
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useConstitutionProfile } from '../../hooks/useConstitutionProfile';
import { questionSlide, questionSlideTransition } from '../../lib/animations';
import { seedQuestionsQueryOptions } from '../../lib/query-options';
import { ErrorBanner, getErrorMessage } from './ErrorBanner';
import { Spinner } from './Spinner';

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const AnswerSchema = z.object({
  questionId: z.number().int().min(1).max(18),
  choice: z.string().min(1),
});

const QuickStartInputSchema = z.object({
  answers: z.tuple([AnswerSchema, AnswerSchema, AnswerSchema]),
});

type QuickStartInput = z.infer<typeof QuickStartInputSchema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuickStartScreen() {
  const navigate = useNavigate();
  const { submitQuickStart } = useConstitutionProfile();
  const questionsQuery = useQuery(seedQuestionsQueryOptions);

  const form = useForm<QuickStartInput>({
    resolver: zodResolver(QuickStartInputSchema),
    mode: 'onChange',
  });

  const questions = questionsQuery.data ?? [];
  const watchedAnswers = form.watch('answers');

  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onSubmit = (data: QuickStartInput) => {
    submitQuickStart.mutate(
      { answers: data.answers },
      {
        onSuccess: () => {
          navigate({ to: '/constitution', search: { from: 'quickstart' } });
        },
      },
    );
  };

  const goNext = useCallback(() => {
    if (currentStep < 2) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
        autoAdvanceTimer.current = null;
      }
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const handleOptionSelect = useCallback(
    (questionId: string, value: string, stepIdx: number) => {
      const key =
        stepIdx === 0
          ? 'answers.0.questionId'
          : stepIdx === 1
            ? 'answers.1.questionId'
            : 'answers.2.questionId';
      form.setValue(key, Number(questionId));
      form.setValue(`answers.${stepIdx as 0 | 1 | 2}.choice` as const, value, {
        shouldValidate: true,
      });

      // Auto-advance for steps 0 and 1
      if (stepIdx < 2) {
        if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
        autoAdvanceTimer.current = setTimeout(() => {
          goNext();
          autoAdvanceTimer.current = null;
        }, 400);
      }
    },
    [form, goNext],
  );

  const currentAnswer = watchedAnswers?.[currentStep]?.choice;

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------

  if (questionsQuery.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <div className="w-full max-w-md space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-dark-elevated rounded-2xl h-14" />
          ))}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error
  // ---------------------------------------------------------------------------

  if (questionsQuery.isError || questions.length < 3) {
    return (
      <div className="flex items-center justify-center min-h-screen px-6">
        <div className="w-full max-w-md">
          <ErrorBanner
            message="Could not load questions. Check your connection and try again."
            onRetry={() => questionsQuery.refetch()}
            isRetrying={questionsQuery.isRefetching}
          />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main UI
  // ---------------------------------------------------------------------------

  const question = questions[currentStep];
  if (!question) return null;

  return (
    <div className="flex flex-col min-h-screen px-6 py-12">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mb-auto">
        {[0, 1, 2].map((idx) => (
          <div
            key={idx}
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              idx === currentStep ? 'bg-teal' : 'bg-dark-elevated'
            }`}
          />
        ))}
      </div>

      {/* Question area */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={questionSlide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={questionSlideTransition}
            className="w-full"
          >
            {/* Question text */}
            <h2
              className="font-heading text-xl font-bold text-cream mb-8"
              style={{ letterSpacing: '-0.02em' }}
            >
              {question.text}
            </h2>

            {/* Options */}
            <div aria-label={question.text} className="flex flex-col gap-3">
              {question.options.map((option) => {
                const isSelected = currentAnswer === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => handleOptionSelect(question.id, option.value, currentStep)}
                    className={`
                      relative text-left min-h-[56px] py-4 px-5 rounded-2xl
                      cursor-pointer select-none touch-manipulation
                      transition-all duration-150
                      ${isSelected ? 'bg-teal/10 text-teal' : 'bg-dark-elevated text-cream/70'}
                    `}
                  >
                    {/* Teal left accent */}
                    {isSelected && (
                      <span className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-teal" />
                    )}
                    <span className="font-body text-sm">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Submission error */}
        {submitQuickStart.isError && (
          <div className="w-full mt-6">
            <ErrorBanner
              message={getErrorMessage(submitQuickStart.error)}
              onRetry={() => {
                submitQuickStart.reset();
                form.handleSubmit(onSubmit)();
              }}
              isRetrying={submitQuickStart.isPending}
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-auto pt-8 w-full max-w-md mx-auto">
        <div className="flex items-center gap-4">
          {/* Back button */}
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={goBack}
              className="font-body text-sm text-cream/40 py-3 px-2 touch-manipulation"
            >
              Back
            </button>
          ) : (
            <div className="w-12" />
          )}

          {/* Next / Submit */}
          <button
            type="button"
            onClick={currentStep === 2 ? form.handleSubmit(onSubmit) : goNext}
            disabled={!currentAnswer || (currentStep === 2 && submitQuickStart.isPending)}
            className={`
              flex-1 bg-teal text-dark font-body font-medium rounded-2xl
              min-h-[48px] flex items-center justify-center
              transition-opacity duration-150
              ${!currentAnswer ? 'opacity-40 pointer-events-none' : ''}
            `}
          >
            {submitQuickStart.isPending ? (
              <Spinner size="md" />
            ) : currentStep === 2 ? (
              'See my profile'
            ) : (
              'Next'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
