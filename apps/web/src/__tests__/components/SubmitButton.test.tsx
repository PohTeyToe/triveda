import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SubmitButton } from '../../components/onboarding/SubmitButton';

describe('SubmitButton', () => {
  it('renders button text when not pending', () => {
    render(
      <SubmitButton
        text="See my profile"
        isPending={false}
        isDisabled={false}
        onClick={() => {}}
      />,
    );
    expect(screen.getByText('See my profile')).toBeInTheDocument();
  });

  it('shows spinner when pending', () => {
    const { container } = render(
      <SubmitButton text="See my profile" isPending={true} isDisabled={false} onClick={() => {}} />,
    );
    // Text should be replaced by spinner
    expect(screen.queryByText('See my profile')).not.toBeInTheDocument();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('is disabled when isDisabled is true', () => {
    render(<SubmitButton text="Submit" isPending={false} isDisabled={true} onClick={() => {}} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<SubmitButton text="Submit" isPending={false} isDisabled={false} onClick={onClick} />);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders primary variant full-width', () => {
    render(
      <SubmitButton
        text="Test"
        isPending={false}
        isDisabled={false}
        onClick={() => {}}
        variant="primary"
      />,
    );
    expect(screen.getByRole('button').className).toContain('w-full');
  });

  it('renders secondary variant with border', () => {
    render(
      <SubmitButton
        text="Done"
        isPending={false}
        isDisabled={false}
        onClick={() => {}}
        variant="secondary"
      />,
    );
    expect(screen.getByRole('button').className).toContain('border');
  });
});
