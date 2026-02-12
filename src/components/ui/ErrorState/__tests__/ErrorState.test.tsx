import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { ErrorState } from '../ErrorState';

describe('ErrorState', () => {
  it('should render default title and message from i18n', () => {
    render(<ErrorState />);
    // Default keys: error.defaultTitle, error.defaultMessage
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('should render custom title and message', () => {
    render(<ErrorState title="Not Found" message="The page was not found." />);
    expect(screen.getByText('Not Found')).toBeInTheDocument();
    expect(screen.getByText('The page was not found.')).toBeInTheDocument();
  });

  it('should render retry button when onRetry is provided', () => {
    render(<ErrorState onRetry={vi.fn()} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should not render retry button when onRetry is absent', () => {
    render(<ErrorState />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should call onRetry when retry button is clicked', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);

    await user.click(screen.getByRole('button'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should render warning icon', () => {
    const { container } = render(<ErrorState />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
