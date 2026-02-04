import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { NotificationBell } from '../NotificationBell/NotificationBell';

// Mock the hooks
vi.mock('../../hooks/useNotifications', () => ({
  useUnreadCount: vi.fn(() => ({ data: 0 })),
  useNotifications: vi.fn(() => ({ data: [], isLoading: false })),
  useMarkAsRead: vi.fn(() => ({ mutate: vi.fn() })),
  useMarkAllAsRead: vi.fn(() => ({ mutate: vi.fn() })),
}));

import { useUnreadCount } from '../../hooks/useNotifications';
const mockUseUnreadCount = vi.mocked(useUnreadCount);

describe('NotificationBell', () => {
  beforeEach(() => {
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
});
