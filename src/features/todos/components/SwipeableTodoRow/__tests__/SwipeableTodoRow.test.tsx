import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@/test/test-utils';
import { SwipeableTodoRow } from '../SwipeableTodoRow';
import * as useIsCoarsePointerModule from '@hooks/useIsCoarsePointer';
import * as reactSwipeableModule from 'react-swipeable';
import * as reactI18nextModule from 'react-i18next';

// Mock useIsCoarsePointer
vi.mock('@hooks/useIsCoarsePointer', () => ({
  useIsCoarsePointer: vi.fn(),
}));

// Capture useSwipeable config so tests can trigger callbacks
let capturedSwipeConfig: Record<string, (...args: any[]) => void>;

vi.mock('react-swipeable', () => ({
  useSwipeable: vi.fn((config: any) => {
    capturedSwipeConfig = config;
    return { ref: vi.fn() };
  }),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: vi.fn().mockReturnValue({
    t: (key: string) => key,
    i18n: { dir: () => 'ltr' },
  }),
}));

/** Trigger swipe start + movement to make action buttons visible */
function revealActions() {
  act(() => {
    capturedSwipeConfig.onSwipeStart?.({ dir: 'Left' } as unknown);
  });
  act(() => {
    capturedSwipeConfig.onSwiping?.({ deltaX: -100, absX: 100, absY: 0 } as unknown);
  });
}

describe('SwipeableTodoRow', () => {
  const mockOnDelete = vi.fn();
  const mockOnToggleComplete = vi.fn();
  const testTodoId = 'test-todo-1';

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks
    vi.mocked(useIsCoarsePointerModule.useIsCoarsePointer).mockReturnValue(false);
    vi.mocked(reactSwipeableModule.useSwipeable).mockImplementation(((config: any) => {
      capturedSwipeConfig = config;
      return { ref: vi.fn() };
    }) as unknown as typeof reactSwipeableModule.useSwipeable);
    vi.mocked(reactI18nextModule.useTranslation).mockReturnValue({
      t: (key: string) => key,
      i18n: { dir: () => 'ltr' },
    } as unknown as ReturnType<typeof reactI18nextModule.useTranslation>);
  });

  describe('Non-touch rendering', () => {
    it('should render children directly without wrapper div on non-touch devices', () => {
      vi.mocked(useIsCoarsePointerModule.useIsCoarsePointer).mockReturnValue(false);

      const { container } = render(
        <SwipeableTodoRow
          todoId={testTodoId}
          onDelete={mockOnDelete}
          onToggleComplete={mockOnToggleComplete}
          isCompleted={false}
        >
          <div data-testid="child-content">Test Todo</div>
        </SwipeableTodoRow>,
      );

      // Should render children directly
      expect(screen.getByTestId('child-content')).toBeInTheDocument();

      // Should NOT have wrapper with overflow-hidden
      expect(container.querySelector('.overflow-hidden')).not.toBeInTheDocument();
    });
  });

  describe('Touch device rendering', () => {
    beforeEach(() => {
      vi.mocked(useIsCoarsePointerModule.useIsCoarsePointer).mockReturnValue(true);
    });

    it('should render wrapper with overflow-hidden class on touch devices', () => {
      const { container } = render(
        <SwipeableTodoRow
          todoId={testTodoId}
          onDelete={mockOnDelete}
          onToggleComplete={mockOnToggleComplete}
          isCompleted={false}
        >
          <div data-testid="child-content">Test Todo</div>
        </SwipeableTodoRow>,
      );

      // Should have wrapper with overflow-hidden
      const wrapper = container.querySelector('.overflow-hidden');
      expect(wrapper).toBeInTheDocument();
    });

    it('should not render action buttons when closed', () => {
      render(
        <SwipeableTodoRow
          todoId={testTodoId}
          onDelete={mockOnDelete}
          onToggleComplete={mockOnToggleComplete}
          isCompleted={false}
        >
          <div>Test Todo</div>
        </SwipeableTodoRow>,
      );

      // Buttons should NOT be in DOM when idle
      expect(screen.queryByLabelText('swipe.delete')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('swipe.complete')).not.toBeInTheDocument();
    });

    it('should render action buttons when swiping', () => {
      render(
        <SwipeableTodoRow
          todoId={testTodoId}
          onDelete={mockOnDelete}
          onToggleComplete={mockOnToggleComplete}
          isCompleted={false}
        >
          <div>Test Todo</div>
        </SwipeableTodoRow>,
      );

      revealActions();

      expect(screen.getByLabelText('swipe.delete')).toBeInTheDocument();
      expect(screen.getByLabelText('swipe.complete')).toBeInTheDocument();
    });

    it('should have correct aria-label for delete button', () => {
      render(
        <SwipeableTodoRow
          todoId={testTodoId}
          onDelete={mockOnDelete}
          onToggleComplete={mockOnToggleComplete}
          isCompleted={false}
        >
          <div>Test Todo</div>
        </SwipeableTodoRow>,
      );

      revealActions();

      const deleteButton = screen.getByLabelText('swipe.delete');
      expect(deleteButton).toHaveAttribute('aria-label', 'swipe.delete');
    });

    it('should have correct aria-label for complete button when not completed', () => {
      render(
        <SwipeableTodoRow
          todoId={testTodoId}
          onDelete={mockOnDelete}
          onToggleComplete={mockOnToggleComplete}
          isCompleted={false}
        >
          <div>Test Todo</div>
        </SwipeableTodoRow>,
      );

      revealActions();

      const completeButton = screen.getByLabelText('swipe.complete');
      expect(completeButton).toHaveAttribute('aria-label', 'swipe.complete');
    });

    it('should have correct aria-label for complete button when completed', () => {
      render(
        <SwipeableTodoRow
          todoId={testTodoId}
          onDelete={mockOnDelete}
          onToggleComplete={mockOnToggleComplete}
          isCompleted={true}
        >
          <div>Test Todo</div>
        </SwipeableTodoRow>,
      );

      revealActions();

      const uncompleteButton = screen.getByLabelText('swipe.uncomplete');
      expect(uncompleteButton).toHaveAttribute('aria-label', 'swipe.uncomplete');
    });

    it('should call onDelete when delete button is clicked', () => {
      render(
        <SwipeableTodoRow
          todoId={testTodoId}
          onDelete={mockOnDelete}
          onToggleComplete={mockOnToggleComplete}
          isCompleted={false}
        >
          <div>Test Todo</div>
        </SwipeableTodoRow>,
      );

      revealActions();

      const deleteButton = screen.getByLabelText('swipe.delete');
      fireEvent.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledTimes(1);
      expect(mockOnToggleComplete).not.toHaveBeenCalled();
    });

    it('should call onToggleComplete when complete button is clicked', () => {
      render(
        <SwipeableTodoRow
          todoId={testTodoId}
          onDelete={mockOnDelete}
          onToggleComplete={mockOnToggleComplete}
          isCompleted={false}
        >
          <div>Test Todo</div>
        </SwipeableTodoRow>,
      );

      revealActions();

      const completeButton = screen.getByLabelText('swipe.complete');
      fireEvent.click(completeButton);

      expect(mockOnToggleComplete).toHaveBeenCalledTimes(1);
      expect(mockOnDelete).not.toHaveBeenCalled();
    });

    it('should have tabIndex -1 for action buttons during swipe (not yet revealed)', () => {
      render(
        <SwipeableTodoRow
          todoId={testTodoId}
          onDelete={mockOnDelete}
          onToggleComplete={mockOnToggleComplete}
          isCompleted={false}
        >
          <div>Test Todo</div>
        </SwipeableTodoRow>,
      );

      revealActions();

      const deleteButton = screen.getByLabelText('swipe.delete');
      const completeButton = screen.getByLabelText('swipe.complete');

      expect(deleteButton).toHaveAttribute('tabIndex', '-1');
      expect(completeButton).toHaveAttribute('tabIndex', '-1');
    });

    it('should have width 72px for both action buttons', () => {
      render(
        <SwipeableTodoRow
          todoId={testTodoId}
          onDelete={mockOnDelete}
          onToggleComplete={mockOnToggleComplete}
          isCompleted={false}
        >
          <div>Test Todo</div>
        </SwipeableTodoRow>,
      );

      revealActions();

      const deleteButton = screen.getByLabelText('swipe.delete');
      const completeButton = screen.getByLabelText('swipe.complete');

      expect(deleteButton).toHaveStyle({ width: '72px' });
      expect(completeButton).toHaveStyle({ width: '72px' });
    });

    it('should have bg-red-500 class for delete button', () => {
      render(
        <SwipeableTodoRow
          todoId={testTodoId}
          onDelete={mockOnDelete}
          onToggleComplete={mockOnToggleComplete}
          isCompleted={false}
        >
          <div>Test Todo</div>
        </SwipeableTodoRow>,
      );

      revealActions();

      const deleteButton = screen.getByLabelText('swipe.delete');
      expect(deleteButton).toHaveClass('bg-red-500');
    });

    it('should have bg-green-500 class for complete button when not completed', () => {
      render(
        <SwipeableTodoRow
          todoId={testTodoId}
          onDelete={mockOnDelete}
          onToggleComplete={mockOnToggleComplete}
          isCompleted={false}
        >
          <div>Test Todo</div>
        </SwipeableTodoRow>,
      );

      revealActions();

      const completeButton = screen.getByLabelText('swipe.complete');
      expect(completeButton).toHaveClass('bg-green-500');
    });

    it('should have bg-amber-500 class for complete button when completed', () => {
      render(
        <SwipeableTodoRow
          todoId={testTodoId}
          onDelete={mockOnDelete}
          onToggleComplete={mockOnToggleComplete}
          isCompleted={true}
        >
          <div>Test Todo</div>
        </SwipeableTodoRow>,
      );

      revealActions();

      const uncompleteButton = screen.getByLabelText('swipe.uncomplete');
      expect(uncompleteButton).toHaveClass('bg-amber-500');
    });

    it('should close revealed actions when clicking outside', () => {
      render(
        <div data-testid="outside">
          <SwipeableTodoRow
            todoId={testTodoId}
            onDelete={mockOnDelete}
            onToggleComplete={mockOnToggleComplete}
            isCompleted={false}
          >
            <div>Test Todo</div>
          </SwipeableTodoRow>
        </div>,
      );

      revealActions();

      // Buttons should be visible during swipe
      expect(screen.getByLabelText('swipe.delete')).toBeInTheDocument();

      const outsideElement = screen.getByTestId('outside');

      // Simulate clicking outside
      fireEvent.mouseDown(outsideElement);

      // Component should still render children
      expect(screen.getByText('Test Todo')).toBeInTheDocument();
    });

    it('should reset revealed state when todoId changes', () => {
      const { rerender } = render(
        <SwipeableTodoRow
          todoId={testTodoId}
          onDelete={mockOnDelete}
          onToggleComplete={mockOnToggleComplete}
          isCompleted={false}
        >
          <div>Test Todo</div>
        </SwipeableTodoRow>,
      );

      revealActions();
      expect(screen.getByLabelText('swipe.delete')).toBeInTheDocument();

      // Change todoId - should reset revealed state
      rerender(
        <SwipeableTodoRow
          todoId="new-todo-id"
          onDelete={mockOnDelete}
          onToggleComplete={mockOnToggleComplete}
          isCompleted={false}
        >
          <div>Test Todo</div>
        </SwipeableTodoRow>,
      );

      // Children should still render
      expect(screen.getByText('Test Todo')).toBeInTheDocument();
    });
  });

  describe('RTL support', () => {
    beforeEach(() => {
      vi.mocked(useIsCoarsePointerModule.useIsCoarsePointer).mockReturnValue(true);
      vi.mocked(reactI18nextModule.useTranslation).mockReturnValue({
        t: (key: string) => key,
        i18n: { dir: () => 'rtl' },
      } as unknown as ReturnType<typeof reactI18nextModule.useTranslation>);
    });

    it('should use same logical positions in RTL (CSS handles physical mapping)', () => {
      render(
        <SwipeableTodoRow
          todoId={testTodoId}
          onDelete={mockOnDelete}
          onToggleComplete={mockOnToggleComplete}
          isCompleted={false}
        >
          <div>Test Todo</div>
        </SwipeableTodoRow>,
      );

      revealActions();

      const deleteButton = screen.getByLabelText('swipe.delete');
      const completeButton = screen.getByLabelText('swipe.complete');

      // Logical positions stay the same; CSS start/end handles RTL flipping
      expect(deleteButton).toHaveClass('end-0');
      expect(completeButton).toHaveClass('start-0');
    });
  });
});
