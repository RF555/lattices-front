import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { TodoActions } from '../TodoActions';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock useIsMobile — default to desktop (false)
let mockIsMobile = false;
vi.mock('@hooks/useIsMobile', () => ({
  useIsMobile: () => mockIsMobile,
}));

describe('TodoActions', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    mockOnEdit.mockClear();
    mockOnDelete.mockClear();
    mockIsMobile = false;
  });

  it('should render edit and delete buttons', () => {
    render(<TodoActions onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    // Buttons should be accessible via aria-labels
    expect(screen.getByLabelText('actions.editTask')).toBeInTheDocument();
    expect(screen.getByLabelText('actions.deleteTask')).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(<TodoActions onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const editButton = screen.getByLabelText('actions.editTask');
    await user.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<TodoActions onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const deleteButton = screen.getByLabelText('actions.deleteTask');
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).not.toHaveBeenCalled();
  });

  it('should have larger touch targets on mobile for better accessibility', () => {
    render(<TodoActions onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const editButton = screen.getByLabelText('actions.editTask');
    const deleteButton = screen.getByLabelText('actions.deleteTask');

    // Mobile: p-2.5 provides larger touch targets
    // Desktop (sm+): sm:p-1 for compact spacing
    expect(editButton).toHaveClass('p-2.5');
    expect(editButton).toHaveClass('sm:p-1');
    expect(deleteButton).toHaveClass('p-2.5');
    expect(deleteButton).toHaveClass('sm:p-1');
  });

  it('should stop event propagation when buttons are clicked', async () => {
    const user = userEvent.setup();
    const mockContainerClick = vi.fn();

    render(
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- test-only wrapper to verify stopPropagation
      <div onClick={mockContainerClick}>
        <TodoActions onEdit={mockOnEdit} onDelete={mockOnDelete} />
      </div>,
    );

    const editButton = screen.getByLabelText('actions.editTask');
    await user.click(editButton);

    // onEdit should be called, but parent click should not propagate
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockContainerClick).not.toHaveBeenCalled();
  });

  it('should hide edit button on mobile', () => {
    mockIsMobile = true;
    render(<TodoActions onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.queryByLabelText('actions.editTask')).not.toBeInTheDocument();
    expect(screen.getByLabelText('actions.deleteTask')).toBeInTheDocument();
  });
});
