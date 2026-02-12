import { describe, it, expect } from 'vitest';
import { render } from '@/test/test-utils';
import { Skeleton } from '../Skeleton';

describe('Skeleton', () => {
  it('should render with default text variant and pulse animation', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass('bg-gray-200', 'rounded', 'h-4', 'animate-pulse');
  });

  it('should render circular variant', () => {
    const { container } = render(<Skeleton variant="circular" />);
    expect(container.firstChild).toHaveClass('rounded-full');
  });

  it('should render rectangular variant', () => {
    const { container } = render(<Skeleton variant="rectangular" />);
    expect(container.firstChild).toHaveClass('rounded-md');
  });

  it('should render wave animation', () => {
    const { container } = render(<Skeleton animation="wave" />);
    expect(container.firstChild).toHaveClass('animate-shimmer');
  });

  it('should render without animation', () => {
    const { container } = render(<Skeleton animation="none" />);
    expect(container.firstChild).not.toHaveClass('animate-pulse', 'animate-shimmer');
  });

  it('should apply custom width and height via style', () => {
    const { container } = render(<Skeleton width="200px" height={32} />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('200px');
    expect(el.style.height).toBe('32px');
  });

  it('should accept percentage width', () => {
    const { container } = render(<Skeleton width="50%" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('50%');
  });

  it('should merge custom className', () => {
    const { container } = render(<Skeleton className="mt-4" />);
    expect(container.firstChild).toHaveClass('mt-4', 'bg-gray-200');
  });
});
