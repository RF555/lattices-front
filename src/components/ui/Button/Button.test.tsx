/**
 * Tests for Button Component
 *
 * Tests all button variants, sizes, loading states, and accessibility.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('should handle click events', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  describe('Variants', () => {
    it('should render primary variant', () => {
      render(<Button variant="primary">Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary');
    });

    it('should render secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gray-100');
    });

    it('should render ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-gray-100');
    });

    it('should render danger variant', () => {
      render(<Button variant="danger">Danger</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-600');
    });

    it('should default to primary variant', () => {
      render(<Button>Default</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary');
    });
  });

  describe('Sizes', () => {
    it('should render small size', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-sm', 'px-3', 'py-1.5');
    });

    it('should render medium size', () => {
      render(<Button size="md">Medium</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-sm', 'px-4', 'py-2');
    });

    it('should render large size', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-base', 'px-6', 'py-3');
    });

    it('should default to medium size', () => {
      render(<Button>Default</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-4', 'py-2');
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when isLoading is true', () => {
      render(<Button isLoading>Submit</Button>);
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
      expect(screen.queryByText('Submit')).not.toBeInTheDocument();
    });

    it('should disable button when loading', () => {
      render(<Button isLoading>Submit</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should not trigger click when loading', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <Button isLoading onClick={handleClick}>
          Submit
        </Button>,
      );

      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should show children when not loading', () => {
      render(<Button isLoading={false}>Submit</Button>);
      expect(screen.getByText('Submit')).toBeInTheDocument();
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should disable button when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should not trigger click when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>,
      );

      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should have disabled styling', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
    });
  });

  describe('Custom Props', () => {
    it('should accept custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should forward HTML button attributes', () => {
      render(
        <Button type="submit" name="submit-btn" data-testid="custom-button">
          Submit
        </Button>,
      );
      const button = screen.getByTestId('custom-button');
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('name', 'submit-btn');
    });

    it('should support ref forwarding', () => {
      const ref = vi.fn();
      render(<Button ref={ref}>Button</Button>);
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLButtonElement));
    });
  });

  describe('Accessibility', () => {
    it('should have proper focus styles', () => {
      render(<Button>Focus me</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Keyboard</Button>);

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);

      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('should support aria-label', () => {
      render(<Button aria-label="Custom label">Icon</Button>);
      expect(screen.getByRole('button', { name: /custom label/i })).toBeInTheDocument();
    });
  });

  describe('Combinations', () => {
    it('should support variant and size combinations', () => {
      render(
        <Button variant="danger" size="lg">
          Large Danger
        </Button>,
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-600', 'text-base', 'px-6', 'py-3');
    });

    it('should support loading with custom variant', () => {
      render(
        <Button variant="secondary" isLoading>
          Loading Secondary
        </Button>,
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gray-100');
      expect(button).toBeDisabled();
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should support all props together', () => {
      render(
        <Button variant="primary" size="sm" disabled className="mt-4">
          Complete
        </Button>,
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary', 'text-sm', 'px-3', 'mt-4');
      expect(button).toBeDisabled();
    });
  });
});
