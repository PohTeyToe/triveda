/**
 * DailyProfilingQuestion -- self-contained, zero-prop component.
 *
 * Renders one progressive profiling question per day above the Daily Card.
 * Returns null when profile is complete or already answered today.
 * After submission, the card fades out and collapses.
 *
 * "They don't realize that they're doing the work but they are doing the work." -- Sasha
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useConstitutionProfile } from '../../hooks/useConstitutionProfile';
import { useProgressiveProfilingState } from '../../hooks/useProgressiveProfilingState';
import { fadeCollapseVariants } from '../../lib/animations';
import { Card } from '../layout/Card';
import { ErrorBanner } from './ErrorBanner';
import { QuickStartQuestion } from './QuickStartQuestion';
import { SubmitButton } from './SubmitButton';

const AnswerInputSchema = z.object({
  answer: z.object({
    questionId: z.number().int().min(1).max(18),
    choice: z.string().min(1),
  }),
});

type AnswerInput = z.infer<typeof AnswerInputSchema>;

export function DailyProfilingQuestion() {
  const { nextQuestion, isLoading } = useProgressiveProfilingState();
  const { submitAnswer } = useConstitutionProfile();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<AnswerInput>({
    resolver: zodResolver(AnswerInputSchema),
    mode: 'onChange',
  });

  const watchedChoice = form.watch('answer.choice');

  // Loading shimmer
  if (isLoading) {
    return (
      <div
        className="w-full h-[120px] rounded-xl bg-gray-200 dark:bg-dark-surface animate-pulse"
        aria-busy="true"
        aria-label="Loading question"
      />
    );
  }

  // Nothing to render
  if (!nextQuestion) return null;

  const onSubmit = (data: AnswerInput) => {
    setSubmitError(null);
    submitAnswer.mutate(
      { answer: data.answer },
      {
        onSuccess: () => {
          setIsSubmitted(true);
        },
        onError: (error) => {
          setSubmitError(error.message || "That didn't go through. Try again?");
        },
      },
    );
  };

  return (
    <AnimatePresence mode="wait">
      {!isSubmitted && (
        <motion.div
          key="daily-question"
          variants={fadeCollapseVariants}
          initial="visible"
          animate="visible"
          exit="hidden"
          layout
        >
          <Card variant="elevated" className="p-4 space-y-3">
            <p className="font-body text-sm text-gray-400 dark:text-gray-400">
              One quick question for you.
            </p>

            <QuickStartQuestion
              question={nextQuestion}
              fieldName="answer.choice"
              register={form.register}
              selectedValue={watchedChoice}
              error={form.formState.errors.answer?.choice?.message}
              onValueChange={() => {
                form.setValue('answer.questionId', Number(nextQuestion.id));
              }}
            />

            {submitError && (
              <ErrorBanner
                message={submitError}
                onRetry={() => {
                  setSubmitError(null);
                  submitAnswer.reset();
                  form.handleSubmit(onSubmit)();
                }}
                isRetrying={submitAnswer.isPending}
              />
            )}

            <SubmitButton
              text={submitError ? 'Try again' : 'Done'}
              isPending={submitAnswer.isPending}
              isDisabled={!watchedChoice}
              onClick={form.handleSubmit(onSubmit)}
              variant="secondary"
            />
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
