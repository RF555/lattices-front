import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { NotificationPanel } from '../NotificationPanel/NotificationPanel';
import { createMockNotification } from '@/test/factories';
import { useNotificationUiStore } from '@features/notifications/stores/notificationUiStore';

const mockMarkAsReadMutate = vi.fn();
const mockMarkAllAsReadMutate = vi.fn();
const mockDeleteNotificationMutate = vi.fn();

vi.mock('@features/notifications/hooks/useNotifications', () => ({
  useNotifications: vi.fn(() => ({
    data: {
      notifications: [],
      unreadCount: 0,
      nextCursor: null,
    },
    isLoading: false,
  })),
  useMarkAsRead: vi.fn(() => ({ mutate: mockMarkAsReadMutate })),
  useMarkAllAsRead: vi.fn(() => ({ mutate: mockMarkAllAsReadMutate })),
  useDeleteNotification: vi.fn(() => ({ mutate: mockDeleteNotificationMutate })),
}));

// Mock the todoUiStore
vi.mock('@features/todos/stores/todoUiStore', () => ({
  useTodoUiStore: {
    getState: vi.fn(() => ({
      setSelectedId: vi.fn(),
    })),
  },
}));

import { useNotifications } from '@features/notifications/hooks/useNotifications';
const mockUseNotifications = vi.mocked(useNotifications);

describe('NotificationPanel', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset store state
    useNotificationUiStore.setState({
      panelOpen: true,
      panelFilter: 'all',
      showToastOnNew: true,
    });

    mockUseNotifications.mockReturnValue({
      data: {
        notifications: [],
        unreadCount: 0,
        nextCursor: null,
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useNotifications>);
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
    } as unknown as ReturnType<typeof useNotifications>);

    render(<NotificationPanel onClose={mockOnClose} />);
    // Should show spinner during loading
    expect(screen.queryByText(/no notifications/i)).not.toBeInTheDocument();
  });

  it('should render notifications list', () => {
    const notifications = [
      createMockNotification({
        id: 'notif-1',
        type: 'task.completed',
        metadata: {
          actorName: 'John Doe',
          entityTitle: 'Test Task 1',
        },
        isRead: false,
      }),
      createMockNotification({
        id: 'notif-2',
        type: 'task.updated',
        metadata: {
          actorName: 'Jane Smith',
          entityTitle: 'Test Task 2',
        },
        isRead: true,
      }),
    ];

    mockUseNotifications.mockReturnValue({
      data: {
        notifications,
        unreadCount: 1,
        nextCursor: null,
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useNotifications>);

    render(<NotificationPanel onClose={mockOnClose} />);

    // Check that notification messages are rendered (using i18n templates)
    expect(screen.getByText(/John Doe completed "Test Task 1"/i)).toBeInTheDocument();
    expect(screen.getByText(/Jane Smith updated "Test Task 2"/i)).toBeInTheDocument();
  });

  it('should show initials when no avatar URL', () => {
    const notifications = [
      createMockNotification({
        id: 'notif-1',
        metadata: {
          actorName: 'John Doe',
          actorAvatarUrl: undefined,
          entityTitle: 'Test Task',
        },
      }),
    ];

    mockUseNotifications.mockReturnValue({
      data: {
        notifications,
        unreadCount: 1,
        nextCursor: null,
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useNotifications>);

    render(<NotificationPanel onClose={mockOnClose} />);
    expect(screen.getByText('JO')).toBeInTheDocument();
  });

  it('should render filter tabs', () => {
    render(<NotificationPanel onClose={mockOnClose} />);

    // Get all buttons and find by exact text to avoid "Mark all" confusion
    const allButtons = screen.getAllByRole('button');
    const allTab = allButtons.find((btn) => btn.textContent === 'All');
    const unreadTab = allButtons.find((btn) => btn.textContent === 'Unread');

    expect(allTab).toBeInTheDocument();
    expect(unreadTab).toBeInTheDocument();
  });

  it('should switch between filter tabs', async () => {
    const user = userEvent.setup();
    render(<NotificationPanel onClose={mockOnClose} />);

    // Get all buttons and filter by exact text content to avoid ambiguity
    const allButtons = screen.getAllByRole('button');
    const allTab = allButtons.find((btn) => btn.textContent === 'All');
    const unreadTab = allButtons.find((btn) => btn.textContent === 'Unread');

    expect(allTab).toBeInTheDocument();
    expect(unreadTab).toBeInTheDocument();

    // Initially on 'all' tab
    expect(useNotificationUiStore.getState().panelFilter).toBe('all');

    // Click unread tab
    if (unreadTab) {
      await user.click(unreadTab);
      expect(useNotificationUiStore.getState().panelFilter).toBe('unread');
    }

    // Click all tab
    if (allTab) {
      await user.click(allTab);
      expect(useNotificationUiStore.getState().panelFilter).toBe('all');
    }
  });

  it('should show "All caught up!" empty state when unread filter has no results', () => {
    useNotificationUiStore.setState({ panelFilter: 'unread' });

    render(<NotificationPanel onClose={mockOnClose} />);
    expect(screen.getByText(/all caught up!/i)).toBeInTheDocument();
  });

  it('should call markAllAsRead when mark all button is clicked', async () => {
    const user = userEvent.setup();
    render(<NotificationPanel onClose={mockOnClose} />);

    const markAllButton = screen.getByRole('button', { name: /mark all/i });
    await user.click(markAllButton);

    expect(mockMarkAllAsReadMutate).toHaveBeenCalledWith(undefined);
  });

  it('should call markAsRead and onClose when an unread notification is clicked', async () => {
    const user = userEvent.setup();

    const notifications = [
      createMockNotification({
        id: 'notif-1',
        workspaceId: 'ws-1',
        type: 'task.completed',
        metadata: {
          actorName: 'John',
          entityTitle: 'Click me',
        },
        isRead: false,
      }),
    ];

    mockUseNotifications.mockReturnValue({
      data: {
        notifications,
        unreadCount: 1,
        nextCursor: null,
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useNotifications>);

    render(<NotificationPanel onClose={mockOnClose} />);

    await user.click(screen.getByText(/John completed "Click me"/i));

    expect(mockMarkAsReadMutate).toHaveBeenCalledWith({
      workspaceId: 'ws-1',
      recipientId: 'notif-1',
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not call markAsRead when a read notification is clicked', async () => {
    const user = userEvent.setup();

    const notifications = [
      createMockNotification({
        id: 'notif-1',
        workspaceId: 'ws-1',
        type: 'task.completed',
        metadata: {
          actorName: 'John',
          entityTitle: 'Click me',
        },
        isRead: true,
        readAt: new Date().toISOString(),
      }),
    ];

    mockUseNotifications.mockReturnValue({
      data: {
        notifications,
        unreadCount: 0,
        nextCursor: null,
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useNotifications>);

    render(<NotificationPanel onClose={mockOnClose} />);

    await user.click(screen.getByText(/John completed "Click me"/i));

    // Should NOT call markAsRead for already-read notification
    expect(mockMarkAsReadMutate).not.toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call deleteNotification when dismiss button is clicked', async () => {
    const user = userEvent.setup();

    const notifications = [
      createMockNotification({
        id: 'notif-1',
        workspaceId: 'ws-1',
        type: 'task.completed',
        metadata: {
          actorName: 'John',
          entityTitle: 'Test Task',
        },
      }),
    ];

    mockUseNotifications.mockReturnValue({
      data: {
        notifications,
        unreadCount: 1,
        nextCursor: null,
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useNotifications>);

    render(<NotificationPanel onClose={mockOnClose} />);

    const dismissButton = screen.getByLabelText(/dismiss/i);
    await user.click(dismissButton);

    expect(mockDeleteNotificationMutate).toHaveBeenCalledWith({
      workspaceId: 'ws-1',
      recipientId: 'notif-1',
    });
    expect(mockOnClose).not.toHaveBeenCalled(); // onClose should NOT be called on dismiss
  });

  it('should show load more button when there is a next cursor', async () => {
    const notifications = [
      createMockNotification({
        id: 'notif-1',
        metadata: {
          actorName: 'John',
          entityTitle: 'Task 1',
        },
      }),
    ];

    mockUseNotifications.mockReturnValue({
      data: {
        notifications,
        unreadCount: 1,
        nextCursor: 'cursor-123',
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useNotifications>);

    render(<NotificationPanel onClose={mockOnClose} />);

    expect(screen.getByText(/load more/i)).toBeInTheDocument();
  });

  it('should not show load more button when there is no next cursor', () => {
    const notifications = [
      createMockNotification({
        id: 'notif-1',
        metadata: {
          actorName: 'John',
          entityTitle: 'Task 1',
        },
      }),
    ];

    mockUseNotifications.mockReturnValue({
      data: {
        notifications,
        unreadCount: 1,
        nextCursor: null,
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useNotifications>);

    render(<NotificationPanel onClose={mockOnClose} />);

    expect(screen.queryByText(/load more/i)).not.toBeInTheDocument();
  });
});
