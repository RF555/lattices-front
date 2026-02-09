/**
 * Tests for FAB (Floating Action Button) Component
 *
 * Tests the mobile-only floating action button with Plus icon.
 * Verifies rendering, positioning, click behavior, and accessibility.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { FAB } from '../FAB';

describe('FAB', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  describe('Rendering', () => {
    it('should render button with aria-label', () => {
      render(<FAB onClick={mockOnClick} label="Add new task" />);

      expect(screen.getByRole('button', { name: 'Add new task' })).toBeInTheDocument();
    });

    it('should render Plus icon', () => {
      const { container } = render(<FAB onClick={mockOnClick} label="Add" />);

      // Plus icon from lucide-react renders as SVG
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should be a button element', () => {
      render(<FAB onClick={mockOnClick} label="Add" />);

      const button = screen.getByRole('button', { name: 'Add' });
      expect(button.tagName).toBe('BUTTON');
    });

    it('should have type="button"', () => {
      render(<FAB onClick={mockOnClick} label="Add" />);

      const button = screen.getByRole('button', { name: 'Add' });
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  describe('Click Behavior', () => {
    it('should call onClick when clicked', async () => {
      const user = userEvent.setup();
      render(<FAB onClick={mockOnClick} label="Add" />);

      await user.click(screen.getByRole('button', { name: 'Add' }));

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick on each click', async () => {
      const user = userEvent.setup();
      render(<FAB onClick={mockOnClick} label="Add" />);

      await user.click(screen.getByRole('button', { name: 'Add' }));
      await user.click(screen.getByRole('button', { name: 'Add' }));
      await user.click(screen.getByRole('button', { name: 'Add' }));

      expect(mockOnClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('Positioning', () => {
    it('should have fixed positioning', () => {
      render(<FAB onClick={mockOnClick} label="Add" />);

      const button = screen.getByRole('button', { name: 'Add' });
      expect(button).toHaveClass('fixed');
    });

    it('should be positioned at bottom-24', () => {
      render(<FAB onClick={mockOnClick} label="Add" />);

      const button = screen.getByRole('button', { name: 'Add' });
      expect(button).toHaveClass('bottom-24');
    });

    it('should be positioned at end-4 (RTL-aware right positioning)', () => {
      render(<FAB onClick={mockOnClick} label="Add" />);

      const button = screen.getByRole('button', { name: 'Add' });
      expect(button).toHaveClass('end-4');
    });

    it('should have z-sticky z-index', () => {
      render(<FAB onClick={mockOnClick} label="Add" />);

      const button = screen.getByRole('button', { name: 'Add' });
      expect(button).toHaveClass('z-sticky');
    });
  });

  describe('Mobile-Only Visibility', () => {
    it('should have sm:hidden class for mobile-only display', () => {
      render(<FAB onClick={mockOnClick} label="Add" />);

      const button = screen.getByRole('button', { name: 'Add' });
      expect(button).toHaveClass('sm:hidden');
    });
  });

  describe('Styling', () => {
    it('should be circular (rounded-full)', () => {
      render(<FAB onClick={mockOnClick} label="Add" />);

      const button = screen.getByRole('button', { name: 'Add' });
      expect(button).toHaveClass('rounded-full');
    });

    it('should have fixed dimensions (w-14 h-14)', () => {
      render(<FAB onClick={mockOnClick} label="Add" />);

      const button = screen.getByRole('button', { name: 'Add' });
      expect(button).toHaveClass('w-14');
      expect(button).toHaveClass('h-14');
    });

    it('should have primary background color', () => {
      render(<FAB onClick={mockOnClick} label="Add" />);

      const button = screen.getByRole('button', { name: 'Add' });
      expect(button).toHaveClass('bg-primary');
    });

    it('should have white text color', () => {
      render(<FAB onClick={mockOnClick} label="Add" />);

      const button = screen.getByRole('button', { name: 'Add' });
      expect(button).toHaveClass('text-white');
    });

    it('should have shadow', () => {
      render(<FAB onClick={mockOnClick} label="Add" />);

      const button = screen.getByRole('button', { name: 'Add' });
      expect(button).toHaveClass('shadow-lg');
    });

    it('should have active scale animation', () => {
      render(<FAB onClick={mockOnClick} label="Add" />);

      const button = screen.getByRole('button', { name: 'Add' });
      expect(button).toHaveClass('active:scale-95');
      expect(button).toHaveClass('transition-transform');
    });

    it('should center content with flexbox', () => {
      render(<FAB onClick={mockOnClick} label="Add" />);

      const button = screen.getByRole('button', { name: 'Add' });
      expect(button).toHaveClass('flex');
      expect(button).toHaveClass('items-center');
      expect(button).toHaveClass('justify-center');
    });

    it('should apply custom className', () => {
      render(<FAB onClick={mockOnClick} label="Add" className="custom-class" />);

      const button = screen.getByRole('button', { name: 'Add' });
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible label', () => {
      render(<FAB onClick={mockOnClick} label="Create new task" />);

      const button = screen.getByRole('button', { name: 'Create new task' });
      expect(button).toHaveAttribute('aria-label', 'Create new task');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<FAB onClick={mockOnClick} label="Add" />);

      const button = screen.getByRole('button', { name: 'Add' });
      button.focus();
      await user.keyboard('{Enter}');

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });
});
