import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { ReorderButtons } from '../ReorderButtons';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock the store with a controllable sortBy value
let mockSortBy = 'position';
vi.mock('@features/todos/stores/todoUiStore', () => ({
  useTodoUiStore: (selector: (state: { sortBy: string }) => unknown) =>
    selector({ sortBy: mockSortBy }),
}));

describe('ReorderButtons', () => {
  const mockOnMoveUp = vi.fn();
  const mockOnMoveDown = vi.fn();

  beforeEach(() => {
    mockOnMoveUp.mockClear();
    mockOnMoveDown.mockClear();
    mockSortBy = 'position';
  });

  it('should render up and down buttons when sortBy is position', () => {
    render(
      <ReorderButtons
        isFirst={false}
        isLast={false}
        onMoveUp={mockOnMoveUp}
        onMoveDown={mockOnMoveDown}
      />,
    );

    expect(screen.getByLabelText('actions.moveUp')).toBeInTheDocument();
    expect(screen.getByLabelText('actions.moveDown')).toBeInTheDocument();
  });

  it('should not render when sortBy is not position', () => {
    mockSortBy = 'createdAt';
    const { container } = render(
      <ReorderButtons
        isFirst={false}
        isLast={false}
        onMoveUp={mockOnMoveUp}
        onMoveDown={mockOnMoveDown}
      />,
    );

    expect(container.innerHTML).toBe('');
  });

  it('should not render when sortBy is title', () => {
    mockSortBy = 'title';
    const { container } = render(
      <ReorderButtons
        isFirst={false}
        isLast={false}
        onMoveUp={mockOnMoveUp}
        onMoveDown={mockOnMoveDown}
      />,
    );

    expect(container.innerHTML).toBe('');
  });

  it('should disable up button when isFirst', () => {
    render(
      <ReorderButtons
        isFirst={true}
        isLast={false}
        onMoveUp={mockOnMoveUp}
        onMoveDown={mockOnMoveDown}
      />,
    );

    expect(screen.getByLabelText('actions.moveUp')).toBeDisabled();
    expect(screen.getByLabelText('actions.moveDown')).not.toBeDisabled();
  });

  it('should disable down button when isLast', () => {
    render(
      <ReorderButtons
        isFirst={false}
        isLast={true}
        onMoveUp={mockOnMoveUp}
        onMoveDown={mockOnMoveDown}
      />,
    );

    expect(screen.getByLabelText('actions.moveUp')).not.toBeDisabled();
    expect(screen.getByLabelText('actions.moveDown')).toBeDisabled();
  });

  it('should disable both buttons when single sibling', () => {
    render(
      <ReorderButtons
        isFirst={true}
        isLast={true}
        onMoveUp={mockOnMoveUp}
        onMoveDown={mockOnMoveDown}
      />,
    );

    expect(screen.getByLabelText('actions.moveUp')).toBeDisabled();
    expect(screen.getByLabelText('actions.moveDown')).toBeDisabled();
  });

  it('should call onMoveUp when up button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ReorderButtons
        isFirst={false}
        isLast={false}
        onMoveUp={mockOnMoveUp}
        onMoveDown={mockOnMoveDown}
      />,
    );

    await user.click(screen.getByLabelText('actions.moveUp'));
    expect(mockOnMoveUp).toHaveBeenCalledTimes(1);
    expect(mockOnMoveDown).not.toHaveBeenCalled();
  });

  it('should call onMoveDown when down button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ReorderButtons
        isFirst={false}
        isLast={false}
        onMoveUp={mockOnMoveUp}
        onMoveDown={mockOnMoveDown}
      />,
    );

    await user.click(screen.getByLabelText('actions.moveDown'));
    expect(mockOnMoveDown).toHaveBeenCalledTimes(1);
    expect(mockOnMoveUp).not.toHaveBeenCalled();
  });

  it('should stop event propagation when buttons are clicked', async () => {
    const user = userEvent.setup();
    const mockContainerClick = vi.fn();

    render(
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- test-only wrapper to verify stopPropagation
      <div onClick={mockContainerClick}>
        <ReorderButtons
          isFirst={false}
          isLast={false}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
        />
      </div>,
    );

    await user.click(screen.getByLabelText('actions.moveUp'));
    expect(mockOnMoveUp).toHaveBeenCalledTimes(1);
    expect(mockContainerClick).not.toHaveBeenCalled();
  });

  it('should have correct touch target sizing', () => {
    render(
      <ReorderButtons
        isFirst={false}
        isLast={false}
        onMoveUp={mockOnMoveUp}
        onMoveDown={mockOnMoveDown}
      />,
    );

    const upButton = screen.getByLabelText('actions.moveUp');
    const downButton = screen.getByLabelText('actions.moveDown');

    expect(upButton).toHaveClass('p-2.5');
    expect(upButton).toHaveClass('sm:p-1');
    expect(downButton).toHaveClass('p-2.5');
    expect(downButton).toHaveClass('sm:p-1');
  });
});
