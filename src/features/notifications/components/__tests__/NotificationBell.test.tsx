import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { NotificationBell } from '../NotificationBell/NotificationBell';
import { useNotificationUiStore } from '../../stores/notificationUiStore';

// Mock the hooks
vi.mock('../../hooks/useNotifications', () => ({
  useUnreadCount: vi.fn(() => ({ data: 0 })),
  useNotifications: vi.fn(() => ({
    data: { notifications: [], unreadCount: 0, nextCursor: null },
    isLoading: false,
  })),
  useMarkAsRead: vi.fn(() => ({ mutate: vi.fn() })),
  useMarkAllAsRead: vi.fn(() => ({ mutate: vi.fn() })),
  useDeleteNotification: vi.fn(() => ({ mutate: vi.fn() })),
}));

import { useUnreadCount } from '../../hooks/useNotifications';
const mockUseUnreadCount = vi.mocked(useUnreadCount);

describe('NotificationBell', () => {
  beforeEach(() => {
    // Reset store state
    useNotificationUiStore.setState({
      panelOpen: false,
      panelFilter: 'all',
      showToastOnNew: true,
    });

    // Reset mock
    mockUseUnreadCount.mockReturnValue({ data: 0 } as ReturnType<typeof useUnreadCount>);
  });

  it('should render the bell button', () => {
    render(<NotificationBell />);
    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
  });

  it('should not show badge when unread count is 0', () => {
    render(<NotificationBell />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
  });

  it('should show unread count badge when there are unread notifications', () => {
    mockUseUnreadCount.mockReturnValue({ data: 5 } as ReturnType<typeof useUnreadCount>);

    render(<NotificationBell />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /5 unread/i })).toBeInTheDocument();
  });

  it('should show 99+ when unread count exceeds 99', () => {
    mockUseUnreadCount.mockReturnValue({ data: 150 } as ReturnType<typeof useUnreadCount>);

    render(<NotificationBell />);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('should open notification panel on click', async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);

    await user.click(screen.getByRole('button', { name: /notifications/i }));

    // The panel should now be visible (it renders the "Notifications" title)
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('should close panel when clicking the bell again', async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);

    const button = screen.getByRole('button', { name: /notifications/i });

    // Open
    await user.click(button);
    expect(screen.getByText('Notifications')).toBeInTheDocument();

    // Close
    await user.click(button);
    expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
  });

  it('should close panel when Escape key is pressed', async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);

    // Open panel
    await user.click(screen.getByRole('button', { name: /notifications/i }));
    expect(screen.getByText('Notifications')).toBeInTheDocument();

    // Press Escape
    await user.keyboard('{Escape}');
    expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
  });

  it('should toggle panel when N key is pressed', async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);

    // Press N to open
    await user.keyboard('n');
    expect(screen.getByText('Notifications')).toBeInTheDocument();

    // Press N to close
    await user.keyboard('n');
    expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
  });

  it('should not toggle panel when N key is pressed in an input field', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <div>
        <NotificationBell />
        <input type="text" placeholder="Test input" />
      </div>
    );

    const input = container.querySelector('input');
    expect(input).toBeInTheDocument();

    // Focus input and press N
    input?.focus();
    await user.keyboard('n');

    // Panel should NOT open
    expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
  });
});
