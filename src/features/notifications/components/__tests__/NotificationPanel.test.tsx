import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { NotificationPanel } from '../NotificationPanel/NotificationPanel';

const mockMutate = vi.fn();
const mockMarkAsReadMutate = vi.fn();

vi.mock('../../hooks/useNotifications', () => ({
  useNotifications: vi.fn(() => ({
    data: [],
    isLoading: false,
  })),
  useMarkAsRead: vi.fn(() => ({ mutate: mockMarkAsReadMutate })),
  useMarkAllAsRead: vi.fn(() => ({ mutate: mockMutate })),
}));

import { useNotifications } from '../../hooks/useNotifications';
const mockUseNotifications = vi.mocked(useNotifications);

describe('NotificationPanel', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNotifications.mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof useNotifications>);
  });

  it('should render the panel header', () => {
    render(<NotificationPanel onClose={mockOnClose} />);
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('should show empty state when no notifications', () => {
    render(<NotificationPanel onClose={mockOnClose} />);
    expect(screen.getByText(/no notifications/i)).toBeInTheDocument();
  });

  it('should render loading state', () => {
    mockUseNotifications.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useNotifications>);

    render(<NotificationPanel onClose={mockOnClose} />);
    // Should not show empty state during loading
    expect(screen.queryByText(/no notifications/i)).not.toBeInTheDocument();
  });

  it('should render notifications list', () => {
    mockUseNotifications.mockReturnValue({
      data: [
        {
          id: '1',
          type: 'task_assigned',
          actorName: 'John Doe',
          actorAvatarUrl: null,
          entityType: 'todo',
          entityId: 'todo-1',
          message: 'John assigned you a task',
          isRead: false,
          isSeen: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'task_completed',
          actorName: 'Jane Smith',
          actorAvatarUrl: 'https://example.com/avatar.jpg',
          entityType: 'todo',
          entityId: 'todo-2',
          message: 'Jane completed a task',
          isRead: true,
          isSeen: true,
          createdAt: new Date().toISOString(),
        },
      ],
      isLoading: false,
    } as ReturnType<typeof useNotifications>);

    render(<NotificationPanel onClose={mockOnClose} />);

    expect(screen.getByText('John assigned you a task')).toBeInTheDocument();
    expect(screen.getByText('Jane completed a task')).toBeInTheDocument();
  });

  it('should show initials when no avatar URL', () => {
    mockUseNotifications.mockReturnValue({
      data: [
        {
          id: '1',
          type: 'task_assigned',
          actorName: 'John Doe',
          actorAvatarUrl: null,
          entityType: 'todo',
          entityId: 'todo-1',
          message: 'Test message',
          isRead: false,
          isSeen: false,
          createdAt: new Date().toISOString(),
        },
      ],
      isLoading: false,
    } as ReturnType<typeof useNotifications>);

    render(<NotificationPanel onClose={mockOnClose} />);
    expect(screen.getByText('JO')).toBeInTheDocument();
  });

  it('should call markAllAsRead when mark all button is clicked', async () => {
    const user = userEvent.setup();
    render(<NotificationPanel onClose={mockOnClose} />);

    const markAllButton = screen.getByRole('button', { name: /mark all/i });
    await user.click(markAllButton);

    expect(mockMutate).toHaveBeenCalled();
  });

  it('should call markAsRead and onClose when a notification is clicked', async () => {
    const user = userEvent.setup();

    mockUseNotifications.mockReturnValue({
      data: [
        {
          id: 'notif-1',
          type: 'task_assigned',
          actorName: 'John',
          actorAvatarUrl: null,
          entityType: 'todo',
          entityId: 'todo-1',
          message: 'Click me',
          isRead: false,
          isSeen: false,
          createdAt: new Date().toISOString(),
        },
      ],
      isLoading: false,
    } as ReturnType<typeof useNotifications>);

    render(<NotificationPanel onClose={mockOnClose} />);

    await user.click(screen.getByText('Click me'));

    expect(mockMarkAsReadMutate).toHaveBeenCalledWith('notif-1');
    expect(mockOnClose).toHaveBeenCalled();
  });
});
