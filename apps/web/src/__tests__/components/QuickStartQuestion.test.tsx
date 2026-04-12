import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, type UseFormRegister, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { QuickStartQuestion } from '../../components/onboarding/QuickStartQuestion';
import { mockQuickStartQuestions } from '../fixtures';

// Wrapper that provides a form context
function QuestionWrapper({
  questionIndex = 0,
  onValueChange,
}: {
  questionIndex?: number;
  onValueChange?: (v: string) => void;
}) {
  const form = useForm({ defaultValues: { answer: '' } });
  const question = mockQuickStartQuestions[questionIndex];
  if (!question) return null;

  return (
    <FormProvider {...form}>
      <QuickStartQuestion
        question={question}
        fieldName="answer"
        register={form.register}
        selectedValue={form.watch('answer')}
        onValueChange={onValueChange}
      />
    </FormProvider>
  );
}

describe('QuickStartQuestion', () => {
  it('renders all options as radio cards for single-choice', () => {
    render(<QuestionWrapper />);
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);
  });

  it('renders question text', () => {
    render(<QuestionWrapper />);
    expect(screen.getByText('How is your appetite?')).toBeInTheDocument();
  });

  it('renders radio group with aria-labelledby', () => {
    render(<QuestionWrapper />);
    const radiogroup = screen.getByRole('radiogroup');
    expect(radiogroup).toHaveAttribute('aria-labelledby');
  });

  it('selecting an option marks it as checked', async () => {
    const user = userEvent.setup();
    render(<QuestionWrapper />);
    const radios = screen.getAllByRole('radio');
    const radio = radios[1];
    if (radio) await user.click(radio);
    expect(radios[1]).toBeChecked();
  });

  it('only one option is selected at a time', async () => {
    const user = userEvent.setup();
    render(<QuestionWrapper />);
    const radios = screen.getAllByRole('radio');
    const first = radios[0];
    const second = radios[1];
    if (first) await user.click(first);
    if (second) await user.click(second);
    expect(radios[0]).not.toBeChecked();
    expect(radios[1]).toBeChecked();
  });

  it('calls onValueChange when option is selected', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<QuestionWrapper onValueChange={onChange} />);
    const radios = screen.getAllByRole('radio');
    const first = radios[0];
    if (first) await user.click(first);
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it("renders error message with role='alert'", () => {
    const mockRegister = vi.fn().mockReturnValue({
      onChange: vi.fn(),
      onBlur: vi.fn(),
      ref: vi.fn(),
      name: 'test',
    });
    const question = mockQuickStartQuestions[0];
    if (!question) return;
    render(
      <QuickStartQuestion
        question={question}
        fieldName="test"
        register={mockRegister as unknown as UseFormRegister<Record<string, unknown>>}
        error="This field is required"
      />,
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('This field is required');
  });

  it('each option card has minimum 44px height', () => {
    render(<QuestionWrapper />);
    const labels = screen.getAllByRole('radio').map((r) => r.closest('label'));
    for (const label of labels) {
      expect(label).toHaveClass('min-h-[44px]');
    }
  });
});
