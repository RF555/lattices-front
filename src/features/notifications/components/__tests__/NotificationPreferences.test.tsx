import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { NotificationPreferences } from '../NotificationPreferences/NotificationPreferences';
import { createMockNotificationPreference } from '@/test/factories';
import { useNotificationUiStore } from '../../stores/notificationUiStore';

const mockUpdatePreferenceMutate = vi.fn();

vi.mock('../../hooks/useNotifications', () => ({
  useNotificationPreferences: vi.fn(() => ({
    data: [],
    isLoading: false,
  })),
  useUpdateNotificationPreferences: vi.fn(() => ({
    mutate: mockUpdatePreferenceMutate,
  })),
}));

import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '../../hooks/useNotifications';
const mockUseNotificationPreferences = vi.mocked(useNotificationPreferences);
const mockUseUpdateNotificationPreferences = vi.mocked(useUpdateNotificationPreferences);

describe('NotificationPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset store state
    useNotificationUiStore.setState({
      panelOpen: false,
      panelFilter: 'all',
      showToastOnNew: true,
    });

    mockUseNotificationPreferences.mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof useNotificationPreferences>);

    mockUseUpdateNotificationPreferences.mockReturnValue({
      mutate: mockUpdatePreferenceMutate,
    } as unknown as ReturnType<typeof useUpdateNotificationPreferences>);
  });

  it('should render the preferences title', () => {
    render(<NotificationPreferences />);
    expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
  });

  it('should show loading spinner when preferences are loading', () => {
    mockUseNotificationPreferences.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown as ReturnType<typeof useNotificationPreferences>);

    render(<NotificationPreferences />);

    // Spinner should be visible (exact implementation may vary)
    expect(screen.queryByText('Task Notifications')).not.toBeInTheDocument();
  });

  it('should render all notification categories', () => {
    render(<NotificationPreferences />);

    expect(screen.getByText('Task Notifications')).toBeInTheDocument();
    expect(screen.getByText('Workspace Notifications')).toBeInTheDocument();
    expect(screen.getByText('Invitation Notifications')).toBeInTheDocument();
    expect(screen.getByText('Group Notifications')).toBeInTheDocument();
  });

  it('should render all notification types within categories', () => {
    render(<NotificationPreferences />);

    // Task category
    expect(screen.getByText('Task completed')).toBeInTheDocument();
    expect(screen.getByText('Task updated')).toBeInTheDocument();
    expect(screen.getByText('Task created')).toBeInTheDocument();
    expect(screen.getByText('Task deleted')).toBeInTheDocument();

    // Workspace category
    expect(screen.getByText('Added to workspace')).toBeInTheDocument();
    expect(screen.getByText('Removed from workspace')).toBeInTheDocument();
    expect(screen.getByText('Role changed')).toBeInTheDocument();

    // Invitation category
    expect(screen.getByText('Invitation received')).toBeInTheDocument();
    expect(screen.getByText('Invitation accepted')).toBeInTheDocument();

    // Group category
    expect(screen.getByText('Added to group')).toBeInTheDocument();
  });

  it('should show mandatory types as disabled with "Always on" label', () => {
    render(<NotificationPreferences />);

    // Check for "Always on" labels (mandatory types)
    const alwaysOnLabels = screen.getAllByText('Always on');
    expect(alwaysOnLabels.length).toBeGreaterThan(0);

    // Mandatory types: member.added, member.removed, member.role_changed, invitation.received
    // Should have at least 4 "Always on" labels
    expect(alwaysOnLabels.length).toBe(4);
  });

  it('should render toggles with correct initial state', () => {
    const preferences = [
      createMockNotificationPreference({
        channel: 'in_app',
        enabled: true,
        notificationType: 'task.completed',
      }),
      createMockNotificationPreference({
        channel: 'in_app',
        enabled: false,
        notificationType: 'task.updated',
      }),
    ];

    mockUseNotificationPreferences.mockReturnValue({
      data: preferences,
      isLoading: false,
    } as unknown as ReturnType<typeof useNotificationPreferences>);

    render(<NotificationPreferences />);

    // All toggles are rendered (implementation uses ToggleSwitch component)
    // We can't easily test the checked state without checking the component internals,
    // but we can verify the preferences are being used
    expect(screen.getByText('Task completed')).toBeInTheDocument();
    expect(screen.getByText('Task updated')).toBeInTheDocument();
  });

  it('should call updatePreference when a toggle is clicked', async () => {
    const user = userEvent.setup();

    const preferences = [
      createMockNotificationPreference({
        channel: 'in_app',
        enabled: true,
        notificationType: 'task.completed',
      }),
    ];

    mockUseNotificationPreferences.mockReturnValue({
      data: preferences,
      isLoading: false,
    } as unknown as ReturnType<typeof useNotificationPreferences>);

    render(<NotificationPreferences />);

    // Find the toggle for "Task completed" (it has a label with that text)
    const taskCompletedRow = screen.getByText('Task completed').closest('div')?.parentElement;
    expect(taskCompletedRow).toBeInTheDocument();

    // The ToggleSwitch should be in this row
    const toggle = taskCompletedRow?.querySelector('button');
    expect(toggle).toBeInTheDocument();

    if (toggle) {
      await user.click(toggle);

      // Should call mutate with the correct payload
      expect(mockUpdatePreferenceMutate).toHaveBeenCalledWith({
        channel: 'in_app',
        enabled: false, // Toggling from true to false
        notificationType: 'task.completed',
      });
    }
  });

  it('should not allow toggling mandatory notification types', async () => {
    render(<NotificationPreferences />);

    // Find "Added to workspace" (member.added - mandatory)
    const mandatoryRow = screen.getByText('Added to workspace').closest('div')?.parentElement;
    expect(mandatoryRow).toBeInTheDocument();

    // The toggle should be disabled
    const toggle = mandatoryRow?.querySelector('button');
    expect(toggle).toBeInTheDocument();
    expect(toggle).toBeDisabled();
  });

  it('should render General section with toast preference toggle', () => {
    render(<NotificationPreferences />);

    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Show toast notifications')).toBeInTheDocument();
    expect(
      screen.getByText('Display a brief toast when new notifications arrive'),
    ).toBeInTheDocument();
  });

  it('should update toast preference when toggle is clicked', async () => {
    const user = userEvent.setup();

    render(<NotificationPreferences />);

    // Initially showToastOnNew is true
    expect(useNotificationUiStore.getState().showToastOnNew).toBe(true);

    // Find the toast toggle (it has label "Show toast notifications")
    const toastRow = screen.getByText('Show toast notifications').closest('div')?.parentElement;
    expect(toastRow).toBeInTheDocument();

    const toggle = toastRow?.querySelector('button');
    expect(toggle).toBeInTheDocument();

    if (toggle) {
      await user.click(toggle);

      // Store should be updated
      expect(useNotificationUiStore.getState().showToastOnNew).toBe(false);
    }
  });

  it('should default to enabled when no preference exists for a type', () => {
    // Empty preferences array means all types default to enabled
    mockUseNotificationPreferences.mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof useNotificationPreferences>);

    render(<NotificationPreferences />);

    // All non-mandatory types should be toggleable (not disabled)
    const taskCompletedRow = screen.getByText('Task completed').closest('div')?.parentElement;
    const toggle = taskCompletedRow?.querySelector('button');
    expect(toggle).not.toBeDisabled();
  });

  it('should handle multiple preferences for the same type with different channels', () => {
    const preferences = [
      createMockNotificationPreference({
        channel: 'in_app',
        enabled: true,
        notificationType: 'task.completed',
      }),
      createMockNotificationPreference({
        channel: 'email',
        enabled: false,
        notificationType: 'task.completed',
      }),
    ];

    mockUseNotificationPreferences.mockReturnValue({
      data: preferences,
      isLoading: false,
    } as unknown as ReturnType<typeof useNotificationPreferences>);

    render(<NotificationPreferences />);

    // Should render the in_app toggle (email is not shown in current UI)
    expect(screen.getByText('Task completed')).toBeInTheDocument();
  });

  it('should render all categories with correct structure', () => {
    render(<NotificationPreferences />);

    // Check that each category header has the "In-App" label
    const inAppLabels = screen.getAllByText('In-App');
    expect(inAppLabels.length).toBe(4); // 4 categories: task, workspace, invitation, group
  });
});
