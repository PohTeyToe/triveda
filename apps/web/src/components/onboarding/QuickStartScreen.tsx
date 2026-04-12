/**
 * QuickStartScreen -- the first screen a new Triveda user sees.
 *
 * Three questions, one submit button. No progress bar, no back button,
 * no skip. Fifteen seconds to complete.
 *
 * "People can't even do 3-second Instagram reels." -- Sasha
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useConstitutionProfile } from '../../hooks/useConstitutionProfile';
import { seedQuestionsQueryOptions } from '../../lib/query-options';
import { ErrorBanner, getErrorMessage } from './ErrorBanner';
import { QuickStartQuestion } from './QuickStartQuestion';
import { SubmitButton } from './SubmitButton';

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

  const watchedAnswers = form.watch('answers');

  const allAnswered =
    questions.length === 3 &&
    watchedAnswers?.[0]?.choice &&
    watchedAnswers?.[1]?.choice &&
    watchedAnswers?.[2]?.choice;

  if (questionsQuery.isLoading) {
    return (
      <div className="max-w-lg mx-auto animate-pulse space-y-6 py-8">
        <div className="h-8 w-64 bg-gray-200 dark:bg-dark-surface rounded mx-auto" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-5 w-48 bg-gray-200 dark:bg-dark-surface rounded" />
            <div className="h-12 w-full bg-gray-200 dark:bg-dark-surface rounded-xl" />
            <div className="h-12 w-full bg-gray-200 dark:bg-dark-surface rounded-xl" />
            <div className="h-12 w-full bg-gray-200 dark:bg-dark-surface rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (questionsQuery.isError || questions.length < 3) {
    return (
      <div className="max-w-lg mx-auto py-8">
        <ErrorBanner
          message="Could not load questions. Check your connection and try again."
          onRetry={() => questionsQuery.refetch()}
          isRetrying={questionsQuery.isRefetching}
        />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-8">
      <h1 className="font-heading text-2xl md:text-3xl font-bold text-center text-dark dark:text-light mb-8">
        Let's get to know you.
      </h1>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 md:space-y-8" noValidate>
        {questions.map((question, idx) => (
          <QuickStartQuestion
            key={question.id}
            question={question}
            fieldName={`answers.${idx}.choice` as const}
            register={form.register}
            selectedValue={watchedAnswers?.[idx]?.choice}
            error={form.formState.errors.answers?.[idx]?.choice?.message}
            onValueChange={() => {
              // Set the questionId when any radio in this group changes
              const key =
                idx === 0
                  ? 'answers.0.questionId'
                  : idx === 1
                    ? 'answers.1.questionId'
                    : 'answers.2.questionId';
              form.setValue(key, Number(question.id));
            }}
          />
        ))}

        {/* Error banner for submission failures */}
        {submitQuickStart.isError && (
          <ErrorBanner
            message={getErrorMessage(submitQuickStart.error)}
            onRetry={() => {
              submitQuickStart.reset();
              form.handleSubmit(onSubmit)();
            }}
            isRetrying={submitQuickStart.isPending}
          />
        )}

        {/* Submit button -- sticky on mobile */}
        <div className="sticky bottom-0 pt-4 pb-safe bg-gradient-to-t from-light dark:from-dark via-light/80 dark:via-dark/80 to-transparent">
          <SubmitButton
            text="See my profile"
            isPending={submitQuickStart.isPending}
            isDisabled={!allAnswered}
            onClick={form.handleSubmit(onSubmit)}
            variant="primary"
          />
        </div>
      </form>
    </div>
  );
}
