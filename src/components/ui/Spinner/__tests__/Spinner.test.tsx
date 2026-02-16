import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { Spinner } from '../Spinner';

describe('Spinner', () => {
  it('should render with status role', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should have i18n aria-label', () => {
    render(<Spinner />);
    // actions.loading from common translations
    expect(screen.getByRole('status')).toHaveAttribute('aria-label');
    expect(screen.getByRole('status').getAttribute('aria-label')).toBeTruthy();
  });

  it('should have animate-spin class', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toHaveClass('animate-spin');
  });

  describe('Sizes', () => {
    it('should render small size', () => {
      render(<Spinner size="sm" />);
      expect(screen.getByRole('status')).toHaveClass('h-4', 'w-4');
    });

    it('should render medium size by default', () => {
      render(<Spinner />);
      expect(screen.getByRole('status')).toHaveClass('h-8', 'w-8');
    });

    it('should render large size', () => {
      render(<Spinner size="lg" />);
      expect(screen.getByRole('status')).toHaveClass('h-12', 'w-12');
    });
  });

  it('should merge custom className', () => {
    render(<Spinner className="text-red-500" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('text-red-500');
    expect(spinner).toHaveClass('animate-spin');
  });

  it('should have primary text color', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toHaveClass('text-primary');
  });
});
