import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { NotificationItem } from '../NotificationItem/NotificationItem';
import { createMockNotification } from '@/test/factories';

describe('NotificationItem', () => {
  const mockOnRead = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render notification message', () => {
    const notification = createMockNotification({
      type: 'task.completed',
      metadata: {
        actorName: 'John Doe',
        entityTitle: 'Fix bug',
      },
    });

    render(
      <NotificationItem
        notification={notification}
        onRead={mockOnRead}
        onDelete={mockOnDelete}
        onClick={mockOnClick}
      />
    );

    expect(screen.getByText(/John Doe completed "Fix bug"/i)).toBeInTheDocument();
  });

  it('should show unread indicator for unread notifications', () => {
    const notification = createMockNotification({
      isRead: false,
    });

    const { container } = render(
      <NotificationItem
        notification={notification}
        onRead={mockOnRead}
        onDelete={mockOnDelete}
        onClick={mockOnClick}
      />
    );

    // Check for blue dot indicator (has bg-blue-500 class)
    const indicator = container.querySelector('.bg-blue-500');
    expect(indicator).toBeInTheDocument();
  });

  it('should not show unread indicator for read notifications', () => {
    const notification = createMockNotification({
      isRead: true,
      readAt: new Date().toISOString(),
    });

    const { container } = render(
      <NotificationItem
        notification={notification}
        onRead={mockOnRead}
        onDelete={mockOnDelete}
        onClick={mockOnClick}
      />
    );

    const indicator = container.querySelector('.bg-blue-500');
    expect(indicator).not.toBeInTheDocument();
  });

  it('should show avatar image when avatarUrl is provided', () => {
    const notification = createMockNotification({
      metadata: {
        actorName: 'John Doe',
        actorAvatarUrl: 'https://example.com/avatar.jpg',
      },
    });

    const { container } = render(
      <NotificationItem
        notification={notification}
        onRead={mockOnRead}
        onDelete={mockOnDelete}
        onClick={mockOnClick}
      />
    );

    // Avatar has alt="" so it's presentation role, use container query
    const avatar = container.querySelector('img');
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('should show initials when no avatar URL', () => {
    const notification = createMockNotification({
      metadata: {
        actorName: 'John Doe',
        actorAvatarUrl: undefined,
      },
    });

    render(
      <NotificationItem
        notification={notification}
        onRead={mockOnRead}
        onDelete={mockOnDelete}
        onClick={mockOnClick}
      />
    );

    expect(screen.getByText('JO')).toBeInTheDocument();
  });

  it('should show "?" when actor name is missing', () => {
    const notification = createMockNotification({
      metadata: {
        actorName: undefined,
      },
    });

    render(
      <NotificationItem
        notification={notification}
        onRead={mockOnRead}
        onDelete={mockOnDelete}
        onClick={mockOnClick}
      />
    );

    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('should display relative time', () => {
    const notification = createMockNotification({
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    });

    render(
      <NotificationItem
        notification={notification}
        onRead={mockOnRead}
        onDelete={mockOnDelete}
        onClick={mockOnClick}
      />
    );

    // The exact text depends on formatRelativeTime, but it should show some time indicator
    expect(screen.getByText(/ago|minute/i)).toBeInTheDocument();
  });

  it('should call onRead and onClick when clicked (if unread)', async () => {
    const user = userEvent.setup();
    const notification = createMockNotification({
      type: 'task.completed',
      isRead: false,
      metadata: {
        actorName: 'John',
        entityTitle: 'Test',
      },
    });

    render(
      <NotificationItem
        notification={notification}
        onRead={mockOnRead}
        onDelete={mockOnDelete}
        onClick={mockOnClick}
      />
    );

    // Click the notification
    await user.click(screen.getByText(/John completed "Test"/i));

    expect(mockOnRead).toHaveBeenCalledWith(notification);
    expect(mockOnClick).toHaveBeenCalledWith(notification);
  });

  it('should not call onRead when clicked if already read', async () => {
    const user = userEvent.setup();
    const notification = createMockNotification({
      type: 'task.completed',
      isRead: true,
      readAt: new Date().toISOString(),
      metadata: {
        actorName: 'John',
        entityTitle: 'Test',
      },
    });

    render(
      <NotificationItem
        notification={notification}
        onRead={mockOnRead}
        onDelete={mockOnDelete}
        onClick={mockOnClick}
      />
    );

    await user.click(screen.getByText(/John completed "Test"/i));

    expect(mockOnRead).not.toHaveBeenCalled();
    expect(mockOnClick).toHaveBeenCalledWith(notification);
  });

  it('should call onDelete when dismiss button is clicked', async () => {
    const user = userEvent.setup();
    const notification = createMockNotification();

    render(
      <NotificationItem
        notification={notification}
        onRead={mockOnRead}
        onDelete={mockOnDelete}
        onClick={mockOnClick}
      />
    );

    const dismissButton = screen.getByLabelText(/dismiss/i);
    await user.click(dismissButton);

    expect(mockOnDelete).toHaveBeenCalledWith(notification);
    expect(mockOnClick).not.toHaveBeenCalled(); // Should NOT trigger onClick
  });

  it('should stop propagation when dismiss button is clicked', async () => {
    const user = userEvent.setup();
    const notification = createMockNotification();

    render(
      <NotificationItem
        notification={notification}
        onRead={mockOnRead}
        onDelete={mockOnDelete}
        onClick={mockOnClick}
      />
    );

    const dismissButton = screen.getByLabelText(/dismiss/i);
    await user.click(dismissButton);

    expect(mockOnDelete).toHaveBeenCalled();
    expect(mockOnClick).not.toHaveBeenCalled(); // Propagation stopped
  });

  it('should render different notification types correctly', () => {
    const types = [
      {
        type: 'task.updated',
        metadata: { actorName: 'Alice', entityTitle: 'Update UI' },
        expectedText: /Alice updated "Update UI"/i,
      },
      {
        type: 'member.added',
        metadata: { actorName: 'Bob', workspaceName: 'Team Workspace' },
        expectedText: /Bob added you to "Team Workspace"/i,
      },
      {
        type: 'invitation.received',
        metadata: { actorName: 'Carol', workspaceName: 'New Project' },
        expectedText: /Carol invited you to join "New Project"/i,
      },
    ];

    types.forEach(({ type, metadata, expectedText }) => {
      const notification = createMockNotification({ type, metadata });

      const { unmount } = render(
        <NotificationItem
          notification={notification}
          onRead={mockOnRead}
          onDelete={mockOnDelete}
          onClick={mockOnClick}
        />
      );

      expect(screen.getByText(expectedText)).toBeInTheDocument();
      unmount();
    });
  });

  it('should handle missing metadata gracefully', () => {
    const notification = createMockNotification({
      type: 'task.completed',
      metadata: {
        actorName: undefined,
        entityTitle: undefined,
      },
    });

    render(
      <NotificationItem
        notification={notification}
        onRead={mockOnRead}
        onDelete={mockOnDelete}
        onClick={mockOnClick}
      />
    );

    // Should still render with fallback values (i18n handles this)
    expect(screen.getByText(/someone/i)).toBeInTheDocument();
    expect(screen.getByText(/an item/i)).toBeInTheDocument();
  });
});
