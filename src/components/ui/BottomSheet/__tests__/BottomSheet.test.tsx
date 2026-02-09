/**
 * Tests for BottomSheet Component
 *
 * Tests the reusable bottom sheet wrapper around vaul's Drawer.
 * Verifies open/close behavior, rendering children, accessibility, and styling.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { BottomSheet } from '../BottomSheet';

describe('BottomSheet', () => {
  const mockOnOpenChange = vi.fn();

  describe('Visibility', () => {
    it('should render nothing when open is false', () => {
      render(
        <BottomSheet open={false} onOpenChange={mockOnOpenChange} title="Test Sheet">
          <div>Sheet Content</div>
        </BottomSheet>,
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByText('Sheet Content')).not.toBeInTheDocument();
    });

    it('should render dialog when open is true', () => {
      render(
        <BottomSheet open={true} onOpenChange={mockOnOpenChange} title="Test Sheet">
          <div>Sheet Content</div>
        </BottomSheet>,
      );

      expect(screen.getByRole('dialog', { name: 'Test Sheet' })).toBeInTheDocument();
    });
  });

  describe('Content Rendering', () => {
    it('should render children when open', () => {
      render(
        <BottomSheet open={true} onOpenChange={mockOnOpenChange} title="Test Sheet">
          <div>Sheet Content</div>
        </BottomSheet>,
      );

      expect(screen.getByText('Sheet Content')).toBeInTheDocument();
    });

    it('should render multiple children elements', () => {
      render(
        <BottomSheet open={true} onOpenChange={mockOnOpenChange} title="Test Sheet">
          <div>First Element</div>
          <div>Second Element</div>
          <button>Action Button</button>
        </BottomSheet>,
      );

      expect(screen.getByText('First Element')).toBeInTheDocument();
      expect(screen.getByText('Second Element')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action Button' })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have title as sr-only text', () => {
      render(
        <BottomSheet open={true} onOpenChange={mockOnOpenChange} title="Accessible Title">
          <div>Content</div>
        </BottomSheet>,
      );

      // Title should be accessible to screen readers but visually hidden
      const title = screen.getByText('Accessible Title');
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('sr-only');
    });

    it('should have dialog with aria-label matching title', () => {
      render(
        <BottomSheet open={true} onOpenChange={mockOnOpenChange} title="Sheet Title">
          <div>Content</div>
        </BottomSheet>,
      );

      expect(screen.getByRole('dialog', { name: 'Sheet Title' })).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should accept maxHeight prop', () => {
      // Verifies component accepts the maxHeight prop without error
      render(
        <BottomSheet
          open={true}
          onOpenChange={mockOnOpenChange}
          title="Test Sheet"
          maxHeight="max-h-[50vh]"
        >
          <div>Content</div>
        </BottomSheet>,
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should accept className prop', () => {
      // Verifies component accepts the className prop without error
      render(
        <BottomSheet
          open={true}
          onOpenChange={mockOnOpenChange}
          title="Test Sheet"
          className="custom-class"
        >
          <div>Content</div>
        </BottomSheet>,
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should accept dismissible prop', () => {
      // Verifies component accepts the dismissible prop without error
      render(
        <BottomSheet
          open={true}
          onOpenChange={mockOnOpenChange}
          title="Test Sheet"
          dismissible={false}
        >
          <div>Content</div>
        </BottomSheet>,
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
